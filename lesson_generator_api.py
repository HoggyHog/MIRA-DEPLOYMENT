from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
import sys
from typing import Optional

# Add current directory to Python path
sys.path.append('.')

# Import the RAG logic
from final_agentic_m4_RAG_logic import OrchestratorAgent

app = FastAPI(title="Lesson Generator API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
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

class LessonResponse(BaseModel):
    success: bool
    lesson_content: str
    error: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "Lesson Generator API is running", "status": "healthy"}

@app.post("/api/generate-lesson", response_model=LessonResponse)
async def generate_lesson(
    subject: str = Form(...),
    topic: str = Form(...),
    subtopics: str = Form(...),
    grade_level: str = Form("10"),
    special_requirements: str = Form("")
):
    try:
        print(f"Generating lesson for {subject}: {topic}")
        
        # Initialize the orchestrator
        orchestrator = OrchestratorAgent()
        
        # Generate the lesson
        lesson = orchestrator.generate_lesson(
            subject=subject,
            topic=topic,
            grade_level=grade_level,
            pdf_path=None,
            subtopics=subtopics,
            special_requirements=special_requirements
        )
        
        # Convert to markdown
        lesson_content = lesson.to_markdown()
        
        return LessonResponse(
            success=True,
            lesson_content=lesson_content
        )
        
    except Exception as e:
        print(f"Error generating lesson: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8001)
