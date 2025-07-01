from fastapi import FastAPI, Form, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import time
import shutil

# Import the doubt solving module
import sys
import os
sys.path.append('./attached_assets')
from doubt_solving_module_openai import CBSE_DoubtSolver, UserQuery, create_vector_store_from_pdf

app = FastAPI(title="CBSE Doubt Solver API", version="1.0.0")

# Initialize the doubt solver
doubt_solver_instance = None

def get_doubt_solver(curriculum_pdf_path=None, ncert_pdf_path=None):
    """Initialize doubt solver with optional PDF paths"""
    global doubt_solver_instance
    
    # Use default PDFs if available
    default_curriculum = "./attached_assets/curc_sci-25.pdf"
    default_ncert = "./attached_assets/b1.pdf"
    
    curriculum_path = curriculum_pdf_path if curriculum_pdf_path else default_curriculum
    ncert_path = ncert_pdf_path if ncert_pdf_path else default_ncert
    
    try:
        # Create vector stores
        curriculum_vectorstore = create_vector_store_from_pdf(curriculum_path, "curriculum_db")
        ncert_vectorstore = create_vector_store_from_pdf(ncert_path, "ncert_db")
        
        # Initialize doubt solver
        return CBSE_DoubtSolver(curriculum_vectorstore, ncert_vectorstore)
    except Exception as e:
        print(f"Error initializing doubt solver: {e}")
        # Fallback to basic initialization
        return CBSE_DoubtSolver(None, None)

def solve_doubt(grade, subject, topic, subtopic, doubt, resolution_type="explanation", 
                curriculum_pdf_path=None, ncert_pdf_path=None):
    """Wrapper function to solve doubt using the CBSE_DoubtSolver"""
    
    # Create UserQuery object
    query = UserQuery(
        grade=grade,
        subject=subject,
        topic=topic,
        subtopic=subtopic,
        doubt=doubt,
        resolution_type=resolution_type
    )
    
    # Get doubt solver instance
    solver = get_doubt_solver(curriculum_pdf_path, ncert_pdf_path)
    
    # Solve the doubt
    result = solver.solve_doubt(query)
    
    return result

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    Solve a student's doubt using uploaded PDFs (optional).
    """
    curriculum_pdf_path = None
    ncert_pdf_path = None

    try:
        # Save uploaded PDFs temporarily
        if curriculum_pdf:
            curriculum_pdf_path = f"temp_curriculum_{int(time.time())}.pdf"
            with open(curriculum_pdf_path, "wb") as f:
                shutil.copyfileobj(curriculum_pdf.file, f)
        if ncert_pdf:
            ncert_pdf_path = f"temp_ncert_{int(time.time())}.pdf"
            with open(ncert_pdf_path, "wb") as f:
                shutil.copyfileobj(ncert_pdf.file, f)

        # Call your agentic function
        result = solve_doubt(
            grade=grade,
            subject=subject,
            topic=topic,
            subtopic=subtopic,
            doubt=doubt,
            resolution_type=resolution_type,
            curriculum_pdf_path=curriculum_pdf_path,
            ncert_pdf_path=ncert_pdf_path
        )

        # Clean up temp files
        if curriculum_pdf_path and os.path.exists(curriculum_pdf_path):
            os.remove(curriculum_pdf_path)
        if ncert_pdf_path and os.path.exists(ncert_pdf_path):
            os.remove(ncert_pdf_path)

        return DoubtResponse(success=True, **result)

    except Exception as e:
        # Clean up temp files in case of error
        if curriculum_pdf_path and os.path.exists(curriculum_pdf_path):
            os.remove(curriculum_pdf_path)
        if ncert_pdf_path and os.path.exists(ncert_pdf_path):
            os.remove(ncert_pdf_path)
        return DoubtResponse(success=False, error=str(e))

@app.get("/")
async def root():
    return {"message": "CBSE Doubt Solver API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
