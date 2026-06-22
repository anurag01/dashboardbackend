from django.contrib import admin
from leads.models import HubSpotRouterState, Lead


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
	list_display = (
		'first_name',
		'last_name',
		'corporate_email',
		'company_name',
		'estimated_annual_budget',
		'local_status',
		'hubspot_sync_status',
		'created_at',
	)
	search_fields = ('first_name', 'last_name', 'corporate_email', 'company_name')
	list_filter = ('estimated_annual_budget', 'local_status', 'hubspot_sync_status')


@admin.register(HubSpotRouterState)
class HubSpotRouterStateAdmin(admin.ModelAdmin):
	list_display = ('is_enabled', 'is_connected', 'status_message', 'last_check_at')
