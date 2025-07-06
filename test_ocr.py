#!/usr/bin/env python3
"""
Test script for OCR functionality in Practice Playground API
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.append(str(Path(__file__).parent))

from practice_playground_api import (
    extract_text_from_image,
    extract_text_from_pdf,
    process_file_content,
    preprocess_image
)

async def test_ocr_setup():
    """Test if OCR setup is working correctly"""
    print("🔍 Testing OCR Setup...")
    
    # Check environment variables
    google_creds = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    openai_key = os.getenv('OPENAI_API_KEY')
    
    print(f"✓ Google Cloud Credentials: {'✓ Set' if google_creds else '✗ Missing'}")
    print(f"✓ OpenAI API Key: {'✓ Set' if openai_key else '✗ Missing'}")
    
    if not google_creds:
        print("⚠️  GOOGLE_APPLICATION_CREDENTIALS not set. OCR will not work.")
        print("   Please follow the setup instructions in SETUP_OCR.md")
        return False
    
    if not openai_key:
        print("⚠️  OPENAI_API_KEY not set. AI analysis will not work.")
        return False
    
    print("✅ Environment setup looks good!")
    return True

def test_image_preprocessing():
    """Test image preprocessing functionality"""
    print("\n🖼️  Testing Image Preprocessing...")
    
    try:
        # Create a simple test image
        from PIL import Image
        import io
        
        # Create a simple test image with text
        img = Image.new('RGB', (800, 600), color='white')
        
        # Convert to bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes = img_bytes.getvalue()
        
        # Test preprocessing
        processed = preprocess_image(img_bytes)
        print(f"✓ Image preprocessing works! Original: {len(img_bytes)} bytes, Processed: {len(processed)} bytes")
        return True
        
    except Exception as e:
        print(f"✗ Image preprocessing failed: {e}")
        return False

async def test_google_vision_api():
    """Test Google Cloud Vision API connection"""
    print("\n🌐 Testing Google Cloud Vision API...")
    
    try:
        from google.cloud import vision
        
        # Initialize client
        client = vision.ImageAnnotatorClient()
        
        # Create a simple test image with text
        from PIL import Image, ImageDraw, ImageFont
        import io
        
        # Create image with text
        img = Image.new('RGB', (400, 200), color='white')
        draw = ImageDraw.Draw(img)
        
        # Try to use a basic font, fallback to default if not available
        try:
            font = ImageFont.truetype("arial.ttf", 24)
        except:
            font = ImageFont.load_default()
        
        draw.text((50, 80), "Hello OCR Test!", fill='black', font=font)
        
        # Convert to bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes = img_bytes.getvalue()
        
        # Test OCR
        extracted_text = extract_text_from_image(img_bytes)
        print(f"✓ OCR extracted text: '{extracted_text.strip()}'")
        
        if "Hello" in extracted_text or "OCR" in extracted_text or "Test" in extracted_text:
            print("✅ Google Cloud Vision API is working correctly!")
            return True
        else:
            print("⚠️  OCR returned unexpected text. Check image quality or API setup.")
            return False
            
    except Exception as e:
        print(f"✗ Google Cloud Vision API test failed: {e}")
        print("   Make sure your service account key is valid and Vision API is enabled.")
        return False

def test_pdf_processing():
    """Test PDF processing functionality"""
    print("\n📄 Testing PDF Processing...")
    
    try:
        # Create a simple test PDF
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        import io
        
        # Create PDF in memory
        pdf_buffer = io.BytesIO()
        c = canvas.Canvas(pdf_buffer, pagesize=letter)
        c.drawString(100, 750, "This is a test PDF for OCR functionality.")
        c.drawString(100, 700, "Mathematics: 2 + 2 = 4")
        c.drawString(100, 650, "Physics: F = ma")
        c.save()
        
        pdf_bytes = pdf_buffer.getvalue()
        
        # Test PDF text extraction
        extracted_text = extract_text_from_pdf(pdf_bytes)
        print(f"✓ PDF extracted text: '{extracted_text.strip()}'")
        
        if "test PDF" in extracted_text or "Mathematics" in extracted_text:
            print("✅ PDF processing is working correctly!")
            return True
        else:
            print("⚠️  PDF processing returned unexpected text.")
            return False
            
    except ImportError:
        print("⚠️  reportlab not installed, skipping PDF test.")
        print("   Install with: pip install reportlab")
        return True
    except Exception as e:
        print(f"✗ PDF processing test failed: {e}")
        return False

async def run_all_tests():
    """Run all tests"""
    print("🚀 Starting OCR Functionality Tests")
    print("=" * 50)
    
    tests = [
        ("Environment Setup", test_ocr_setup()),
        ("Image Preprocessing", test_image_preprocessing()),
        ("Google Vision API", test_google_vision_api()),
        ("PDF Processing", test_pdf_processing()),
    ]
    
    results = []
    for test_name, test_func in tests:
        if asyncio.iscoroutine(test_func):
            result = await test_func
        else:
            result = test_func
        results.append((test_name, result))
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your OCR setup is ready to use.")
    else:
        print("⚠️  Some tests failed. Check the setup instructions in SETUP_OCR.md")
    
    return passed == total

if __name__ == "__main__":
    asyncio.run(run_all_tests()) 