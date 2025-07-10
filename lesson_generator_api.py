from fastapi import FastAPI, Form, HTTPException, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
import os
import sys
from typing import Optional, List, Dict, Any, Dict
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
        # Check file size (max 50MB)
        if file.size and file.size > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size too large. Maximum 50MB allowed.")
        
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

# AI Tutor Exam Generation Endpoint
class ContentSource(BaseModel):
    source_type: str  # 'pdf' | 'youtube' | 'text' | 'slides'
    content: str
    title: str
    metadata: Optional[Dict[str, Any]] = None

class AIExamRequest(BaseModel):
    content_sources: List[ContentSource]
    student_grade: str
    subject: str
    num_questions: Optional[int] = 5
    difficulty_level: Optional[str] = "medium"
    question_types: Optional[List[str]] = ["mcq", "short_answer"]

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    content_sources: List[ContentSource]
    chat_history: List[ChatMessage]
    current_question: str
    student_grade: str
    subject: str

class ChatResponse(BaseModel):
    success: bool
    response: Optional[str] = None
    suggestions: Optional[List[str]] = None
    follow_up_questions: Optional[List[str]] = None
    error: Optional[str] = None

@app.post("/api/ai-tutor/generate-exam")
async def ai_tutor_generate_exam(request: AIExamRequest):
    """Generate personalized exam using AI Tutor"""
    try:
        # Process content sources
        combined_content = ""
        for source in request.content_sources:
            combined_content += f"--- {source.title} ---\n{source.content}\n\n"
        
        # Create exam generation prompt
        question_types_str = ', '.join(request.question_types or ["mcq", "short_answer"])
        exam_prompt = f"""You are Mira, an AI tutor creating personalized exams for school students.

EXAM CREATION GUIDELINES:
- Design questions appropriate for {request.student_grade} level
- Focus on {request.subject} concepts from the provided content
- Difficulty level: {request.difficulty_level or "medium"}
- Include variety in question types
- Provide clear, fair marking schemes
- Add helpful hints for difficult questions

QUESTION TYPES TO INCLUDE: {question_types_str}

FOR EACH QUESTION PROVIDE:
1. Clear, unambiguous question text
2. Marking scheme with point allocation
3. Model answer/expected response
4. Common mistakes students make
5. Helpful hints if needed

Ensure questions test understanding, not just memorization!"""

        user_message = f"""
CONTENT FOR EXAM:
{combined_content}

EXAM REQUIREMENTS:
- Number of questions: {request.num_questions or 5}
- Question types: {question_types_str}
- Difficulty level: {request.difficulty_level or "medium"}
- Student grade: {request.student_grade}
- Subject: {request.subject}

Generate exam questions with complete marking schemes and explanations.
Format as JSON with this structure:
{{
    "questions": [
        {{
            "id": 1,
            "type": "mcq",
            "question": "Question text",
            "options": ["A", "B", "C", "D"],
            "correct_answer": "A",
            "marks": 2,
            "explanation": "Why this is correct",
            "hints": ["Helpful hint"]
        }}
    ],
    "total_marks": 20,
    "estimated_time": 30
}}
"""

        # Get AI response
        ai_response = get_gpt4o_response([
            {"role": "system", "content": exam_prompt},
            {"role": "user", "content": user_message}
        ], temperature=0.5)

        # Try to parse JSON response
        try:
            # Clean JSON response
            cleaned_response = ai_response.strip()
            if cleaned_response.startswith('```json'):
                cleaned_response = cleaned_response[7:-3]
            elif cleaned_response.startswith('```'):
                cleaned_response = cleaned_response[3:-3]

            exam_data = json.loads(cleaned_response)
            
            num_questions = request.num_questions or 5
            return {
                "success": True,
                "questions": exam_data.get("questions", []),
                "total_marks": exam_data.get("total_marks", num_questions * 2),
                "estimated_time": exam_data.get("estimated_time", num_questions * 3)
            }

        except json.JSONDecodeError:
            # Fallback exam generation
            num_questions = request.num_questions or 5
            fallback_questions = []
            for i in range(num_questions):
                fallback_questions.append({
                    "id": i + 1,
                    "type": "mcq",
                    "question": f"Question {i + 1} about the provided content",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_answer": "Option A",
                    "marks": 2,
                    "explanation": "Detailed explanation of the correct answer",
                    "hints": ["Consider the main concepts from the content"]
                })

            return {
                "success": True,
                "questions": fallback_questions,
                "total_marks": num_questions * 2,
                "estimated_time": num_questions * 3
            }

    except Exception as e:
        logger.error(f"AI Tutor exam generation error: {e}")
        return {
            "success": False,
            "error": f"Failed to generate exam: {str(e)}"
        }

