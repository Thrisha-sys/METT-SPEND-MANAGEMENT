#!/usr/bin/env python3
# backend/scripts/test_paddle.py
# Simple test to see what PaddleOCR extracts from your receipt

from paddleocr import PaddleOCR
import sys
import json

# Initialize PaddleOCR
ocr = PaddleOCR(lang='en')

def test_ocr(image_path):
    try:
        # Call OCR - it will use the correct method internally
        result = ocr.ocr(image_path)
        
        # Extract text from result
        text_lines = []
        
        if result and len(result) > 0:
            for line in result[0]:
                if line[1]:
                    text = line[1][0]
                    confidence = line[1][1]
                    text_lines.append(text)
                    print(f"Text: {text}, Confidence: {confidence:.2f}")
        
        # Also output as JSON
        full_text = '\n'.join(text_lines)
        print("\n--- FULL TEXT ---")
        print(full_text)
        
        # Look for amount (802.47 from your receipt)
        import re
        amounts = re.findall(r'\d+\.\d{2}', full_text)
        if amounts:
            print(f"\n--- FOUND AMOUNTS ---")
            for amt in amounts:
                print(f"${amt}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        test_ocr(sys.argv[1])
    else:
        print("Usage: python test_paddle.py <image_path>")