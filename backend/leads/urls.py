from django.urls import path

from leads import views

urlpatterns = [
    path('dashboard/', views.dashboard, name='dashboard'),
    path('leads/', views.list_leads, name='list_leads'),
    path('leads/create/', views.create_lead, name='create_lead'),
    path('router/', views.update_router, name='update_router'),
    path('leads/stream/', views.lead_stream, name='lead_stream'),
]
