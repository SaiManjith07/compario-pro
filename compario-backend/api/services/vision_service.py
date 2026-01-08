"""
Google Cloud Vision API Service
Handles product detection from images using Google Vision API
API key is stored ONLY in backend .env file - never exposed to frontend
"""

import os
import base64
import requests
from typing import Dict, List, Optional
import logging
import re
from decouple import config

logger = logging.getLogger(__name__)


class GoogleVisionService:
    """
    Service for interacting with Google Cloud Vision API.
    All API calls are made server-side, keeping the API key secure.
    """
    
    def __init__(self):
        """Initialize the Vision API service with API key from environment."""
        self.api_key = config('GOOGLE_VISION_API_KEY', default='')
        
        if not self.api_key:
            raise ValueError(
                "GOOGLE_VISION_API_KEY not found in environment variables. "
                "Please add it to your .env file."
            )
        
        self.api_url = f'https://vision.googleapis.com/v1/images:annotate?key={self.api_key}'
    
    def detect_product(self, image_file) -> Dict:
        """
        Detect product information from an uploaded image.
        
        Args:
            image_file: Django UploadedFile object
            
        Returns:
            Dict with 'success', 'product_name', 'labels', and optional 'error'
        """
        try:
            # Read image content
            image_file.seek(0)  # Reset file pointer
            image_content = image_file.read()
            
            # Encode image to base64
            image_base64 = base64.b64encode(image_content).decode('utf-8')
            
            # Prepare API request payload
            # Using multiple detection methods for better accuracy
            payload = {
                "requests": [{
                    "image": {"content": image_base64},
                    "features": [
                        {
                            "type": "LABEL_DETECTION",
                            "maxResults": 30  # Increased for more options including brand logos
                        },
                        {
                            "type": "OBJECT_LOCALIZATION",
                            "maxResults": 15  # Increased for better product and logo detection
                        },
                        {
                            "type": "WEB_DETECTION",
                            "maxResults": 15  # Increased for better product name matching
                        },
                        {
                            "type": "TEXT_DETECTION",  # Detects text on products (brand names, model numbers, sizes)
                            "maxResults": 50  # Increased to capture all text including size info
                        },
                        {
                            "type": "LOGO_DETECTION",  # Specifically for brand logo detection
                            "maxResults": 10
                        }
                    ]
                }]
            }
            
            # Make API request
            logger.info("Calling Google Vision API...")
            response = requests.post(
                self.api_url,
                json=payload,
                timeout=30
            )
            
            # Check for API errors
            response.raise_for_status()
            result = response.json()
            
            # Handle API errors in response (e.g., unsupported features)
            if 'responses' in result and result['responses']:
                response_data = result['responses'][0]
                if 'error' in response_data:
                    error = response_data['error']
                    # If LOGO_DETECTION is not available, remove it and retry
                    if error.get('code') == 3 and 'LOGO_DETECTION' in str(error.get('message', '')):
                        logger.warning("LOGO_DETECTION not available, retrying without it...")
                        # Remove LOGO_DETECTION from features
                        payload['requests'][0]['features'] = [
                            f for f in payload['requests'][0]['features'] 
                            if f.get('type') != 'LOGO_DETECTION'
                        ]
                        response = requests.post(self.api_url, json=payload, timeout=30)
                        response.raise_for_status()
                        result = response.json()
            
            # Extract comprehensive product information
            product_info = self._extract_comprehensive_product_info(result)
            
            logger.info(f"Vision API success: Detected '{product_info.get('product_name')}' - Brand: {product_info.get('brand')}, Size: {product_info.get('size')}")
            
            return {
                'success': True,
                'product_name': product_info.get('product_name', 'Unknown Product'),
                'brand': product_info.get('brand'),
                'model': product_info.get('model'),
                'size': product_info.get('size'),
                'color': product_info.get('color'),
                'labels': product_info.get('labels', []),
                'objects': product_info.get('objects', []),
                'logos': product_info.get('logos', []),
                'confidence': product_info.get('confidence', 0.0),
                'extracted_text': product_info.get('extracted_text', '')
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Vision API request error: {str(e)}")
            error_msg = "Failed to connect to Google Vision API"
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    error_msg = error_data.get('error', {}).get('message', error_msg)
                except:
                    error_msg = f"API Error: {e.response.status_code}"
            
            return {
                'success': False,
                'error': error_msg
            }
            
        except Exception as e:
            logger.error(f"Vision API processing error: {str(e)}")
            return {
                'success': False,
                'error': f"Error processing image: {str(e)}"
            }
    
    def _extract_comprehensive_product_info(self, result: Dict) -> Dict:
        """
        Extract comprehensive product information including brand, model, size, color.
        Returns a dictionary with all product details.
        """
        responses = result.get('responses', [])
        if not responses:
            return {
                'product_name': 'Unknown Product',
                'brand': None,
                'model': None,
                'size': None,
                'color': None,
                'labels': [],
                'objects': [],
                'logos': [],
                'confidence': 0.0,
                'extracted_text': ''
            }
        
        response = responses[0]
        
        # Extract all components
        brand = self._extract_brand(response)
        model = self._extract_model(response)
        size = self._extract_size(response)
        color = self._extract_color(response)
        logos = self._extract_logos(response)
        labels = self._extract_labels(result)
        objects = self._extract_objects(result)
        extracted_text = self._extract_all_text(response)
        
        # Build comprehensive product name
        product_name = self._build_product_name(brand, model, size, response)
        
        # Calculate confidence
        confidence = self._calculate_confidence(result)
        
        return {
            'product_name': product_name,
            'brand': brand,
            'model': model,
            'size': size,
            'color': color,
            'labels': labels,
            'objects': objects,
            'logos': logos,
            'confidence': confidence,
            'extracted_text': extracted_text
        }
    
    def _extract_brand(self, response: Dict) -> Optional[str]:
        """Extract brand name from logos, text, and labels."""
        import re
        
        # Priority 1: Logo detection (most reliable for brands)
        logos = response.get('logoAnnotations', [])
        if logos:
            logo_name = logos[0].get('description', '').strip()
            if logo_name:
                logger.info(f"Detected brand from logo: {logo_name}")
                return self._normalize_brand_name(logo_name)
        
        # Priority 2: Text detection for brand names
        text_annotations = response.get('textAnnotations', [])
        if text_annotations:
            full_text = text_annotations[0].get('description', '')
            
            # Common brand patterns
            brand_patterns = [
                r'\b(Apple|iPhone|iPad|MacBook|iMac|AirPods)\b',
                r'\b(Samsung|Galaxy)\b',
                r'\b(Google|Pixel)\b',
                r'\b(OnePlus)\b',
                r'\b(Xiaomi|Redmi|POCO|Mi)\b',
                r'\b(Realme)\b',
                r'\b(Oppo)\b',
                r'\b(Vivo)\b',
                r'\b(Dell|XPS|Inspiron|Alienware)\b',
                r'\b(HP|Hewlett[\s-]?Packard)\b',
                r'\b(Lenovo|ThinkPad|IdeaPad)\b',
                r'\b(Asus|ROG|ZenBook)\b',
                r'\b(Acer|Predator|Aspire)\b',
                r'\b(MSI)\b',
                r'\b(Razer)\b',
                r'\b(Sony)\b',
                r'\b(LG)\b',
                r'\b(Nokia)\b',
                r'\b(Motorola)\b',
            ]
            
            for pattern in brand_patterns:
                match = re.search(pattern, full_text, re.IGNORECASE)
                if match:
                    brand = match.group(1)
                    logger.info(f"Detected brand from text: {brand}")
                    return self._normalize_brand_name(brand)
        
        # Priority 3: Labels (check for brand names)
        labels = response.get('labelAnnotations', [])
        brand_keywords = ['apple', 'samsung', 'google', 'oneplus', 'xiaomi', 'dell', 'hp', 'lenovo', 'asus', 'acer']
        for label in labels[:10]:
            desc = label.get('description', '').lower()
            for keyword in brand_keywords:
                if keyword in desc:
                    logger.info(f"Detected brand from label: {keyword}")
                    return self._normalize_brand_name(keyword)
        
        return None
    
    def _extract_model(self, response: Dict) -> Optional[str]:
        """Extract model number from text detection."""
        import re
        text_annotations = response.get('textAnnotations', [])
        if not text_annotations:
            return None
        
        full_text = text_annotations[0].get('description', '')
        
        # Model number patterns (e.g., iPhone 14 Pro, Galaxy S23 Ultra, MacBook Pro 16)
        model_patterns = [
            r'(iPhone\s*(?:SE|Mini|Pro|Plus|Max)?\s*\d+[A-Z]*)',
            r'(Galaxy\s*(?:S|Note|A|Z|Fold|Flip)\s*\d+[A-Z]*(?:\s*Ultra|Plus)?)',
            r'(Pixel\s*\d+[A-Z]*(?:\s*Pro)?)',
            r'(OnePlus\s*\d+[A-Z]*(?:\s*Pro|T)?)',
            r'(MacBook\s*(?:Pro|Air)?\s*\d+[A-Z]*)',
            r'(iPad\s*(?:Pro|Air|Mini)?\s*\d+[A-Z]*)',
            r'((?:XPS|Inspiron|Alienware|ThinkPad|IdeaPad|ROG|ZenBook|Predator|Aspire)\s*\d+[A-Z]*)',
        ]
        
        for pattern in model_patterns:
            match = re.search(pattern, full_text, re.IGNORECASE)
            if match:
                model = match.group(1).strip()
                logger.info(f"Detected model: {model}")
                return model
        
        return None
    
    def _extract_size(self, response: Dict) -> Optional[str]:
        """Extract size information (storage, screen size, dimensions)."""
        import re
        text_annotations = response.get('textAnnotations', [])
        if not text_annotations:
            return None
        
        full_text = text_annotations[0].get('description', '')
        
        # Storage size patterns (GB, TB)
        storage_patterns = [
            r'\b(\d+)\s*(?:GB|TB)\b',
            r'\b(\d+)\s*(?:gb|tb)\b',
        ]
        
        # Screen size patterns (inches)
        screen_patterns = [
            r'\b(\d+(?:\.\d+)?)\s*(?:inch|inches|")\b',
            r'\b(\d+(?:\.\d+)?)\s*(?:in)\b',
        ]
        
        # Dimension patterns (mm, cm)
        dimension_patterns = [
            r'\b(\d+(?:\.\d+)?)\s*(?:mm|cm|millimeter|centimeter)\b',
        ]
        
        sizes = []
        
        # Extract storage
        for pattern in storage_patterns:
            matches = re.findall(pattern, full_text, re.IGNORECASE)
            for match in matches:
                size_val = match[0] if isinstance(match, tuple) else match
                unit = 'GB' if 'gb' in pattern.lower() else 'TB'
                sizes.append(f"{size_val} {unit}")
        
        # Extract screen size
        for pattern in screen_patterns:
            matches = re.findall(pattern, full_text, re.IGNORECASE)
            for match in matches:
                size_val = match[0] if isinstance(match, tuple) else match
                sizes.append(f"{size_val}\"")
        
        # Extract dimensions
        for pattern in dimension_patterns:
            matches = re.findall(pattern, full_text, re.IGNORECASE)
            for match in matches:
                size_val = match[0] if isinstance(match, tuple) else match
                sizes.append(f"{size_val}mm")
        
        if sizes:
            # Return the most relevant size (usually storage for phones, screen for laptops)
            logger.info(f"Detected sizes: {', '.join(sizes)}")
            return ', '.join(sizes[:2])  # Return up to 2 sizes
        
        return None
    
    def _extract_color(self, response: Dict) -> Optional[str]:
        """Extract color information from labels and text."""
        import re
        
        # Check labels for color
        labels = response.get('labelAnnotations', [])
        color_keywords = ['black', 'white', 'silver', 'gold', 'blue', 'red', 'green', 'purple', 'pink', 'gray', 'grey', 'space gray', 'midnight', 'starlight']
        
        for label in labels[:10]:
            desc = label.get('description', '').lower()
            for color in color_keywords:
                if color in desc:
                    logger.info(f"Detected color from label: {color}")
                    return color.capitalize()
        
        # Check text for color
        text_annotations = response.get('textAnnotations', [])
        if text_annotations:
            full_text = text_annotations[0].get('description', '').lower()
            for color in color_keywords:
                if re.search(r'\b' + color + r'\b', full_text):
                    logger.info(f"Detected color from text: {color}")
                    return color.capitalize()
        
        return None
    
    def _extract_logos(self, response: Dict) -> List[Dict]:
        """Extract detected logos."""
        logos = response.get('logoAnnotations', [])
        return [
            {
                'name': logo.get('description', ''),
                'score': logo.get('score', 0)
            }
            for logo in logos
        ]
    
    def _extract_all_text(self, response: Dict) -> str:
        """Extract all detected text."""
        text_annotations = response.get('textAnnotations', [])
        if text_annotations:
            return text_annotations[0].get('description', '')
        return ''
    
    def _normalize_brand_name(self, brand: str) -> str:
        """Normalize brand name to standard format."""
        brand = brand.strip()
        brand_lower = brand.lower()
        
        # Normalize common variations
        brand_mapping = {
            'iphone': 'Apple',
            'ipad': 'Apple',
            'macbook': 'Apple',
            'imac': 'Apple',
            'airpods': 'Apple',
            'galaxy': 'Samsung',
            'xps': 'Dell',
            'inspiron': 'Dell',
            'alienware': 'Dell',
            'thinkpad': 'Lenovo',
            'ideapad': 'Lenovo',
            'rog': 'Asus',
            'zenbook': 'Asus',
            'predator': 'Acer',
            'aspire': 'Acer',
            'pixel': 'Google',
            'redmi': 'Xiaomi',
            'poco': 'Xiaomi',
            'mi': 'Xiaomi',
        }
        
        if brand_lower in brand_mapping:
            return brand_mapping[brand_lower]
        
        # Capitalize properly
        return brand.capitalize()
    
    def _build_product_name(self, brand: Optional[str], model: Optional[str], size: Optional[str], response: Dict) -> str:
        """Build comprehensive product name from components."""
        parts = []
        
        if brand:
            parts.append(brand)
        
        if model:
            # If model already contains brand, don't duplicate
            if brand and brand.lower() in model.lower():
                parts.append(model.replace(brand, '').strip())
            else:
                parts.append(model)
        else:
            # Try to extract from other sources if model not found
            product_name = self._extract_product_name_fallback(response)
            if product_name:
                parts.append(product_name)
        
        if size:
            parts.append(f"({size})")
        
        if parts:
            return ' '.join(parts)
        
        return 'Unknown Product'
    
    def _extract_product_name_fallback(self, response: Dict) -> Optional[str]:
        """Fallback method to extract product name when model is not found."""
        # Use the original extraction logic as fallback
        return self._extract_product_name(response)
    
    def _extract_product_name(self, result: Dict) -> str:
        """
        Extract the most likely product name from Vision API response.
        Uses multiple detection methods and prioritizes specific product names.
        """
        responses = result.get('responses', [])
        if not responses:
            return 'Unknown Product'
        
        response = responses[0]
        
        # Priority 1: Object localization (most accurate for specific products)
        objects = response.get('localizedObjectAnnotations', [])
        if objects:
            # Get the object with highest score
            best_object = max(objects, key=lambda x: x.get('score', 0))
            object_name = best_object.get('name', '')
            if object_name:
                logger.info(f"Detected object: {object_name} (score: {best_object.get('score', 0):.2f})")
                return object_name
        
        # Priority 2: Text detection (brand names, model numbers on products)
        text_annotations = response.get('textAnnotations', [])
        if text_annotations and len(text_annotations) > 1:  # First is full text, rest are words
            # Look for product-like text (brand + model patterns)
            full_text = text_annotations[0].get('description', '')
            import re
            
            # More comprehensive product patterns
            product_patterns = [
                # Apple products
                r'(iPhone\s*(?:SE|Mini|Pro|Plus|Max)?\s*\d+[A-Z]*(?:\s*Pro\s*Max)?)',
                r'(iPad\s*(?:Pro|Air|Mini)?\s*\d+[A-Z]*)',
                r'(MacBook\s*(?:Pro|Air)?\s*\d+[A-Z]*)',
                r'(iMac\s*\d+[A-Z]*)',
                r'(AirPods\s*(?:Pro|Max)?)',
                r'(Apple\s*Watch\s*(?:Series\s*)?\d+)',
                # Samsung products
                r'(Samsung\s*Galaxy\s*(?:S|Note|A|Z|Fold|Flip)\s*\d+[A-Z]*(?:\s*Ultra|Plus)?)',
                r'(Galaxy\s*(?:S|Note|A|Z|Fold|Flip)\s*\d+[A-Z]*(?:\s*Ultra|Plus)?)',
                # Google products
                r'(Google\s*Pixel\s*\d+[A-Z]*(?:\s*Pro)?)',
                r'(Pixel\s*\d+[A-Z]*(?:\s*Pro)?)',
                # OnePlus
                r'(OnePlus\s*\d+[A-Z]*(?:\s*Pro|T)?)',
                # Xiaomi/Redmi
                r'(Xiaomi\s*(?:Mi|Redmi|POCO)\s*\d+[A-Z]*)',
                r'(Redmi\s*(?:Note|K)?\s*\d+[A-Z]*)',
                # Other brands
                r'(Realme\s*\d+[A-Z]*)',
                r'(Oppo\s*(?:Reno|Find)?\s*\d+[A-Z]*)',
                r'(Vivo\s*\d+[A-Z]*)',
                # Laptops
                r'(Dell\s*(?:XPS|Inspiron|Latitude|Alienware)\s*\d+)',
                r'(HP\s*(?:Pavilion|Envy|Spectre|Omen)\s*\d+)',
                r'(Lenovo\s*(?:ThinkPad|IdeaPad|Yoga)\s*\w+)',
                r'(Asus\s*(?:ROG|ZenBook|VivoBook)\s*\w+)',
                r'(Acer\s*(?:Predator|Aspire|Nitro)\s*\w+)',
            ]
            
            # Try to find the longest/most specific match
            best_match = None
            best_length = 0
            
            for pattern in product_patterns:
                matches = re.finditer(pattern, full_text, re.IGNORECASE)
                for match in matches:
                    product_name = match.group(0).strip()
                    if len(product_name) > best_length:
                        best_match = product_name
                        best_length = len(product_name)
            
            if best_match:
                logger.info(f"Detected product from text: {best_match}")
                return best_match
            
            # Also check individual words for brand names (case-insensitive)
            words = full_text.split()
            brand_keywords = ['iPhone', 'Samsung', 'Galaxy', 'Pixel', 'OnePlus', 'Xiaomi', 'Redmi', 
                            'MacBook', 'iPad', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Apple',
                            'Google', 'Nokia', 'Motorola', 'Oppo', 'Vivo', 'Realme', 'POCO']
            for i, word in enumerate(words):
                # Case-insensitive match
                word_lower = word.lower()
                matched_brand = None
                for brand in brand_keywords:
                    if brand.lower() in word_lower or word_lower in brand.lower():
                        matched_brand = brand
                        break
                
                if matched_brand:
                    # Try to get brand + next few words (up to 4 words total)
                    product_candidate = ' '.join(words[i:min(i+4, len(words))]).strip()
                    # Clean up the candidate
                    product_candidate = re.sub(r'[^\w\s-]', '', product_candidate)  # Remove special chars
                    if len(product_candidate) > len(matched_brand):
                        logger.info(f"Detected product from text (brand match): {product_candidate}")
                        return product_candidate
                    else:
                        # If only brand found, try to add model number from next words
                        if i + 1 < len(words):
                            next_word = words[i + 1]
                            # Check if next word looks like a model number
                            if re.match(r'^\d+[A-Z]*$', next_word) or next_word.lower() in ['pro', 'max', 'plus', 'ultra', 'mini']:
                                product_candidate = f"{matched_brand} {next_word}"
                                logger.info(f"Detected product from text (brand + model): {product_candidate}")
                                return product_candidate
        
        # Priority 3: Web detection (often has specific product names)
        web_detection = response.get('webDetection', {})
        
        # Check web entities (often contains product names)
        web_entities = web_detection.get('webEntities', [])
        if web_entities:
            # Filter for product-like entities (skip generic terms)
            generic_terms = ['image', 'photo', 'picture', 'graphics', 'illustration', 'art']
            for entity in web_entities[:5]:  # Check top 5
                description = entity.get('description', '').strip()
                if description and len(description) > 2:
                    desc_lower = description.lower()
                    # Skip generic image-related terms
                    if not any(term in desc_lower for term in generic_terms):
                        logger.info(f"Detected web entity: {description}")
                        return description
        
        # Check pages with matching images (often product pages) - BEST SOURCE for product names
        pages_with_matching = web_detection.get('pagesWithMatchingImages', [])
        if pages_with_matching:
            for page in pages_with_matching[:5]:  # Check top 5 pages
                page_title = page.get('pageTitle', '').strip()
                if page_title and len(page_title) > 3:
                    # Extract product name from page title
                    # Common formats: "Product Name - Store", "Product Name | Store", "Store - Product Name"
                    title_parts = page_title.split(' - ')[0].split(' | ')[0].split(' : ')[0]
                    # Remove store names from beginning
                    store_names = ['Amazon', 'Flipkart', 'eBay', 'Walmart', 'Best Buy', 'Target', 'Shop']
                    for store in store_names:
                        if title_parts.startswith(store):
                            title_parts = title_parts[len(store):].strip(' -:|')
                    
                    # Clean up common suffixes
                    title_parts = title_parts.split(' Buy')[0].split(' Price')[0].split(' Online')[0]
                    title_parts = title_parts.strip()
                    
                    if title_parts and len(title_parts) > 3:
                        # Check if it looks like a product name (has brand/model indicators)
                        import re
                        if (re.search(r'\d+', title_parts) or  # Has numbers (model numbers)
                            any(brand in title_parts for brand in ['iPhone', 'Samsung', 'Galaxy', 'Pixel', 'OnePlus', 'MacBook', 'iPad'])):
                            logger.info(f"Detected from page title: {title_parts}")
                            return title_parts
        
        # Priority 4: Labels (filter for specific product terms)
        labels = response.get('labelAnnotations', [])
        if labels:
            # Skip generic color/quality labels, prioritize product names
            skip_terms = ['red', 'blue', 'green', 'black', 'white', 'color', 'quality', 
                         'image', 'photo', 'picture', 'graphics', 'illustration', 'mobile phone',
                         'smartphone', 'cell phone', 'telephone']
            
            # Look for brand-specific labels first
            brand_indicators = ['iphone', 'samsung', 'galaxy', 'pixel', 'oneplus', 'xiaomi', 
                              'redmi', 'macbook', 'ipad', 'dell', 'hp', 'lenovo', 'asus', 'acer']
            
            for label in labels:
                description = label.get('description', '').strip()
                if description and len(description) > 2:
                    desc_lower = description.lower()
                    # Skip generic terms
                    if not any(term == desc_lower for term in skip_terms):
                        # Check if it contains brand indicators
                        if any(brand in desc_lower for brand in brand_indicators):
                            logger.info(f"Detected brand label: {description} (score: {label.get('score', 0):.2f})")
                            return description
                        # Prioritize labels that look like product names
                        # (capitalized, multiple words, or common product terms)
                        elif (description[0].isupper() or 
                              ' ' in description or 
                              any(term in desc_lower for term in ['phone', 'laptop', 'computer', 'device', 'product', 'item'])):
                            # But skip if it's too generic
                            if desc_lower not in ['mobile phone', 'smartphone', 'cell phone']:
                                logger.info(f"Detected label: {description} (score: {label.get('score', 0):.2f})")
                                return description
            
            # Last resort: return top label if it's not too generic
            if labels[0].get('description'):
                top_label = labels[0].get('description', 'Unknown Product')
                if top_label.lower() not in skip_terms:
                    return top_label
        
        # Last resort: return first available result
        if web_entities and web_entities[0].get('description'):
            return web_entities[0].get('description', 'Unknown Product')
        
        return 'Unknown Product'
    
    def _extract_labels(self, result: Dict) -> List[str]:
        """Extract all labels from Vision API response."""
        responses = result.get('responses', [])
        if not responses:
            return []
        
        labels = responses[0].get('labelAnnotations', [])
        return [label.get('description', '') for label in labels if label.get('description')]
    
    def _extract_objects(self, result: Dict) -> List[Dict]:
        """Extract detected objects with their locations."""
        responses = result.get('responses', [])
        if not responses:
            return []
        
        objects = responses[0].get('localizedObjectAnnotations', [])
        return [
            {
                'name': obj.get('name', ''),
                'score': obj.get('score', 0)
            }
            for obj in objects
        ]
    
    def _calculate_confidence(self, result: Dict) -> float:
        """Calculate overall confidence score from API response."""
        responses = result.get('responses', [])
        if not responses:
            return 0.0
        
        response = responses[0]
        
        # Get highest confidence from any detection method
        max_confidence = 0.0
        
        # Check object detection
        objects = response.get('localizedObjectAnnotations', [])
        if objects:
            max_confidence = max(
                max_confidence,
                max([obj.get('score', 0) for obj in objects], default=0.0)
            )
        
        # Check labels
        labels = response.get('labelAnnotations', [])
        if labels:
            max_confidence = max(
                max_confidence,
                max([label.get('score', 0) for label in labels], default=0.0)
            )
        
        return round(max_confidence * 100, 2)  # Convert to percentage

