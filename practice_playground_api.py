"""
AI Practice Playground API for Student Performance Analysis
[DEPRECATED - Now integrated into Express server]

This was the original FastAPI service - functionality moved to practicePlaygroundRoutes.ts
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import openai
import os
import asyncio
import tempfile
import PyPDF2
from io import BytesIO
import logging
# OCR and Image Processing imports
from google.cloud import vision
from PIL import Image
import io
import base64
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables setup
GOOGLE_APPLICATION_CREDENTIALS = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
GOOGLE_VISION_API_KEY = os.getenv('OCR')

if not GOOGLE_APPLICATION_CREDENTIALS and not GOOGLE_VISION_API_KEY:
    logger.warning("Neither GOOGLE_APPLICATION_CREDENTIALS nor OCR API key set. OCR functionality may not work.")
elif GOOGLE_VISION_API_KEY:
    logger.info("Using Google Vision API key for OCR")
    # Set the API key for Google Cloud client libraries
    os.environ['GOOGLE_API_KEY'] = GOOGLE_VISION_API_KEY

app = FastAPI(title="AI Practice Playground API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

class QuestionAnalysis(BaseModel):
    question_number: int
    question_text: str
    student_answer: str
    ideal_answer: str
    marks_awarded: int
    total_marks: int
    marking_scheme: str
    misconceptions: List[str]
    improvement_suggestions: str
    strengths: List[str]

class OCRResult(BaseModel):
    text: str
    confidence: Optional[float] = None
    processing_time: Optional[float] = None
    file_type: str
    file_name: str

class PracticeAnalysisResponse(BaseModel):
    success: bool
    overall_score: Optional[float] = None
    total_marks: Optional[int] = None
    question_analyses: Optional[List[QuestionAnalysis]] = None
    general_feedback: Optional[str] = None
    error: Optional[str] = None
    ocr_results: Optional[Dict[str, OCRResult]] = None

def extract_text_from_pdf(pdf_file: bytes) -> str:
    """Extract text content from PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_file))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to extract text from PDF: {str(e)}")

def preprocess_image(image_bytes: bytes) -> bytes:
    """Preprocess image for better OCR accuracy"""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize if too large (max 2048x2048 for optimal OCR)
        max_size = (2048, 2048)
        if image.size[0] > max_size[0] or image.size[1] > max_size[1]:
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Convert back to bytes
        output = io.BytesIO()
        image.save(output, format='JPEG', quality=95)
        return output.getvalue()
    except Exception as e:
        logger.error(f"Image preprocessing error: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to preprocess image: {str(e)}")

def extract_text_from_image(image_bytes: bytes) -> str:
    """Extract text from image using Google Cloud Vision API"""
    try:
        # Preprocess image first
        processed_image = preprocess_image(image_bytes)
        
        # Initialize the Vision API client
        # Use API key if available, otherwise use service account
        if GOOGLE_VISION_API_KEY:
            from google.cloud import vision
            # Create client with API key
            client = vision.ImageAnnotatorClient(client_options={"api_key": GOOGLE_VISION_API_KEY})
        else:
            client = vision.ImageAnnotatorClient()
        
        # Create vision image object
        image = vision.Image(content=processed_image)
        
        # Perform OCR
        response = client.text_detection(image=image)
        texts = response.text_annotations
        
        # Check for errors
        if response.error.message:
            logger.error(f"Vision API error: {response.error.message}")
            raise HTTPException(status_code=500, detail=f"OCR failed: {response.error.message}")
        
        # Extract text
        if texts:
            extracted_text = texts[0].description
            logger.info(f"OCR extracted {len(extracted_text)} characters")
            return extracted_text.strip()
        else:
            logger.warning("No text found in image")
            return ""
            
    except Exception as e:
        logger.error(f"OCR extraction error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to extract text from image: {str(e)}")

def combine_multiple_images_ocr(image_files: List[UploadFile]) -> str:
    """Process multiple images and combine OCR results"""
    try:
        combined_text = ""
        for i, image_file in enumerate(image_files):
            logger.info(f"Processing image {i+1}/{len(image_files)}: {image_file.filename}")
            
            # Read image bytes
            image_bytes = image_file.file.read()
            
            # Extract text from image
            text = extract_text_from_image(image_bytes)
            
            if text:
                combined_text += f"--- Page {i+1} ---\n{text}\n\n"
            else:
                combined_text += f"--- Page {i+1} ---\n[No text detected]\n\n"
        
        return combined_text.strip()
    except Exception as e:
        logger.error(f"Multiple image OCR error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process multiple images: {str(e)}")

