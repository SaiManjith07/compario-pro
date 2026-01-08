"""API Views for Compario."""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser
from django.contrib.auth import get_user_model
from decouple import config
import logging
import os

# Import vision services conditionally
try:
    from .services.vision_service import GoogleVisionService
    GOOGLE_VISION_AVAILABLE = True
except ImportError:
    GOOGLE_VISION_AVAILABLE = False

try:
    from .services.vision_service_huggingface import HuggingFaceVisionService
    HUGGINGFACE_AVAILABLE = True
except ImportError:
    HUGGINGFACE_AVAILABLE = False

try:
    from .services.vision_service_simple import SimpleVisionService
    SIMPLE_VISION_AVAILABLE = True
except ImportError:
    SIMPLE_VISION_AVAILABLE = False

# Import models and serializers
from .models import SearchHistory
from .serializers import SearchHistorySerializer, SearchHistoryCreateSerializer

User = get_user_model()
logger = logging.getLogger(__name__)


class ImageUploadView(APIView):
    """
    API endpoint for image upload and product detection.
    POST /api/upload-image/
    """
    parser_classes = [MultiPartParser]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        if 'image' not in request.FILES:
            return Response(
                {'success': False, 'error': 'No image provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_file = request.FILES['image']
        
        # Validate file size (max 5MB)
        if image_file.size > 5 * 1024 * 1024:
            return Response(
                {'success': False, 'error': 'Image too large (max 5MB)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file type
        if not image_file.content_type in ['image/jpeg', 'image/jpg', 'image/png']:
            return Response(
                {'success': False, 'error': 'Invalid format (JPG/PNG only)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            use_google_vision = config('USE_GOOGLE_VISION', default='True', cast=bool)
            use_huggingface = config('USE_HUGGINGFACE_VISION', default='False', cast=bool)
            use_simple_fallback = config('USE_SIMPLE_VISION_FALLBACK', default='False', cast=bool)

            if use_simple_fallback and SIMPLE_VISION_AVAILABLE:
                vision_service = SimpleVisionService()
            elif use_google_vision and GOOGLE_VISION_AVAILABLE:
                try:
                    vision_service = GoogleVisionService()
                except Exception as e:
                    logger.warning(f"Google Vision init failed: {str(e)}, trying Hugging Face")
                    if use_huggingface and HUGGINGFACE_AVAILABLE:
                        try: vision_service = HuggingFaceVisionService()
                        except: vision_service = SimpleVisionService() if SIMPLE_VISION_AVAILABLE else None
                    elif SIMPLE_VISION_AVAILABLE: vision_service = SimpleVisionService()
                    else: raise
            elif use_huggingface and HUGGINGFACE_AVAILABLE:
                try: vision_service = HuggingFaceVisionService()
                except Exception as e:
                    logger.warning(f"Hugging Face init failed: {str(e)}, using simple fallback")
                    vision_service = SimpleVisionService() if SIMPLE_VISION_AVAILABLE else None
            elif SIMPLE_VISION_AVAILABLE:
                vision_service = SimpleVisionService()
            else:
                return Response({'success': False, 'error': 'No vision service configured.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

            if vision_service is None:
                raise ValueError("No active vision service could be initialized.")

            result = vision_service.detect_product(image_file)

            if not result.get('success'):
                error_msg = result.get('error', 'Failed to process image')
                logger.error(f"❌ Vision API failed: {error_msg}")
                logger.error(f"Full result: {result}")
                # Return 200 OK with success: False for frontend to handle gracefully
                return Response({'success': False, 'error': error_msg}, status=status.HTTP_200_OK)

            logger.info(f"Successfully detected product: {result.get('product_name')}")
            return Response(result, status=status.HTTP_200_OK)

        except ValueError as e:
            logger.error(f"Configuration error: {str(e)}")
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            logger.error(f"Image upload error: {str(e)}", exc_info=True)
            return Response({'success': False, 'error': 'An unexpected error occurred while processing the image. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SearchHistoryListView(APIView):
    """
    API endpoint to get user's search history.
    GET /api/history/ - Get all history entries for current user
    POST /api/history/ - Create a new history entry
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all search history entries for the current user."""
        history = SearchHistory.objects.filter(user=request.user).order_by('-searched_at')[:50]
        serializer = SearchHistorySerializer(history, many=True)
        return Response({
            'success': True,
            'history': serializer.data
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Create a new search history entry."""
        serializer = SearchHistoryCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'History entry created',
                'entry': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class SearchHistoryDeleteView(APIView):
    """
    API endpoint to delete a search history entry.
    DELETE /api/history/<id>/ - Delete specific history entry
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, pk):
        """Delete a specific history entry (only if it belongs to the user)."""
        try:
            history_entry = SearchHistory.objects.get(pk=pk, user=request.user)
            history_entry.delete()
            return Response({
                'success': True,
                'message': 'History entry deleted'
            }, status=status.HTTP_200_OK)
        except SearchHistory.DoesNotExist:
            return Response({
                'success': False,
                'error': 'History entry not found or you do not have permission'
            }, status=status.HTTP_404_NOT_FOUND)


class SearchHistoryClearView(APIView):
    """
    API endpoint to clear all search history for current user.
    DELETE /api/history/clear/ - Delete all history entries for current user
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        """Delete all search history entries for the current user."""
        deleted_count, _ = SearchHistory.objects.filter(user=request.user).delete()
        return Response({
            'success': True,
            'message': f'Cleared {deleted_count} history entries'
        }, status=status.HTTP_200_OK)
