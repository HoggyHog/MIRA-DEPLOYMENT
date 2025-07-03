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

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

class PracticeAnalysisResponse(BaseModel):
    success: bool
    overall_score: Optional[float] = None
    total_marks: Optional[int] = None
    question_analyses: Optional[List[QuestionAnalysis]] = None
    general_feedback: Optional[str] = None
    error: Optional[str] = None

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
As an expert CBSE question-answer checker, analyze the following student responses against the ideal answers step by step:

=== IDEAL ANSWERS/REFERENCE CONTENT (CBSE PATTERN) ===
{ideal_content}

=== STUDENT RESPONSES ===
{student_responses}

CONDUCT DETAILED STEP-BY-STEP ANALYSIS:

For each question, perform the following analysis:

1. **STEP-BY-STEP COMPARISON:**
   - Break down both ideal and student answers into logical steps
   - Compare each step individually
   - Note where the student went wrong in the solution process

2. **MISTAKE IDENTIFICATION:**
   - Conceptual errors (misunderstanding of fundamental concepts)
   - Procedural errors (wrong method or formula application)
   - Calculation mistakes (arithmetic errors)
   - Presentation issues (missing units, diagrams, labels)
   - Incomplete solutions (missing steps or conclusions)

3. **CONCEPT GAP ANALYSIS:**
   - Identify specific CBSE curriculum concepts not understood
   - Note prerequisite knowledge gaps
   - Highlight connections between concepts that are missing

4. **CBSE MARKING SCHEME ALIGNMENT:**
   - Apply CBSE-style step-wise marking
   - Allocate marks for method, calculation, and conclusion
   - Consider partial credit for correct approach despite errors

Provide response in the following JSON format:

{{
    "overall_score": <percentage_score>,
    "total_marks": <total_possible_marks>,
    "question_analyses": [
        {{
            "question_number": <number>,
            "question_text": "<extracted_question>",
            "student_answer": "<student_response>",
            "ideal_answer": "<expected_answer>",
            "marks_awarded": <marks_given>,
            "total_marks": <marks_possible>,
            "marking_scheme": "<CBSE_style_step_wise_marking_breakdown>",
            "step_by_step_comparison": [
                {{
                    "step": "<step_description>",
                    "ideal_approach": "<what_should_be_done>",
                    "student_approach": "<what_student_did>",
                    "error_type": "<conceptual/procedural/calculation/presentation>",
                    "marks_lost": <marks_deducted_for_this_step>
                }}
            ],
            "mistakes_identified": [
                {{
                    "mistake": "<specific_mistake>",
                    "category": "<conceptual/procedural/calculation/presentation>",
                    "severity": "<high/medium/low>",
                    "cbse_curriculum_topic": "<relevant_CBSE_topic>"
                }}
            ],
            "concept_gaps": [
                {{
                    "concept": "<missing_concept>",
                    "cbse_chapter": "<relevant_CBSE_chapter>",
                    "prerequisite_knowledge": "<what_should_be_known_first>",
                    "impact": "<how_this_gap_affects_understanding>"
                }}
            ],
            "improvement_suggestions": "<specific_actionable_advice_with_CBSE_resources>",
            "strengths": ["<positive_aspects_in_student_response>"],
            "remedial_actions": [
                "<specific_CBSE_textbook_references>",
                "<practice_problem_types>",
                "<concept_revision_needed>"
            ]
        }}
    ],
    "general_feedback": "<overall_performance_summary_with_CBSE_preparation_strategy>",
    "cbse_exam_readiness": {{
        "current_level": "<below_average/average/above_average>",
        "key_areas_to_focus": ["<area1>", "<area2>"],
        "expected_improvement_timeline": "<realistic_timeframe>",
        "cbse_specific_tips": ["<tip1>", "<tip2>"]
    }}
}}

IMPORTANT CBSE-SPECIFIC GUIDELINES:
- Use CBSE marking scheme patterns (usually 1 mark for method, 1 mark for calculation, 1 mark for answer/conclusion)
- Identify common CBSE question types (Very Short Answer, Short Answer, Long Answer)
- Note CBSE-specific requirements (diagram labeling, unit specification, significant figures)
- Reference specific CBSE textbook chapters and concepts
- Provide improvement suggestions aligned with CBSE curriculum and exam patterns
- Consider CBSE evaluation criteria for different subjects
- Focus on both understanding and application as per CBSE standards
"""

        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        try:
            response = get_gpt4o_response(messages)
            # Try to parse JSON response
            import json
            return json.loads(response)
        except json.JSONDecodeError:
            # If JSON parsing fails, return a structured error
            return {
                "error": "Failed to parse analysis response",
                "raw_response": response
            }

@app.get("/")
async def root():
    return {"message": "AI Practice Playground API is running", "version": "1.0.0"}

@app.post("/analyze-practice", response_model=PracticeAnalysisResponse)
async def analyze_practice_session(
    ideal_content_pdf: UploadFile = File(...),
    student_responses_pdf: UploadFile = File(...),
    subject: str = Form(...),
    grade: str = Form(...),
    topic: str = Form(...)
):
    """
    Analyze student practice session by comparing responses with ideal answers.
    
    Args:
        ideal_content_pdf: PDF containing ideal answers or reference content
        student_responses_pdf: PDF containing student's responses
        subject: Subject name (e.g., Mathematics, Science)
        grade: Grade level (e.g., 10, 12)
        topic: Topic being assessed
    
    Returns:
        Detailed analysis with marking, misconceptions, and improvement suggestions
    """
    try:
        # Validate file types
        if not ideal_content_pdf.filename.endswith('.pdf'):
            return PracticeAnalysisResponse(
                success=False,
                error="Ideal content file must be a PDF"
            )
        
        if not student_responses_pdf.filename.endswith('.pdf'):
            return PracticeAnalysisResponse(
                success=False,
                error="Student responses file must be a PDF"
            )
        
        # Extract text from both PDFs
        ideal_content_bytes = await ideal_content_pdf.read()
        student_responses_bytes = await student_responses_pdf.read()
        
        ideal_content = extract_text_from_pdf(ideal_content_bytes)
        student_responses = extract_text_from_pdf(student_responses_bytes)
        
        if not ideal_content.strip():
            return PracticeAnalysisResponse(
                success=False,
                error="Could not extract text from ideal content PDF"
            )
        
        if not student_responses.strip():
            return PracticeAnalysisResponse(
                success=False,
                error="Could not extract text from student responses PDF"
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
        
        return PracticeAnalysisResponse(
            success=True,
            overall_score=analysis_result.get("overall_score", 0),
            total_marks=analysis_result.get("total_marks", 0),
            question_analyses=question_analyses,
            general_feedback=analysis_result.get("general_feedback", "")
        )
        
    except Exception as e:
        logger.error(f"Practice analysis error: {e}")
        return PracticeAnalysisResponse(
            success=False,
            error=f"Analysis failed: {str(e)}"
        )

@app.get("/practice-config-options")
async def get_practice_config_options():
    """Get available configuration options for practice analysis"""
    return {
        "subjects": ["Mathematics", "Science", "English", "Social Studies", "Hindi", "Physics", "Chemistry", "Biology"],
        "grades": ["6", "7", "8", "9", "10", "11", "12"],
        "analysis_types": ["detailed", "quick", "conceptual"],
        "supported_formats": ["PDF"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)