def process_file_content(file_bytes: bytes, filename: str) -> str:
    """Process file based on its type (PDF, Image, or Text)"""
    try:
        file_ext = filename.lower().split('.')[-1]
        
        if file_ext == 'pdf':
            return extract_text_from_pdf(file_bytes)
        elif file_ext in ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'webp']:
            return extract_text_from_image(file_bytes)
        elif file_ext == 'txt':
            # Handle text files (from demo text mode)
            return file_bytes.decode('utf-8')
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file format: {file_ext}. Supported formats: PDF, JPEG, PNG, BMP, TIFF, WebP, TXT"
            )
    except Exception as e:
        logger.error(f"File processing error: {e}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

def validate_file(file: UploadFile) -> bool:
    """Validate file format and basic properties"""
    try:
        ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'bmp', 'tiff', 'webp', 'txt']
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
        
        if not file.filename:
            raise HTTPException(status_code=400, detail="File name is required")
        
        file_ext = file.filename.lower().split('.')[-1]
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file format: {file_ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Note: file.size might not be available for all upload scenarios
        # Size validation can be added here if needed
        
        return True
    except Exception as e:
        logger.error(f"File validation error: {e}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=f"File validation failed: {str(e)}")

def get_gpt4o_response(messages: List[Dict], temperature: float = 0.3) -> str:
    """Get response from GPT-4o-mini API"""
    try:
        client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Using GPT-4O-mini for cost efficiency while maintaining quality
            messages=messages,
            temperature=temperature,
            max_tokens=2000
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

class PracticePlaygroundAnalyzer:
    """Main analyzer for comparing student responses with ideal answers"""
    
    def __init__(self):
        self.system_prompt = """You are an expert CBSE (Central Board of Secondary Education) question-answer checker and educational assessment specialist. You have extensive experience in CBSE marking schemes, question patterns, and common student errors across all subjects and grade levels.

Your primary role is to:
1. Conduct step-by-step comparison between student responses and ideal answers
2. Identify ALL mistakes, errors, and concept gaps in student responses
3. Provide detailed, constructive feedback following CBSE assessment guidelines
4. Highlight both conceptual understanding and procedural errors
5. Suggest specific remedial actions based on CBSE curriculum requirements

Key Assessment Criteria:
- Follow CBSE marking scheme patterns (step-wise marking)
- Identify conceptual gaps vs procedural errors
- Note presentation issues (diagrams, units, significant figures)
- Assess application of formulas, theorems, and concepts
- Evaluate logical reasoning and analytical thinking
- Check for completeness of answers as per CBSE standards

Your analysis should be detailed, educational, and aligned with CBSE evaluation patterns to help students improve their academic performance."""

    def analyze_student_responses(self, ideal_content: str, student_responses: str) -> Dict:
        """Analyze student responses against ideal answers/content"""
        
        user_prompt = f"""
As an expert CBSE educator, analyze the student responses against the ideal answers and provide detailed feedback.

=== IDEAL ANSWERS ===
{ideal_content}

=== STUDENT RESPONSES ===
{student_responses}

Provide your analysis in the following JSON format (ensure valid JSON syntax):

{{
    "overall_score": 75,
    "total_marks": 10,
    "question_analyses": [
        {{
            "question_number": 1,
            "question_text": "Question text here",
            "student_answer": "Student's response",
            "ideal_answer": "Expected answer",
            "marks_awarded": 7,
            "total_marks": 10,
            "marking_scheme": "CBSE step-wise marking breakdown",
            "misconceptions": ["Mistake 1", "Mistake 2"],
            "improvement_suggestions": "Specific advice for improvement",
            "strengths": ["Good point 1", "Good point 2"]
        }}
    ],
    "general_feedback": "Overall feedback and suggestions"
}}

IMPORTANT:
- Respond ONLY with valid JSON (no markdown, no code blocks, no extra text)
- Do NOT wrap your response in ```json or ``` blocks
- Use CBSE marking patterns
- Identify specific mistakes and provide constructive feedback
- Focus on conceptual understanding and step-by-step analysis
"""

        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        try:
            response = get_gpt4o_response(messages)
            
            # Clean the response - remove markdown code blocks if present
            cleaned_response = response.strip()
            if cleaned_response.startswith('```json'):
                cleaned_response = cleaned_response[7:]  # Remove ```json
            if cleaned_response.startswith('```'):
                cleaned_response = cleaned_response[3:]   # Remove ``` 
            if cleaned_response.endswith('```'):
                cleaned_response = cleaned_response[:-3]  # Remove closing ```
            
            cleaned_response = cleaned_response.strip()
            
            # Try to parse JSON response
            logger.info(f"GPT Response (cleaned): {cleaned_response[:500]}...")  # Log first 500 chars for debugging
            return json.loads(cleaned_response)
        except json.JSONDecodeError as e:
            # If JSON parsing fails, return a structured error
            logger.error(f"JSON parsing failed: {e}")
            logger.error(f"Raw response: {response}")
            logger.error(f"Cleaned response: {cleaned_response}")
            return {
                "error": "Failed to parse analysis response",
                "raw_response": response[:1000]  # Truncate for readability
            }
        except Exception as e:
            logger.error(f"Analysis error: {e}")
            return {
                "error": f"Analysis failed: {str(e)}"
            }

@app.get("/")
async def root():
    return {"message": "AI Practice Playground API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint to verify API and dependencies status"""
    try:
        # Check OpenAI API key
        openai_status = "OK" if os.getenv('OPENAI_API_KEY') else "Missing"
        
        # Check Google Cloud Vision API (either service account or API key)
        vision_status = "OK" if (os.getenv('GOOGLE_APPLICATION_CREDENTIALS') or os.getenv('OCR')) else "Missing"
        
        return {
            "status": "healthy",
            "version": "1.0.0",
            "dependencies": {
                "openai_api": openai_status,
                "google_vision_api": vision_status
            },
            "features": {
                "pdf_processing": True,
                "image_ocr": vision_status == "OK",
                "multi_image_support": vision_status == "OK",
                "cbse_analysis": True
            }
        }
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

@app.post("/analyze-practice", response_model=PracticeAnalysisResponse)
async def analyze_practice_session(
    ideal_content_file: UploadFile = File(...),
    student_responses_file: UploadFile = File(...),
    subject: str = Form(...),
    grade: str = Form(...),
    topic: str = Form(...)
):
    """
    Analyze student practice session by comparing responses with ideal answers.
    Now supports both PDF and image files with OCR capability.
    
    Args:
        ideal_content_file: PDF or image file containing ideal answers or reference content
        student_responses_file: PDF or image file containing student's responses
        subject: Subject name (e.g., Mathematics, Science)
        grade: Grade level (e.g., 10, 12)
        topic: Topic being assessed
    
    Returns:
        Detailed analysis with marking, misconceptions, and improvement suggestions
    """
    try:
        # Validate both files
        validate_file(ideal_content_file)
        validate_file(student_responses_file)
        
        # Extract text from both files
        ideal_content_bytes = await ideal_content_file.read()
        student_responses_bytes = await student_responses_file.read()
        
        # Process files based on their type
        ideal_content = process_file_content(ideal_content_bytes, ideal_content_file.filename)
        student_responses = process_file_content(student_responses_bytes, student_responses_file.filename)
        
        if not ideal_content.strip():
            return PracticeAnalysisResponse(
                success=False,
                error="Could not extract text from ideal content file"
            )
        
        if not student_responses.strip():
            return PracticeAnalysisResponse(
                success=False,
                error="Could not extract text from student responses file"
            )
        
        # Initialize analyzer
        analyzer = PracticePlaygroundAnalyzer()
        
        # Perform analysis
        analysis_result = analyzer.analyze_student_responses(ideal_content, student_responses)
        
        if "error" in analysis_result:
            return PracticeAnalysisResponse(
                success=False,
                error=analysis_result["error"]
            )
        
        # Parse analysis results
        question_analyses = []
        for qa in analysis_result.get("question_analyses", []):
            # Extract misconceptions from the new mistakes_identified format
            misconceptions = []
            mistakes_identified = qa.get("mistakes_identified", [])
            if mistakes_identified:
                for mistake in mistakes_identified:
                    if isinstance(mistake, dict):
                        misconceptions.append(mistake.get("mistake", ""))
                    else:
                        misconceptions.append(str(mistake))
        
            # Fallback to old format if new format not present
            if not misconceptions:
                misconceptions = qa.get("misconceptions", [])
            
            question_analyses.append(QuestionAnalysis(
                question_number=qa.get("question_number", 0),
                question_text=qa.get("question_text", ""),
                student_answer=qa.get("student_answer", ""),
                ideal_answer=qa.get("ideal_answer", ""),
                marks_awarded=qa.get("marks_awarded", 0),
                total_marks=qa.get("total_marks", 0),
                marking_scheme=qa.get("marking_scheme", ""),
                misconceptions=misconceptions,
                improvement_suggestions=qa.get("improvement_suggestions", ""),
                strengths=qa.get("strengths", [])
            ))
        
        # Prepare OCR results for response
        ocr_results = {}
        
        # Add OCR result for ideal content if it was an image
        if ideal_content_file.filename.lower().split('.')[-1] in ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'webp']:
            ocr_results["ideal_content"] = OCRResult(
                text=ideal_content,
                file_type="image",
                file_name=ideal_content_file.filename
            )
        
        # Add OCR result for student responses if it was an image
        if student_responses_file.filename.lower().split('.')[-1] in ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'webp']:
            ocr_results["student_responses"] = OCRResult(
                text=student_responses,
                file_type="image",
                file_name=student_responses_file.filename
            )
        
        return PracticeAnalysisResponse(
            success=True,
            overall_score=analysis_result.get("overall_score", 0),
            total_marks=analysis_result.get("total_marks", 0),
            question_analyses=question_analyses,
            general_feedback=analysis_result.get("general_feedback", ""),
            ocr_results=ocr_results if ocr_results else None
        )
        
    except Exception as e:
        logger.error(f"Practice analysis error: {e}")
        return PracticeAnalysisResponse(
            success=False,
            error=f"Analysis failed: {str(e)}"
        )

@app.post("/analyze-practice-multi-image", response_model=PracticeAnalysisResponse)
async def analyze_practice_multi_image(
    ideal_content_file: UploadFile = File(...),
    student_responses_images: List[UploadFile] = File(...),
    subject: str = Form(...),
    grade: str = Form(...),
    topic: str = Form(...)
):
    """
    Analyze student practice session with multiple image files for student responses.
    Useful for multi-page handwritten answers.
    
    Args:
        ideal_content_file: PDF or image file containing ideal answers or reference content
        student_responses_images: List of image files containing student's responses
        subject: Subject name (e.g., Mathematics, Science)
        grade: Grade level (e.g., 10, 12)
        topic: Topic being assessed
    
    Returns:
        Detailed analysis with marking, misconceptions, and improvement suggestions
    """
    try:
        # Validate ideal content file
        validate_file(ideal_content_file)
        
        # Validate all student response images
        for img_file in student_responses_images:
            validate_file(img_file)
            # Ensure it's an image file
            file_ext = img_file.filename.lower().split('.')[-1]
            if file_ext not in ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'webp']:
                return PracticeAnalysisResponse(
                    success=False,
                    error=f"Student response files must be images. Found: {file_ext}"
                )
        
        # Extract text from ideal content file
        ideal_content_bytes = await ideal_content_file.read()
        ideal_content = process_file_content(ideal_content_bytes, ideal_content_file.filename)
        
        # Process multiple student response images
        student_responses = combine_multiple_images_ocr(student_responses_images)
        
        if not ideal_content.strip():
            return PracticeAnalysisResponse(
                success=False,
                error="Could not extract text from ideal content file"
            )
        
        if not student_responses.strip():
            return PracticeAnalysisResponse(
                success=False,
                error="Could not extract text from student response images"
            )
        
        # Initialize analyzer
        analyzer = PracticePlaygroundAnalyzer()
        
        # Perform analysis
        analysis_result = analyzer.analyze_student_responses(ideal_content, student_responses)
        
        if "error" in analysis_result:
            return PracticeAnalysisResponse(
                success=False,
                error=analysis_result["error"]
            )
        
        # Parse analysis results
        question_analyses = []
        for qa in analysis_result.get("question_analyses", []):
            # Extract misconceptions from the new mistakes_identified format
            misconceptions = []
            mistakes_identified = qa.get("mistakes_identified", [])
            if mistakes_identified:
                for mistake in mistakes_identified:
                    if isinstance(mistake, dict):
                        misconceptions.append(mistake.get("mistake", ""))
                    else:
                        misconceptions.append(str(mistake))
            
            # Fallback to old format if new format not present
            if not misconceptions:
                misconceptions = qa.get("misconceptions", [])
            
            question_analyses.append(QuestionAnalysis(
                question_number=qa.get("question_number", 0),
                question_text=qa.get("question_text", ""),
                student_answer=qa.get("student_answer", ""),
                ideal_answer=qa.get("ideal_answer", ""),
                marks_awarded=qa.get("marks_awarded", 0),
                total_marks=qa.get("total_marks", 0),
                marking_scheme=qa.get("marking_scheme", ""),
                misconceptions=misconceptions,
                improvement_suggestions=qa.get("improvement_suggestions", ""),
                strengths=qa.get("strengths", [])
            ))
        
        # Prepare OCR results for response
        ocr_results = {}
        
        # Add OCR result for ideal content if it was an image
        if ideal_content_file.filename.lower().split('.')[-1] in ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'webp']:
            ocr_results["ideal_content"] = OCRResult(
                text=ideal_content,
                file_type="image",
                file_name=ideal_content_file.filename
            )
        
        # Add OCR results for student response images
        ocr_results["student_responses"] = OCRResult(
            text=student_responses,
            file_type="multi_image",
            file_name=f"{len(student_responses_images)} images"
        )
        
        return PracticeAnalysisResponse(
            success=True,
            overall_score=analysis_result.get("overall_score", 0),
            total_marks=analysis_result.get("total_marks", 0),
            question_analyses=question_analyses,
            general_feedback=analysis_result.get("general_feedback", ""),
            ocr_results=ocr_results
        )
        
    except Exception as e:
        logger.error(f"Multi-image practice analysis error: {e}")
        return PracticeAnalysisResponse(
            success=False,
            error=f"Analysis failed: {str(e)}"
        )

