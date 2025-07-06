import requests
import sys
import os

API_URL = "http://localhost:4444/api/summarize-content"
PDF_PATH = "jesc111.pdf"  # Change this to your test PDF path

def test_pdf_summarize(pdf_path):
    with open(pdf_path, "rb") as f:
        files = {"file": (os.path.basename(pdf_path), f, "application/pdf")}
        response = requests.post(API_URL, files=files)
    print("Status:", response.status_code)
    try:
        print("Response:", response.json())
    except Exception:
        print("Raw response:", response.text)

if __name__ == "__main__":
    if not os.path.exists(PDF_PATH):
        print(f"File not found: {PDF_PATH}")
        sys.exit(1)
    test_pdf_summarize(PDF_PATH) 