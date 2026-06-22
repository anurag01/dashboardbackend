import json
from datetime import datetime, timezone

from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from leads.events import get_next_event, publish_event, subscribe
from leads.models import HubSpotRouterState, Lead
from leads.services import (
	BUDGET_VALUE_MAP,
	is_corporate_email,
	serialize_lead,
	sync_lead_to_hubspot,
)


def _router_state() -> HubSpotRouterState:
	state, _ = HubSpotRouterState.objects.get_or_create(id=1)
	return state


def _analytics_payload() -> dict:
	leads = Lead.objects.all()
	total_leads = leads.count()
	total_pipeline_value = sum(lead.estimated_budget_value for lead in leads)
	return {
		'totalLeads': total_leads,
		'totalPipelineValue': total_pipeline_value,
	}


def _router_payload() -> dict:
	state = _router_state()
	return {
		'isEnabled': state.is_enabled,
		'isConnected': state.is_connected,
		'statusMessage': state.status_message,
		'lastCheckAt': state.last_check_at.isoformat() if state.last_check_at else None,
	}


def _dashboard_payload() -> dict:
	return {
		'leads': [serialize_lead(lead) for lead in Lead.objects.all()],
		'analytics': _analytics_payload(),
		'router': _router_payload(),
	}


@require_GET
def dashboard(request):
	return JsonResponse(_dashboard_payload())


@require_GET
def list_leads(request):
	payload = {'leads': [serialize_lead(lead) for lead in Lead.objects.all()]}
	return JsonResponse(payload)


@csrf_exempt
@require_http_methods(['POST'])
def create_lead(request):
	try:
		data = json.loads(request.body.decode('utf-8'))
	except (json.JSONDecodeError, UnicodeDecodeError):
		return JsonResponse({'error': 'Invalid JSON payload.'}, status=400)

	required_fields = ['firstName', 'lastName', 'corporateEmail', 'companyName', 'estimatedAnnualBudget']
	for field in required_fields:
		if not str(data.get(field, '')).strip():
			return JsonResponse({'error': f'Missing required field: {field}'}, status=400)

	budget = data['estimatedAnnualBudget']
	if budget not in BUDGET_VALUE_MAP:
		return JsonResponse({'error': 'Invalid budget option.'}, status=400)

	lead = Lead(
		first_name=data['firstName'].strip(),
		last_name=data['lastName'].strip(),
		corporate_email=data['corporateEmail'].strip().lower(),
		company_name=data['companyName'].strip(),
		estimated_annual_budget=budget,
		estimated_budget_value=BUDGET_VALUE_MAP[budget],
	)

	if not is_corporate_email(lead.corporate_email):
		lead.local_status = Lead.LOCAL_STATUS_REJECTED
		lead.hubspot_sync_status = Lead.HUBSPOT_STATUS_SKIPPED
		lead.hubspot_message = 'Corporate email required.'

	try:
		lead.save()
	except Exception as exc:
		return JsonResponse({'error': f'Unable to save lead: {exc}'}, status=400)

	state = _router_state()
	if lead.local_status == Lead.LOCAL_STATUS_INGESTED:
		if not state.is_enabled:
			lead.hubspot_sync_status = Lead.HUBSPOT_STATUS_PAUSED
			lead.hubspot_message = 'HubSpot router disabled by user.'
		else:
			sync_result = sync_lead_to_hubspot(lead)
			lead.hubspot_sync_status = sync_result['status']
			lead.hubspot_message = sync_result.get('message', '')
			lead.hubspot_contact_id = sync_result.get('contact_id', '')
			state.is_connected = sync_result.get('is_connected', False)
			state.status_message = sync_result.get('router_message', '')
			state.last_check_at = datetime.now(timezone.utc)
			state.save(update_fields=['is_connected', 'status_message', 'last_check_at'])
		lead.save(update_fields=['hubspot_sync_status', 'hubspot_message', 'hubspot_contact_id', 'updated_at'])

	payload = {
		'type': 'dashboard_update',
		'lead': serialize_lead(lead),
		'analytics': _analytics_payload(),
		'router': _router_payload(),
	}
	publish_event(payload)

	return JsonResponse({'lead': serialize_lead(lead)}, status=201)


@csrf_exempt
@require_http_methods(['POST'])
def update_router(request):
	try:
		data = json.loads(request.body.decode('utf-8'))
	except (json.JSONDecodeError, UnicodeDecodeError):
		return JsonResponse({'error': 'Invalid JSON payload.'}, status=400)

	if 'isEnabled' not in data:
		return JsonResponse({'error': 'Missing isEnabled field.'}, status=400)

	state = _router_state()
	state.is_enabled = bool(data['isEnabled'])
	state.status_message = 'Router enabled.' if state.is_enabled else 'Router paused manually.'
	state.save(update_fields=['is_enabled', 'status_message', 'last_check_at'])

	publish_event(
		{
			'type': 'router_update',
			'router': _router_payload(),
			'analytics': _analytics_payload(),
		}
	)
	return JsonResponse({'router': _router_payload()})


@require_GET
def lead_stream(request):
	event_queue = subscribe()

	def event_stream():
		initial = json.dumps({'type': 'snapshot', **_dashboard_payload()})
		yield f'data: {initial}\n\n'

		while True:
			payload = get_next_event(event_queue)
			if payload is None:
				yield ':\n\n'
				continue
			yield f'data: {json.dumps(payload)}\n\n'

	response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
	response['Cache-Control'] = 'no-cache'
	response['X-Accel-Buffering'] = 'no'
	response['Access-Control-Allow-Origin'] = '*'
	response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
	response['Access-Control-Allow-Headers'] = 'Content-Type'
	return response