@app.post("/ocr-preview")
async def ocr_preview(file: UploadFile = File(...)):
    """
    Preview OCR results for a single file without performing full analysis.
    Useful for students to verify OCR accuracy before submission.
    
    Args:
        file: PDF or image file to extract text from
    
    Returns:
        Extracted text and file information
    """
    try:
        # Validate file
        validate_file(file)
        
        # Extract text from file
        file_bytes = await file.read()
        extracted_text = process_file_content(file_bytes, file.filename)
        
        file_ext = file.filename.lower().split('.')[-1]
        
        return {
            "success": True,
            "extracted_text": extracted_text,
            "file_name": file.filename,
            "file_type": file_ext,
            "character_count": len(extracted_text),
            "word_count": len(extracted_text.split()) if extracted_text else 0
        }
        
    except Exception as e:
        logger.error(f"OCR preview error: {e}")
        return {
            "success": False,
            "error": f"OCR preview failed: {str(e)}"
        }

@app.get("/practice-config-options")
async def get_practice_config_options():
    """Get available configuration options for practice analysis"""
    return {
        "subjects": ["Mathematics", "Science", "English", "Social Studies", "Hindi", "Physics", "Chemistry", "Biology"],
        "grades": ["6", "7", "8", "9", "10", "11", "12"],
        "analysis_types": ["detailed", "quick", "conceptual"],
        "supported_formats": ["PDF", "JPEG", "PNG", "BMP", "TIFF", "WebP"],
        "input_methods": ["upload_pdf", "upload_image", "multi_image_upload"],
        "max_file_size": "10MB",
        "max_images_per_submission": 10,
        "ocr_features": {
            "handwriting_recognition": True,
            "mathematical_expressions": True,
            "diagram_text_extraction": True,
            "multi_language_support": True
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)