#!/usr/bin/env python3
# backend/scripts/debug_ocr.py

import os
import sys
from PIL import Image

# Test if image exists and is readable
def test_image(image_path):
    print(f"Testing image: {image_path}")
    
    # Check if file exists
    if not os.path.exists(image_path):
        print(f"ERROR: File does not exist at {image_path}")
        return False
    
    print(f"✓ File exists")
    print(f"File size: {os.path.getsize(image_path)} bytes")
    
    # Try to open with PIL
    try:
        img = Image.open(image_path)
        print(f"✓ Image opened successfully")
        print(f"Image size: {img.size}")
        print(f"Image format: {img.format}")
        print(f"Image mode: {img.mode}")
        
        # Save a copy to ensure it's in a readable format
        test_output = os.path.join(os.path.dirname(image_path), "test_converted.jpg")
        img.convert('RGB').save(test_output, 'JPEG')
        print(f"✓ Saved test copy to: {test_output}")
        
        return True
    except Exception as e:
        print(f"ERROR opening image: {e}")
        return False

# Now test with OCR
def test_with_simple_ocr(image_path):
    try:
        print("\n--- Testing with Tesseract ---")
        import pytesseract
        from PIL import Image
        
        img = Image.open(image_path)
        text = pytesseract.image_to_string(img)
        print(f"Tesseract extracted {len(text)} characters")
        if text:
            print("First 200 chars:", text[:200])
        return text
    except ImportError:
        print("Tesseract not available")
    except Exception as e:
        print(f"Tesseract error: {e}")
    return None

def test_with_paddle(image_path):
    try:
        print("\n--- Testing with PaddleOCR ---")
        from paddleocr import PaddleOCR
        import warnings
        warnings.filterwarnings("ignore")
        
        ocr = PaddleOCR(lang='en')
        result = ocr.ocr(image_path)
        
        if result and result[0]:
            print(f"PaddleOCR found {len(result[0])} text regions")
            for i, line in enumerate(result[0][:5]):  # First 5 lines
                if line[1]:
                    text = line[1][0]
                    print(f"Line {i+1}: {text}")
        else:
            print("No text detected by PaddleOCR")
        
        return result
    except Exception as e:
        print(f"PaddleOCR error: {e}")
    return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python debug_ocr.py <image_path>")
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    # Test the image
    if test_image(image_path):
        # Try OCR
        test_with_simple_ocr(image_path)
        test_with_paddle(image_path)