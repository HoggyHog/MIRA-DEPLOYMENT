from fastapi import FastAPI, Form, HTTPException, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
import os
import sys
from typing import Optional, List, Dict
from dotenv import load_dotenv
from pypdf import PdfReader
from io import BytesIO
from pypdf.errors import PdfStreamError
from summarizer import SummarizationOrchestrator
from youtube_transcript_api._api import YouTubeTranscriptApi
import tempfile
from openai import OpenAI
import PyPDF2
import logging
from google.cloud import vision
from PIL import Image
import io
import base64
import json

# Add current directory to Python path
sys.path.append('.')

# Import the RAG logic
from final_agentic_m4_RAG_logic import OrchestratorAgent, generate_lesson

# Load environment variables and setup OpenAI
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_client = OpenAI(api_key=OPENAI_API_KEY)

app = FastAPI(title="Lesson Generator API", version="1.0.0")

# Add CORS middleware with Replit support
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LessonRequest(BaseModel):
    subject: str
    topic: str
    subtopics: str
    grade_level: str = "10"
    special_requirements: str = ""
    # For exam API compatibility
    difficulty: Optional[str] = "medium"
    question_types: Optional[List[str]] = ["mcq", "short_answer"]
    duration: Optional[int] = 60
    total_marks: Optional[int] = 100
    sub_topic: Optional[str] = None

class LessonResponse(BaseModel):
    success: bool
    lesson_content: str
    error: Optional[str] = None

class SummarizeTextRequest(BaseModel):
    text: str

# Practice Playground Models
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

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables setup for OCR
GOOGLE_APPLICATION_CREDENTIALS = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
GOOGLE_VISION_API_KEY = os.getenv('OCR')

if not GOOGLE_APPLICATION_CREDENTIALS and not GOOGLE_VISION_API_KEY:
    logger.warning("Neither GOOGLE_APPLICATION_CREDENTIALS nor OCR API key set. OCR functionality may not work.")
elif GOOGLE_VISION_API_KEY:
    logger.info("Using Google Vision API key for OCR")
    os.environ['GOOGLE_API_KEY'] = GOOGLE_VISION_API_KEY

@app.get("/")
async def root():
    return {"message": "Lesson Generator API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "lesson-generator"}

@app.post("/api/generate-lesson", response_model=LessonResponse)
async def generate_lesson_endpoint(
    subject: str = Form(...),
    topic: str = Form(...),
    subtopics: str = Form(...),
    grade_level: str = Form("10"),
    special_requirements: str = Form("")
):
    try:
        print(f"Generating lesson for {subject}: {topic}")
        orchestrator = OrchestratorAgent()
        lesson = orchestrator.generate_lesson(
            subject=subject,
            topic=topic,
            grade_level=grade_level,
            pdf_path=None,
            subtopics=subtopics,
            special_requirements=special_requirements
        )
        lesson_content = lesson.to_markdown()
        return LessonResponse(success=True, lesson_content=lesson_content)
    except Exception as e:
        print(f"Error generating lesson: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/summarize-content")
async def summarize_content(request: Request, file: Optional[UploadFile] = File(None)):
    text = None
    if file:
        pdf_bytes = await file.read()
        try:
            pdf_reader = PdfReader(BytesIO(pdf_bytes))
            text = "\n".join(page.extract_text() or "" for page in pdf_reader.pages)
        except PdfStreamError:
            return JSONResponse({"summary": "Uploaded file is not a valid or complete PDF."})
        except Exception as e:
            return JSONResponse({"summary": f"PDF parsing failed: {str(e)}"})
    else:
        data = await request.json()
        text = data.get("text", "")
    if not text or len(text.strip()) == 0:
        return JSONResponse({"summary": "No content to summarize."})
    orchestrator = SummarizationOrchestrator(grade="10", subject="Science")
    summary = orchestrator.summarize(text)['markdown']
    print(summary)
    return JSONResponse({"summary": summary})

@app.post("/api/summarize-youtube")
async def summarize_youtube(request: Request):
    data = await request.json()
    youtube_url = data.get("url", "")
    transcript = get_youtube_transcript(youtube_url)
    orchestrator = SummarizationOrchestrator(grade="10", subject="Science")
    summary = orchestrator.summarize_youtube(youtube_url)['markdown']
    return JSONResponse({"title": "YouTube Video", "markdown": summary, "transcript": transcript})

def get_youtube_transcript(video_url: str) -> str:
    video_id = video_url.split("v=")[-1].split("&")[0]
    transcript = YouTubeTranscriptApi.get_transcript(video_id)
    return " ".join([item['text'] for item in transcript])

# OCR and Practice Analysis Functions
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
        if GOOGLE_VISION_API_KEY:
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
    """Validate uploaded file"""
    try:
        # Check file size (max 10MB)
        if file.size and file.size > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size too large. Maximum 10MB allowed.")
        
        # Check file extension
        allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png', 'bmp', 'tiff', 'webp', 'txt']
        file_ext = file.filename.lower().split('.')[-1] if file.filename else ''
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file format: {file_ext}. Allowed formats: {', '.join(allowed_extensions)}"
            )
        
        return True
    except Exception as e:
        logger.error(f"File validation error: {e}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"File validation failed: {str(e)}")

def get_gpt4o_response(messages: List[Dict], temperature: float = 0.3) -> str:
    """Get response from GPT-4o"""
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=temperature,
            max_tokens=2000
        )
        content = response.choices[0].message.content
        return content if content else "No response generated."
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

