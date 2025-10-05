#!/usr/bin/env python3
# backend/scripts/paddle_ocr.py - Bulletproof version

from paddleocr import PaddleOCR
import sys
import json
import re
from datetime import datetime
import os
import warnings

warnings.filterwarnings("ignore")

ocr = PaddleOCR(lang='en')

def extract_receipt_info(image_path):
    try:
        # Run OCR
        result = ocr.ocr(image_path)
        
        # Very careful extraction
        text_lines = []
        
        # Handle various result formats
        if result:
            # Sometimes result is [[[coords], [text, conf]], ...]
            # Sometimes it's [[[[coords], [text, conf]], ...]]
            ocr_data = result[0] if isinstance(result[0], list) else result
            
            for item in ocr_data:
                try:
                    # Try to extract text from various formats
                    text = None
                    confidence = 0.9
                    
                    if isinstance(item, list) and len(item) > 1:
                        text_part = item[1]  # Usually [text, confidence]
                        if isinstance(text_part, list) and len(text_part) > 0:
                            text = str(text_part[0])
                            if len(text_part) > 1:
                                confidence = float(text_part[1])
                        elif isinstance(text_part, tuple) and len(text_part) > 0:
                            text = str(text_part[0])
                            if len(text_part) > 1:
                                confidence = float(text_part[1])
                    
                    if text:
                        text_lines.append({'text': text, 'confidence': confidence})
                except:
                    continue
        
        # If we got no text, return default
        if not text_lines:
            raise ValueError("Could not extract text")
        
        # Process extracted text
        full_text = '\n'.join([line['text'] for line in text_lines])
        
        # Simple extraction
        vendor = text_lines[0]['text'] if text_lines else 'Unknown'
        
        # Find amounts
        amounts = []
        for line in text_lines:
            matches = re.findall(r'\d+\.\d{2}', line['text'])
            amounts.extend([float(m) for m in matches])
        
        amount = max(amounts) if amounts else 0
        
        # Simple category detection
        category = 'Food' if 'restaurant' in full_text.lower() else 'Other'
        
        print(json.dumps({
            'vendor': vendor[:50],  # Limit length
            'amount': amount,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'category': category,
            'rawText': full_text[:200],
            'confidence': 85
        }))
        
    except Exception as e:
        # Always return valid JSON
        print(json.dumps({
            'vendor': 'Unknown',
            'amount': 0,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'category': 'Other',
            'rawText': '',
            'confidence': 0
        }))

if __name__ == '__main__':
    if len(sys.argv) > 1:
        extract_receipt_info(sys.argv[1])
    else:
        print(json.dumps({'error': 'No image'}))