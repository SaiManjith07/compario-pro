"""API URL Configuration."""

from django.urls import path
from . import views

app_name = 'api'

urlpatterns = [
    # Image upload and product detection
    path('upload-image/', views.ImageUploadView.as_view(), name='upload-image'),
    
    # Search History endpoints
    path('history/', views.SearchHistoryListView.as_view(), name='history-list'),
    path('history/clear/', views.SearchHistoryClearView.as_view(), name='history-clear'),
    path('history/<int:pk>/', views.SearchHistoryDeleteView.as_view(), name='history-delete'),
]

