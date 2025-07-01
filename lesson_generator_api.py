from fastapi import FastAPI, HTTPException, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import tempfile
import shutil
import os

# Import your generate_lesson function
from final_agentic_m4 import generate_lesson

app = FastAPI(title="Lesson Generator API", version="1.0.0")

# Add CORS middleware (same as in the reference script)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LessonResponse(BaseModel):
    success: bool
    lesson_content: Optional[Any] = None
    lesson_data: Optional[Dict] = None
    error: Optional[str] = None

def extract_text_from_pdf(file_path: str) -> str:
    # Dummy implementation: replace with your PDF extraction logic if needed
    try:
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading PDF: {str(e)}")

@app.post("/api/generate-lesson", response_model=LessonResponse)
async def generate_lesson_endpoint(
    subject: str = Form(...),
    topic: str = Form(...),
    subtopics: str = Form(...),
    grade_level: str = Form("10"),
    special_requirements: str = Form(""),
    curriculum_pdf: Optional[UploadFile] = File(None)
):
    """Generate a comprehensive lesson plan."""
    try:
        context = ""

        # Handle PDF upload if provided
        if curriculum_pdf:
            if not curriculum_pdf.filename.endswith('.pdf'):
                raise HTTPException(status_code=400, detail="Please upload a PDF file")
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                shutil.copyfileobj(curriculum_pdf.file, tmp_file)
                tmp_path = tmp_file.name
            try:
                context = extract_text_from_pdf(tmp_path)
            finally:
                os.unlink(tmp_path)

        # Call your generate_lesson function with all relevant parameters
        lesson_content, lesson_data = generate_lesson(
            subject=subject,
            topic=topic,
            grade_level=grade_level,
            pdf_path=curriculum_pdf.filename if curriculum_pdf else None,
            subtopics=subtopics,
            special_requirements=special_requirements,
            context=context  # If your function supports context
        )

        return LessonResponse(
            success=True,
            lesson_content=lesson_content,
            lesson_data=lesson_data
        )
    except Exception as e:
        return LessonResponse(success=False, error=str(e))

@app.get("/api/lesson-config-options")
async def get_lesson_config_options():
    """Get available configuration options for lesson generation."""
    return {
        "subjects": ["Mathematics", "Science", "English", "Social Studies", "Hindi", "Physics", "Chemistry", "Biology"],
        "grade_levels": ["6", "7", "8", "9", "10", "11", "12"],
        "difficulty_levels": ["easy", "medium", "hard", "mixed"]
    }

@app.get("/")
async def root():
    return {"message": "Lesson Generator API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
