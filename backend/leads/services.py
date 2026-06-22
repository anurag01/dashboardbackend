from __future__ import annotations

import requests
from django.conf import settings

from leads.models import Lead

BUDGET_VALUE_MAP = {
    Lead.BUDGET_UNDER_10K: 5000,
    Lead.BUDGET_10K_TO_50K: 30000,
    Lead.BUDGET_ABOVE_50K: 75000,
}

FREE_EMAIL_DOMAINS = {
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'aol.com',
    'proton.me',
    'protonmail.com',
    'live.com',
}


def is_corporate_email(email: str) -> bool:
    domain = email.split('@')[-1].lower()
    return domain not in FREE_EMAIL_DOMAINS


def serialize_lead(lead: Lead) -> dict:
    return {
        'id': lead.id,
        'firstName': lead.first_name,
        'lastName': lead.last_name,
        'corporateEmail': lead.corporate_email,
        'companyName': lead.company_name,
        'estimatedAnnualBudget': lead.estimated_annual_budget,
        'estimatedAnnualBudgetLabel': lead.get_estimated_annual_budget_display(),
        'estimatedBudgetValue': lead.estimated_budget_value,
        'localStatus': lead.local_status,
        'hubspotSyncStatus': lead.hubspot_sync_status,
        'hubspotMessage': lead.hubspot_message,
        'hubspotContactId': lead.hubspot_contact_id,
        'createdAt': lead.created_at.isoformat(),
    }


def sync_lead_to_hubspot(lead: Lead) -> dict:
    token = settings.HUBSPOT_ACCESS_TOKEN
    if not token:
        return {
            'status': Lead.HUBSPOT_STATUS_FAILED,
            'message': 'HubSpot access token not configured.',
            'is_connected': False,
            'router_message': 'Token missing. Add HUBSPOT_ACCESS_TOKEN in backend/.env',
        }

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
    }
    payload = {
        'properties': {
            'email': lead.corporate_email,
            'firstname': lead.first_name,
            'lastname': lead.last_name,
            'company': lead.company_name,
            'lifecyclestage': 'lead',
            'hs_lead_status': 'NEW',
            'annualrevenue': str(lead.estimated_budget_value),
        }
    }

    try:
        response = requests.post(
            'https://api.hubapi.com/crm/v3/objects/contacts',
            headers=headers,
            json=payload,
            timeout=12,
        )
    except requests.RequestException as exc:
        return {
            'status': Lead.HUBSPOT_STATUS_FAILED,
            'message': f'HubSpot request failed: {exc}',
            'is_connected': False,
            'router_message': 'HubSpot unreachable.',
        }

    if response.status_code in (200, 201):
        body = response.json()
        return {
            'status': Lead.HUBSPOT_STATUS_SYNCED,
            'message': 'Lead synced to HubSpot.',
            'contact_id': str(body.get('id', '')),
            'is_connected': True,
            'router_message': 'Connected and syncing.',
        }

    if response.status_code == 409:
        return {
            'status': Lead.HUBSPOT_STATUS_SYNCED,
            'message': 'Contact already exists in HubSpot.',
            'is_connected': True,
            'router_message': 'Connected and syncing.',
        }

    return {
        'status': Lead.HUBSPOT_STATUS_FAILED,
        'message': f'HubSpot rejected lead ({response.status_code}).',
        'is_connected': False,
        'router_message': 'Connection error while syncing.',
    }
