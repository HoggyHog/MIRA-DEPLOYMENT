from fastapi import FastAPI, Form, HTTPException, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
import os
import sys
from typing import Optional, List
from dotenv import load_dotenv
from pypdf import PdfReader
from io import BytesIO
from pypdf.errors import PdfStreamError
from summarizer import SummarizationOrchestrator
from youtube_transcript_api._api import YouTubeTranscriptApi

# Add current directory to Python path
sys.path.append('.')

# Import the RAG logic
from final_agentic_m4_RAG_logic import OrchestratorAgent, generate_lesson

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

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8001)
