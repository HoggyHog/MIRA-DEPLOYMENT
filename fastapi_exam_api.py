from fastapi import FastAPI, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import sys
import os
from dotenv import load_dotenv
from pypdf import PdfReader
from openai import OpenAI
from langsmith import traceable, Client

# Load environment variables from .env
load_dotenv()

# Ensure final_agentic_m4_RAG_logic.py is importable
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from final_agentic_m4_RAG_logic import generate_lesson

app = FastAPI()

# Allow CORS for all origins (adjust as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_client = OpenAI(api_key=OPENAI_API_KEY)

os.environ.setdefault("LANGSMITH_TRACING", "true")
os.environ.setdefault("LANGSMITH_PROJECT", "Mira-Content-Summarization")
os.environ.setdefault("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com")
os.environ.setdefault("LANGSMITH_API_KEY", "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")
langsmith_client = Client()

class LessonRequest(BaseModel):
    grade: str
    subject: str
    sub_topic: str
    subtopics: Optional[str] = ""
    difficulty: Optional[str] = "medium"
    question_types: Optional[List[str]] = ["mcq", "short_answer"]
    duration: Optional[int] = 60
    special_remarks: Optional[str] = ""
    total_marks: Optional[int] = 100

class SummarizeTextRequest(BaseModel):
    text: str

@app.post("/api/generate-lesson")
async def generate_lesson_endpoint(request: LessonRequest):
    lesson_markdown = generate_lesson(
        subject=request.subject,
        topic=request.sub_topic,
        grade_level=request.grade,
        subtopics=request.subtopics or "",
        special_requirements=request.special_remarks or "",
        output_format="markdown"
    )
    return {"success": True, "lesson_content": lesson_markdown}

@app.post("/api/summarize-content")
@traceable
async def summarize_content(request: Request, file: Optional[UploadFile] = File(None)):
    text = None
    if file:
        # Extract text from PDF
        pdf_reader = PdfReader(await file.read())
        text = "\n".join(page.extract_text() or "" for page in pdf_reader.pages)
    else:
        data = await request.json()
        text = data.get("text", "")
    if not text or len(text.strip()) == 0:
        return JSONResponse({"summary": "No content to summarize."})
    # Summarize using OpenAI
    prompt = (
        "You are a CBSE tutor. Summarize the following content for the purpose of understanding and memorizing. "
        "Do not miss any technical information and do not over-simplify.\n\nContent:\n" + text
    )
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "system", "content": prompt}],
        max_tokens=512,
        temperature=0.3
    )
    summary = response.choices[0].message.content
    return JSONResponse({"summary": summary})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("fastapi_exam_api:app", host="0.0.0.0", port=4444, reload=True) 