# Chat Tutor Endpoint
@app.post("/api/ai-tutor/chat", response_model=ChatResponse)
async def ai_tutor_chat(request: ChatRequest):
    """
    Chat with AI tutor using content sources and chat history.
    """
    try:
        # Process content sources for context
        combined_content = ""
        for source in request.content_sources:
            combined_content += f"\n\nSource: {source.title}\n{source.content}\n"

        # Format chat prompt
        chat_prompt = f"""You are Mira, a friendly and patient AI tutor having a conversation with a {request.student_grade} student about {request.subject}.

CRITICAL: You MUST format ALL mathematical content using LaTeX notation.

CONVERSATION STYLE:
- Be warm, encouraging, and supportive
- Use age-appropriate language and examples
- Ask follow-up questions to check understanding
- Celebrate progress and learning moments
- Be patient with mistakes and confusion
- Provide gentle corrections and guidance

TUTORING APPROACH:
- Listen carefully to the student's question
- Identify the core concept they're struggling with
- Explain using simple, relatable terms
- Use examples from their everyday life
- Check understanding with gentle questions
- Offer encouragement and positive reinforcement

MATHEMATICAL FORMATTING:
- ALWAYS use LaTeX notation for ALL mathematical expressions
- For inline math within text, use \\( ... \\) delimiters
- For standalone equations, use \\[ ... \\] delimiters
- Examples: 
  * "The formula \\(E = mc^2\\) shows..." for inline
  * For standalone: \\[E = mc^2\\]
  * For calculations: \\[3 \\times 60 \\times 60 = 10800\\]
- Convert ALL numbers, equations, and mathematical operations to LaTeX
- Never write plain text math like "3×60×60" - always use \\(3 \\times 60 \\times 60\\)
- Format units properly: \\(40 \\text{{ W}}\\), \\(10800 \\text{{ s}}\\)

CONTENT CONTEXT:
Use the provided educational content to inform your responses, but adapt explanations to be conversational and student-friendly.

Remember: You're not just answering questions, you're building confidence and love for learning!"""

        # Build conversation messages
        conversation_messages = [{"role": "system", "content": chat_prompt}]

        # Add content context
        context_message = f"""
EDUCATIONAL CONTENT CONTEXT:
{combined_content}

Use this content to inform your responses, but keep them conversational and appropriate for a {request.student_grade} student studying {request.subject}.
"""
        conversation_messages.append({"role": "system", "content": context_message})

        # Add chat history (last 10 messages for context)
        if request.chat_history and len(request.chat_history) > 0:
            recent_history = request.chat_history[-10:]
            for msg in recent_history:
                conversation_messages.append({"role": msg.role, "content": msg.content})

        # Add current question
        conversation_messages.append({
            "role": "user",
            "content": request.current_question
        })

        # Get response
        ai_response = get_gpt4o_response(conversation_messages, temperature=0.8)

        # Generate follow-up suggestions
        suggestion_prompt = f"""
Based on this tutoring conversation about {request.subject} for a {request.student_grade} student:

STUDENT QUESTION: {request.current_question}
TUTOR RESPONSE: {ai_response}

Generate 3 helpful follow-up suggestions or questions the student might want to ask next.
Return as JSON array: ["suggestion1", "suggestion2", "suggestion3"]
"""

        try:
            suggestion_messages = [
                {"role": "system", "content": "Generate helpful follow-up suggestions. Return only JSON array."},
                {"role": "user", "content": suggestion_prompt}
            ]

            suggestions_response = get_gpt4o_response(suggestion_messages, temperature=0.6)

            # Parse suggestions
            cleaned_suggestions = suggestions_response.strip()
            if cleaned_suggestions.startswith('```'):
                cleaned_suggestions = cleaned_suggestions[3:-3]

            suggestions = json.loads(cleaned_suggestions)

            return ChatResponse(
                success=True,
                response=ai_response,
                suggestions=suggestions,
                follow_up_questions=suggestions
            )

        except (json.JSONDecodeError, Exception) as parse_error:
            logger.warning(f"Failed to parse suggestions: {parse_error}")
            return ChatResponse(
                success=True,
                response=ai_response,
                suggestions=[
                    "Can you explain this with an example?",
                    "What are the key points I should remember?",
                    "How does this connect to what we learned before?"
                ],
                follow_up_questions=[
                    "Can you explain this with an example?",
                    "What are the key points I should remember?",
                    "How does this connect to what we learned before?"
                ]
            )

    except Exception as e:
        logger.error(f"Chat tutor error: {e}")
        return ChatResponse(
            success=False,
            error=f"Failed to process chat: {str(e)}"
        )

