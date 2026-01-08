"""Serializers for API endpoints."""

from rest_framework import serializers
from .models import SearchHistory


class SearchHistorySerializer(serializers.ModelSerializer):
    """Serializer for SearchHistory model."""
    
    id = serializers.IntegerField(read_only=True)
    timestamp = serializers.DateTimeField(source='searched_at', read_only=True)
    
    class Meta:
        model = SearchHistory
        fields = ['id', 'product_name', 'best_price', 'store', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class SearchHistoryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating search history entries."""
    
    class Meta:
        model = SearchHistory
        fields = ['product_name', 'best_price', 'store']
    
    def create(self, validated_data):
        # Automatically set the user from the request
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)




