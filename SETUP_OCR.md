# OCR Setup Instructions

This document explains how to set up Google Cloud Vision API for OCR functionality in the Practice Playground API.

## Prerequisites

1. Google Cloud Platform (GCP) Account
2. Google Cloud Project with billing enabled
3. Google Cloud Vision API enabled

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for the project

## Step 2: Enable Vision API

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Cloud Vision API"
3. Click on "Cloud Vision API" and click "Enable"

## Step 3: Create Service Account

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Fill in the details:
   - Service account name: `practice-playground-ocr`
   - Description: `OCR service for Practice Playground`
4. Click "Create and Continue"
5. Add the role: "Cloud Vision API Service Agent"
6. Click "Done"

## Step 4: Generate Service Account Key

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Select "JSON" format
5. Click "Create" - this will download the JSON key file

## Step 5: Configure Environment Variables

1. Place the downloaded JSON key file in a secure location
2. Set the environment variable:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
```

Or create a `.env` file in your project root:

```
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
```

## Step 6: Install Dependencies

```bash
cd deployment
source bin/activate
pip install -r requirements.txt
```

## Step 7: Test the Setup

Run the API and test the health endpoint:

```bash
python practice_playground_api.py
```

Then visit: `http://localhost:8003/health`

You should see:
```json
{
  "status": "healthy",
  "dependencies": {
    "openai_api": "OK",
    "google_vision_api": "OK"
  },
  "features": {
    "image_ocr": true,
    "multi_image_support": true
  }
}
```

## API Endpoints

### 1. Standard Analysis (PDF or Image)
- **POST** `/analyze-practice`
- Supports both PDF and image files
- Single file for student responses

### 2. Multi-Image Analysis
- **POST** `/analyze-practice-multi-image`
- Ideal content: PDF or image
- Student responses: Multiple image files

### 3. OCR Preview
- **POST** `/ocr-preview`
- Test OCR on a single file
- Returns extracted text without analysis

### 4. Configuration Options
- **GET** `/practice-config-options`
- Returns supported formats and features

## Supported File Formats

- **PDF**: .pdf
- **Images**: .jpg, .jpeg, .png, .bmp, .tiff, .webp

## Usage Examples

### Frontend Integration

```javascript
// Single file analysis
const formData = new FormData();
formData.append('ideal_content_file', idealFile);
formData.append('student_responses_file', studentFile);
formData.append('subject', 'Mathematics');
formData.append('grade', '10');
formData.append('topic', 'Algebra');

fetch('/analyze-practice', {
  method: 'POST',
  body: formData
});

// Multi-image analysis
const formData = new FormData();
formData.append('ideal_content_file', idealFile);
studentImages.forEach(img => {
  formData.append('student_responses_images', img);
});
formData.append('subject', 'Physics');
formData.append('grade', '12');
formData.append('topic', 'Mechanics');

fetch('/analyze-practice-multi-image', {
  method: 'POST',
  body: formData
});
```

## Cost Considerations

- Google Cloud Vision API pricing: ~$1.50 per 1000 images
- OCR requests are counted per image processed
- Consider implementing caching for repeated analyses

## Troubleshooting

### Common Issues

1. **"google.auth.exceptions.DefaultCredentialsError"**
   - Ensure GOOGLE_APPLICATION_CREDENTIALS is set correctly
   - Verify the JSON key file exists and is readable

2. **"Permission denied"**
   - Check that the service account has the correct roles
   - Verify the Vision API is enabled in your GCP project

3. **"Image too large"**
   - Images are automatically resized to 2048x2048
   - Consider preprocessing very large images

4. **Poor OCR accuracy**
   - Ensure good image quality (minimum 200 DPI)
   - Avoid blurry or low-contrast images
   - Consider image preprocessing (contrast adjustment, noise reduction)

## Security Best Practices

1. Never commit the service account JSON key to version control
2. Use environment variables for sensitive configuration
3. Implement proper file validation and size limits
4. Consider using Google Cloud IAM conditions for additional security
5. Monitor API usage and set billing alerts 