"""
Hugging Face Image Classification Service
FREE alternative to Google Vision API - No billing required!
"""

import os
import requests
from typing import Dict, List
import logging
from decouple import config
from PIL import Image
import io

logger = logging.getLogger(__name__)


class HuggingFaceVisionService:
    """
    Service for product detection using Hugging Face's free API.
    No billing account required!
    """
    
    def __init__(self):
        """Initialize the Hugging Face service."""
        self.api_token = config('HUGGINGFACE_API_TOKEN', default='')
        # Using a more reliable model - Facebook's DeiT
        self.api_url = "https://api-inference.huggingface.co/models/facebook/deit-base-distilled-patch16-224"
        
        # Alternative models (fallback if main one fails):
        self.fallback_urls = [
            "https://api-inference.huggingface.co/models/google/vit-base-patch16-224",
            "https://api-inference.huggingface.co/models/microsoft/swin-base-patch4-window7-224",
        ]
        self.current_url_index = 0
        
        if not self.api_token:
            logger.info(
                "HUGGINGFACE_API_TOKEN not found. "
                "Using public API (may be slower on first request). "
                "Get free token at: https://huggingface.co/settings/tokens (optional)"
            )
    
    def detect_product(self, image_file) -> Dict:
        """
        Detect product from image using Hugging Face.
        
        Args:
            image_file: Django UploadedFile object
            
        Returns:
            Dict with 'success', 'product_name', 'labels', 'confidence'
        """
        try:
            # Read and prepare image
            image_file.seek(0)
            image_bytes = image_file.read()
            
            # Prepare request
            headers = {}
            if self.api_token:
                headers["Authorization"] = f"Bearer {self.api_token}"
            
            # Make API request with retry logic
            logger.info(f"Calling Hugging Face API: {self.api_url}")
            max_retries = 3
            retry_count = 0
            
            while retry_count < max_retries:
                try:
                    response = requests.post(
                        self.api_url,
                        headers=headers,
                        data=image_bytes,
                        timeout=60
                    )
                    
                    # Handle model loading (503)
                    if response.status_code == 503:
                        logger.warning(f"Model loading (attempt {retry_count + 1}/{max_retries}), waiting 15 seconds...")
                        import time
                        time.sleep(15)
                        retry_count += 1
                        continue
                    
                    # Handle success
                    if response.status_code == 200:
                        result = response.json()
                        break
                    
                    # Handle other errors
                    if response.status_code in [404, 410]:
                        # Model not available, try fallback
                        if self.current_url_index < len(self.fallback_urls):
                            logger.warning(f"Model unavailable, trying fallback {self.current_url_index + 1}")
                            self.api_url = self.fallback_urls[self.current_url_index]
                            self.current_url_index += 1
                            retry_count += 1
                            continue
                    
                    # Other errors
                    error_msg = f"API returned status {response.status_code}"
                    try:
                        error_data = response.json()
                        if isinstance(error_data, dict):
                            error_msg = error_data.get('error', error_msg)
                        elif isinstance(error_data, str):
                            error_msg = error_data
                    except:
                        error_msg = response.text[:200] if response.text else error_msg
                    
                    logger.error(f"Hugging Face API error: {error_msg}")
                    return {
                        'success': False,
                        'error': f'Hugging Face API error: {error_msg}'
                    }
                    
                except requests.exceptions.Timeout:
                    retry_count += 1
                    if retry_count >= max_retries:
                        return {
                            'success': False,
                            'error': 'Request timeout. Please try again.'
                        }
                    logger.warning(f"Timeout, retrying ({retry_count}/{max_retries})...")
                    import time
                    time.sleep(5)
                    continue
                except Exception as e:
                    logger.error(f"Request error: {str(e)}")
                    return {
                        'success': False,
                        'error': f'Failed to connect to Hugging Face API: {str(e)}'
                    }
            
            if retry_count >= max_retries:
                return {
                    'success': False,
                    'error': 'Model is still loading. Please try again in a few moments.'
                }
            
            # Verify result format
            if not result:
                logger.error("Empty response from Hugging Face API")
                return {
                    'success': False,
                    'error': 'Empty response from Hugging Face API'
                }
            
            logger.info(f"Raw Hugging Face response: {str(result)[:500]}")
            
            # Extract product information
            if isinstance(result, list) and len(result) > 0:
                # Standard classification response
                top_result = result[0]
                product_name = top_result.get('label', 'Unknown Product')
                confidence = round(top_result.get('score', 0) * 100, 2)
                
                # Get top 5 labels
                labels = [item.get('label', '') for item in result[:5]]
                
                logger.info(f"Hugging Face success: Detected '{product_name}' with {confidence}% confidence")
                
                return {
                    'success': True,
                    'product_name': self._clean_product_name(product_name),
                    'labels': labels,
                    'confidence': confidence,
                    'source': 'huggingface'
                }
            else:
                return {
                    'success': False,
                    'error': 'Unexpected response format from Hugging Face API'
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Hugging Face API error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to connect to Hugging Face API: {str(e)}'
            }
        except Exception as e:
            logger.error(f"Hugging Face processing error: {str(e)}")
            return {
                'success': False,
                'error': f'Error processing image: {str(e)}'
            }
    
    def _clean_product_name(self, label: str) -> str:
        """
        Clean and format the product name from Hugging Face labels.
        Hugging Face returns ImageNet labels, we need to make them product-friendly.
        """
        # Remove common prefixes
        label = label.replace('a ', '').replace('an ', '')
        
        # Common ImageNet to product name mappings
        product_mappings = {
            'laptop computer': 'Laptop',
            'desktop computer': 'Desktop Computer',
            'mobile phone': 'Smartphone',
            'cellular telephone': 'Smartphone',
            'iPod': 'MP3 Player',
            'television': 'TV',
            'monitor': 'Computer Monitor',
            'keyboard': 'Keyboard',
            'mouse': 'Computer Mouse',
            'printer': 'Printer',
            'camera': 'Camera',
            'headphone': 'Headphones',
            'speaker': 'Speaker',
            'watch': 'Watch',
            'sunglass': 'Sunglasses',
            'backpack': 'Backpack',
            'handbag': 'Handbag',
            'suitcase': 'Suitcase',
            'bottle': 'Bottle',
            'cup': 'Cup',
            'bowl': 'Bowl',
            'plate': 'Plate',
        }
        
        # Check for exact matches
        label_lower = label.lower()
        for key, value in product_mappings.items():
            if key in label_lower:
                return value
        
        # Capitalize first letter of each word
        return ' '.join(word.capitalize() for word in label.split('_'))


