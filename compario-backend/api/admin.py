"""Admin configuration for API app."""

from django.contrib import admin
from .models import SearchHistory


@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    """Admin interface for SearchHistory model."""
    list_display = ['user', 'product_name', 'best_price', 'store', 'searched_at']
    list_filter = ['store', 'searched_at']
    search_fields = ['product_name', 'user__email']
    readonly_fields = ['searched_at']
    ordering = ['-searched_at']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('user')
