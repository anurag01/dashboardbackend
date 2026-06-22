from django.db import models


class Lead(models.Model):
	BUDGET_UNDER_10K = 'UNDER_10K'
	BUDGET_10K_TO_50K = '10K_TO_50K'
	BUDGET_ABOVE_50K = 'ABOVE_50K'
	BUDGET_CHOICES = [
		(BUDGET_UNDER_10K, 'Under $10k'),
		(BUDGET_10K_TO_50K, '$10k-$50k'),
		(BUDGET_ABOVE_50K, 'Greater than $50k'),
	]

	LOCAL_STATUS_INGESTED = 'INGESTED'
	LOCAL_STATUS_REJECTED = 'REJECTED'
	LOCAL_STATUS_CHOICES = [
		(LOCAL_STATUS_INGESTED, 'Ingested'),
		(LOCAL_STATUS_REJECTED, 'Rejected'),
	]

	HUBSPOT_STATUS_PENDING = 'PENDING'
	HUBSPOT_STATUS_SYNCED = 'SYNCED'
	HUBSPOT_STATUS_FAILED = 'FAILED'
	HUBSPOT_STATUS_PAUSED = 'PAUSED'
	HUBSPOT_STATUS_SKIPPED = 'SKIPPED'
	HUBSPOT_STATUS_CHOICES = [
		(HUBSPOT_STATUS_PENDING, 'Pending'),
		(HUBSPOT_STATUS_SYNCED, 'Synced'),
		(HUBSPOT_STATUS_FAILED, 'Failed'),
		(HUBSPOT_STATUS_PAUSED, 'Paused'),
		(HUBSPOT_STATUS_SKIPPED, 'Skipped'),
	]

	first_name = models.CharField(max_length=80)
	last_name = models.CharField(max_length=80)
	corporate_email = models.EmailField(unique=True)
	company_name = models.CharField(max_length=140)
	estimated_annual_budget = models.CharField(max_length=20, choices=BUDGET_CHOICES)
	estimated_budget_value = models.PositiveIntegerField(default=0)
	local_status = models.CharField(
		max_length=20,
		choices=LOCAL_STATUS_CHOICES,
		default=LOCAL_STATUS_INGESTED,
	)
	hubspot_sync_status = models.CharField(
		max_length=20,
		choices=HUBSPOT_STATUS_CHOICES,
		default=HUBSPOT_STATUS_PENDING,
	)
	hubspot_contact_id = models.CharField(max_length=50, blank=True)
	hubspot_message = models.CharField(max_length=255, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['-created_at']

	def __str__(self):
		return f'{self.first_name} {self.last_name} ({self.corporate_email})'


class HubSpotRouterState(models.Model):
	is_enabled = models.BooleanField(default=True)
	is_connected = models.BooleanField(default=False)
	last_check_at = models.DateTimeField(auto_now=True)
	status_message = models.CharField(max_length=255, blank=True)

	def __str__(self):
		return f'HubSpot router enabled={self.is_enabled} connected={self.is_connected}'
