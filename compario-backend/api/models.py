"""API Models for Compario."""

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class SearchHistory(models.Model):
    """
    Model to store user's search history.
    Each user has their own search history.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='search_history',
        help_text='User who performed the search'
    )
    
    product_name = models.CharField(
        max_length=255,
        help_text='Name of the product searched'
    )
    
    best_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Best price found for the product'
    )
    
    store = models.CharField(
        max_length=100,
        help_text='Store where best price was found'
    )
    
    searched_at = models.DateTimeField(
        default=timezone.now,
        help_text='When the search was performed'
    )
    
    class Meta:
        verbose_name = 'Search History'
        verbose_name_plural = 'Search Histories'
        ordering = ['-searched_at']
        indexes = [
            models.Index(fields=['user', '-searched_at']),
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.product_name} ({self.searched_at})"