class PracticePlaygroundAnalyzer:
    """Analyzer for practice playground submissions"""
    
    def __init__(self):
        self.openai_client = openai_client
    
    def analyze_student_responses(self, ideal_content: str, student_responses: str) -> Dict:
        """Analyze student responses against ideal content"""
        try:
            messages = [
                {
                    "role": "system",
                    "content": """You are an expert CBSE tutor analyzing student practice responses. 
                    Provide detailed analysis including:
                    1. Overall score and feedback
                    2. Question-by-question analysis
                    3. Specific strengths and areas for improvement
                    4. Actionable suggestions for better performance
                    
                    IMPORTANT: You must respond with ONLY valid JSON. No additional text before or after the JSON.
                    Format your response as JSON with the following structure:
                    {
                        "overall_score": 75.5,
                        "total_marks": 100,
                        "general_feedback": "Good effort shown with room for improvement",
                        "question_analyses": [
                            {
                                "question_number": 1,
                                "question_text": "What is the formula for area of a circle?",
                                "student_answer": "πr²",
                                "ideal_answer": "πr²",
                                "marks_awarded": 5,
                                "total_marks": 5,
                                "marking_scheme": "Correct formula",
                                "misconceptions": [],
                                "improvement_suggestions": "Well done!",
                                "strengths": ["Correct formula"]
                            }
                        ]
                    }"""
                },
                {
                    "role": "user",
                    "content": f"Ideal Content:\n{ideal_content}\n\nStudent Responses:\n{student_responses}\n\nPlease analyze the student's performance and respond with ONLY valid JSON."
                }
            ]
            
            response = get_gpt4o_response(messages)
            logger.info(f"OpenAI response: {response}")
            
            # Try to parse JSON, with fallback
            try:
                return json.loads(response)
            except json.JSONDecodeError as json_error:
                logger.error(f"JSON parsing error: {json_error}")
                logger.error(f"Raw response: {response}")
                
                # Fallback: create a basic analysis structure
                return {
                    "overall_score": 50.0,
                    "total_marks": 100,
                    "general_feedback": "Analysis completed but response format was unexpected. Please review the content manually.",
                    "question_analyses": [
                        {
                            "question_number": 1,
                            "question_text": "Analysis",
                            "student_answer": student_responses[:100] + "..." if len(student_responses) > 100 else student_responses,
                            "ideal_answer": ideal_content[:100] + "..." if len(ideal_content) > 100 else ideal_content,
                            "marks_awarded": 50,
                            "total_marks": 100,
                            "marking_scheme": "Basic analysis",
                            "misconceptions": ["Response format issue"],
                            "improvement_suggestions": "Please try again with different content",
                            "strengths": ["Content provided"]
                        }
                    ]
                }
            
        except Exception as e:
            logger.error(f"Analysis error: {e}")
            raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# Practice Analysis Endpoints
@app.post("/api/analyze-practice", response_model=PracticeAnalysisResponse)
async def analyze_practice_session(
    ideal_content_file: UploadFile = File(...),
    student_responses_file: UploadFile = File(...),
    subject: str = Form(...),
    grade: str = Form(...),
    topic: str = Form(...)
):
    """Analyze student practice responses"""
    try:
        # Validate files
        validate_file(ideal_content_file)
        validate_file(student_responses_file)
        
        # Process files
        ideal_content_bytes = await ideal_content_file.read()
        student_responses_bytes = await student_responses_file.read()
        
        ideal_content = process_file_content(ideal_content_bytes, ideal_content_file.filename or "ideal_content")
        student_responses = process_file_content(student_responses_bytes, student_responses_file.filename or "student_responses")
        
        # Analyze responses
        analyzer = PracticePlaygroundAnalyzer()
        analysis_result = analyzer.analyze_student_responses(ideal_content, student_responses)
        
        return PracticeAnalysisResponse(
            success=True,
            overall_score=analysis_result.get("overall_score"),
            total_marks=analysis_result.get("total_marks"),
            question_analyses=analysis_result.get("question_analyses"),
            general_feedback=analysis_result.get("general_feedback")
        )
        
    except Exception as e:
        logger.error(f"Practice analysis error: {e}")
        return PracticeAnalysisResponse(
            success=False,
            error=str(e)
        )

