"""
Simple Vision Service - Fallback option
Uses basic image analysis when external APIs are unavailable
"""

import logging
from typing import Dict
from PIL import Image
import io

logger = logging.getLogger(__name__)


class SimpleVisionService:
    """
    Simple fallback vision service.
    Provides basic product detection when external APIs are unavailable.
    """
    
    def detect_product(self, image_file) -> Dict:
        """
        Basic product detection using image analysis.
        This is a fallback when external APIs don't work.
        """
        try:
            # Read image
            image_file.seek(0)
            image_bytes = image_file.read()
            
            # Open image with PIL
            image = Image.open(io.BytesIO(image_bytes))
            width, height = image.size
            
            # Basic analysis
            # This is a simple fallback - in production, use proper ML model
            product_name = "Product"
            
            # Try to infer from image dimensions (very basic)
            aspect_ratio = width / height if height > 0 else 1
            
            if aspect_ratio > 1.5:
                product_name = "Smartphone or Mobile Device"
            elif aspect_ratio < 0.7:
                product_name = "Laptop or Tablet"
            else:
                product_name = "Product"
            
            logger.info(f"Simple vision service detected: {product_name}")
            
            return {
                'success': True,
                'product_name': product_name,
                'labels': [product_name.lower()],
                'confidence': 50.0,  # Lower confidence for simple detection
                'source': 'simple_fallback',
                'note': 'Using basic detection. For better results, configure Hugging Face or Google Vision API.'
            }
            
        except Exception as e:
            logger.error(f"Simple vision error: {str(e)}")
            return {
                'success': False,
                'error': f'Error processing image: {str(e)}'
            }