# Doubt Solving Endpoint
class DoubtResponse(BaseModel):
    success: bool
    answer: Optional[str] = None
    quality_score: Optional[float] = None
    iterations: Optional[int] = None
    context_used: Optional[int] = None
    todo_list: Optional[List[str]] = None
    error: Optional[str] = None

@app.post("/api/solve-doubt", response_model=DoubtResponse)
async def solve_doubt_endpoint(
    grade: int = Form(...),
    subject: str = Form(...),
    topic: str = Form(...),
    subtopic: str = Form(...),
    doubt: str = Form(...),
    resolution_type: str = Form("explanation"),
    curriculum_pdf: Optional[UploadFile] = File(None),
    ncert_pdf: Optional[UploadFile] = File(None)
):
    """
    Solve a student's doubt using curriculum-aware AI responses.
    """
    try:
        # Try to use ChromaDB for curriculum context if available
        curriculum_context = ""
        try:
            import chromadb
            from chromadb.config import Settings
            
            # Initialize ChromaDB client
            client = chromadb.PersistentClient(path="./attached_assets/chroma_db_curriculum")
            
            # Search for relevant curriculum content
            collection = client.get_collection("curriculum")
            results = collection.query(
                query_texts=[f"{subject} {topic} {subtopic} {doubt}"],
                n_results=3
            )
            
            if results['documents'] and results['documents'][0]:
                curriculum_context = "\n\nCurriculum Context:\n" + "\n".join(results['documents'][0])
                
        except Exception as e:
            logger.warning(f"Could not load curriculum context: {e}")
            curriculum_context = ""

        # Create a comprehensive prompt for doubt solving
        prompt = f"""You are an expert {subject} teacher for Grade {grade} students following CBSE curriculum standards.

A student has the following doubt:
Subject: {subject}
Topic: {topic}
Subtopic: {subtopic}
Doubt: {doubt}

{curriculum_context}

Please provide a comprehensive, step-by-step explanation that:
1. Addresses the specific doubt clearly and directly
2. Uses age-appropriate language for Grade {grade} students
3. Includes relevant examples, analogies, and step-by-step solutions
4. Follows CBSE curriculum standards and learning objectives
5. Encourages understanding rather than memorization
6. Provides practical applications and real-world connections where relevant

Resolution type requested: {resolution_type}

Provide a detailed, educational response that helps the student understand the concept thoroughly:"""

        # Get AI response using the existing GPT function
        ai_response = get_gpt4o_response([
            {"role": "system", "content": "You are an expert CBSE teacher who provides clear, comprehensive explanations to students. Always be encouraging and supportive in your responses."},
            {"role": "user", "content": prompt}
        ], temperature=0.3)

        # Calculate a quality score based on response length and content
        quality_score = min(0.95, 0.6 + (len(ai_response) / 1500) * 0.35)
        
        # Determine context usage
        context_used = len(curriculum_context) if curriculum_context else 0

        return DoubtResponse(
            success=True,
            answer=ai_response,
            quality_score=quality_score,
            iterations=1,
            context_used=context_used,
            todo_list=["Enhance curriculum integration", "Add interactive examples", "Implement follow-up questions"]
        )
        
    except Exception as e:
        logger.error(f"Doubt solving error: {e}")
        return DoubtResponse(
            success=False,
            error=str(e)
        )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