@app.post("/api/analyze-practice-multi-image", response_model=PracticeAnalysisResponse)
async def analyze_practice_multi_image(
    ideal_content_file: UploadFile = File(...),
    student_responses_images: List[UploadFile] = File(...),
    subject: str = Form(...),
    grade: str = Form(...),
    topic: str = Form(...)
):
    """Analyze student practice responses from multiple images"""
    try:
        # Validate files
        validate_file(ideal_content_file)
        for image_file in student_responses_images:
            validate_file(image_file)
        
        # Process ideal content
        ideal_content_bytes = await ideal_content_file.read()
        ideal_content = process_file_content(ideal_content_bytes, ideal_content_file.filename or "ideal_content")
        
        # Process student responses from multiple images
        student_responses = combine_multiple_images_ocr(student_responses_images)
        
        # Analyze responses
        analyzer = PracticePlaygroundAnalyzer()
        analysis_result = analyzer.analyze_student_responses(ideal_content, student_responses)
        
        return PracticeAnalysisResponse(
            success=True,
            overall_score=analysis_result.get("overall_score"),
            total_marks=analysis_result.get("total_marks"),
            question_analyses=analysis_result.get("question_analyses"),
            general_feedback=analysis_result.get("general_feedback")
        )
        
    except Exception as e:
        logger.error(f"Multi-image practice analysis error: {e}")
        return PracticeAnalysisResponse(
            success=False,
            error=str(e)
        )

@app.post("/api/ocr-preview")
async def ocr_preview(file: UploadFile = File(...)):
    """Preview OCR results from uploaded file"""
    try:
        validate_file(file)
        
        file_bytes = await file.read()
        extracted_text = process_file_content(file_bytes, file.filename or "unknown")
        
        return {
            "success": True,
            "extracted_text": extracted_text,
            "file_name": file.filename or "unknown",
            "file_type": file.content_type or "unknown",
            "character_count": len(extracted_text),
            "word_count": len(extracted_text.split())
        }
        
    except Exception as e:
        logger.error(f"OCR preview error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/config-options")
async def get_config_options():
    """Get exam generation configuration options"""
    return {
        "grades": ["6", "7", "8", "9", "10", "11", "12"],
        "subjects": ["Mathematics", "Science", "English", "Social Studies", "Hindi"],
        "difficulty_levels": ["easy", "medium", "hard", "mixed"],
        "question_types": ["mcq", "short_answer", "long_answer", "numerical", "diagram", "mixed"],
        "exam_durations": ["30", "60", "90", "120", "180"]
    }

@app.get("/api/lesson-config-options")
async def get_lesson_config_options():
    """Get lesson generation configuration options"""
    return {
        "subjects": ["Mathematics", "Science", "English", "Social Studies", "Hindi", "Physics", "Chemistry", "Biology"],
        "grade_levels": ["6", "7", "8", "9", "10", "11", "12"],
        "difficulty_levels": ["easy", "medium", "hard", "mixed"]
    }

@app.get("/api/practice-config-options")
async def get_practice_config_options():
    """Get practice playground configuration options"""
    return {
        "subjects": ["Mathematics", "Science", "English", "Social Studies", "Hindi", "Physics", "Chemistry", "Biology"],
        "grade_levels": ["6", "7", "8", "9", "10", "11", "12"],
        "difficulty_levels": ["easy", "medium", "hard", "mixed"],
        "practice_types": ["mcq", "short_answer", "problem_solving", "concept_check"]
    }

@app.post("/api/generate-exam")
async def generate_exam_endpoint(request: Request):
    """Generate exam paper using QPA_2 module"""
    try:
        data = await request.json()
        
        # Import the exam generation function
        from QPA_2 import generate_cbse_exam_paper
        
        # Call the actual exam generation logic
        result = generate_cbse_exam_paper(data)
        
        if result.get("success"):
            return result
        else:
            logger.error(f"Exam generation failed: {result.get('error')}")
            return {
                "success": False,
                "error": result.get("error", "Failed to generate exam")
            }
            
    except Exception as e:
        logger.error(f"Exam generation error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8001)
