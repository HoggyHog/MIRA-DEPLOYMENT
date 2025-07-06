#!/usr/bin/env python
# coding: utf-8

import os
import json
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from pypdf import PdfReader
from openai import OpenAI
import chromadb
from chromadb.utils import embedding_functions
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document

# LangSmith tracing setup
from langsmith import traceable, Client
import uuid

# Configure LangSmith tracing (matching final_agentic_m4_RAG_logic.py)
os.environ.setdefault("LANGSMITH_TRACING", "true")
os.environ.setdefault("LANGSMITH_PROJECT", "Mira-Exam-Generation")
os.environ.setdefault("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com")
os.environ.setdefault("LANGSMITH_API_KEY", "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")

langsmith_client = Client()
# LangSmith API key will be set from environment

# Configuration
CBSE_GRADES = ["6", "7", "8", "9", "10", "11", "12"]
CBSE_SUBJECTS = ["Mathematics", "Science", "English", "Social Studies", "Hindi"]
DIFFICULTY_LEVELS = ["easy", "medium", "hard", "mixed"]
QUESTION_TYPES = ["mcq", "short_answer", "long_answer", "numerical", "diagram", "mixed"]
EXAM_DURATIONS = ["30", "60", "90", "120", "180"]  # in minutes

@dataclass
class TestPaperConfig:
    grade: str
    subject: str
    sub_topic: str
    difficulty: str
    question_types: List[str]
    duration: int  # in minutes
    special_remarks: str
    total_marks: int = 100
    num_questions: int = None

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

@traceable
def get_gpt4o_response(messages: List[Dict], temperature: float = 0.3) -> str:
    """Get response from GPT-4o-mini API with tracing"""
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=temperature,
            max_tokens=4000
        )
        return response.choices[0].message.content
    except Exception as e:
        return ""

@traceable
def get_embeddings(text: str) -> List[float]:
    """Get embeddings using OpenAI's text-embedding-3-small model"""
    try:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        return []

class CBSEValidationAgent:
    """Agent to validate inputs against CBSE curriculum standards using GPT-4o and RAG"""
    
    @traceable
    def __init__(self):
        self.chroma_client = chromadb.PersistentClient(path="./cbse_validation_db")
        self.collection = self._create_collection()
        self._load_basic_curriculum(self.collection)
    
    def _create_collection(self):
        """Create or get ChromaDB collection for curriculum validation"""
        try:
            return self.chroma_client.get_collection("cbse_curriculum")
        except:
            return self.chroma_client.create_collection(
                name="cbse_curriculum",
                embedding_function=embedding_functions.OpenAIEmbeddingFunction(
                    api_key=os.getenv('OPENAI_API_KEY'),
                    model_name="text-embedding-3-small"
                )
            )
    
    def _load_basic_curriculum(self, collection):
        """Load basic CBSE curriculum structure"""
        curriculum_data = [
            {"id": "math_6", "content": "Grade 6 Mathematics: Numbers, Basic Operations, Fractions, Decimals, Geometry", "grade": "6", "subject": "Mathematics"},
            {"id": "math_7", "content": "Grade 7 Mathematics: Integers, Fractions and Decimals, Data Handling, Simple Equations, Lines and Angles", "grade": "7", "subject": "Mathematics"},
            {"id": "math_8", "content": "Grade 8 Mathematics: Rational Numbers, Linear Equations, Understanding Quadrilaterals, Practical Geometry", "grade": "8", "subject": "Mathematics"},
            {"id": "math_9", "content": "Grade 9 Mathematics: Number Systems, Coordinate Geometry, Linear Equations in Two Variables, Introduction to Euclid's Geometry", "grade": "9", "subject": "Mathematics"},
            {"id": "math_10", "content": "Grade 10 Mathematics: Real Numbers, Polynomials, Pair of Linear Equations in Two Variables, Quadratic Equations, Arithmetic Progressions, Triangles, Coordinate Geometry, Introduction to Trigonometry, Some Applications of Trigonometry, Circles, Areas Related to Circles, Surface Areas and Volumes, Statistics, Probability", "grade": "10", "subject": "Mathematics"},
            {"id": "science_6", "content": "Grade 6 Science: Food, Components of Food, Fibre to Fabric, Sorting Materials into Groups, Separation of Substances, Changes Around Us, Getting to Know Plants, Body Movements, The Living Organisms and Their Surroundings, Motion and Measurement of Distances, Light Shadows and Reflections, Electricity and Circuits", "grade": "6", "subject": "Science"},
            {"id": "science_7", "content": "Grade 7 Science: Nutrition in Plants, Nutrition in Animals, Fibre to Fabric, Heat, Acids Bases and Salts, Physical and Chemical Changes, Weather Climate and Adaptations of Animals to Climate, Winds Storms and Cyclones, Soil, Respiration in Organisms, Transportation in Animals and Plants, Reproduction in Plants, Motion and Time, Electric Current and Its Effects, Light, Water A Precious Resource, Forests Our Lifeline, Wastewater Story", "grade": "7", "subject": "Science"},
            {"id": "science_8", "content": "Grade 8 Science: Crop Production and Management, Microorganisms Friend and Foe, Synthetic Fibres and Plastics, Materials Metals and Non-Metals, Coal and Petroleum, Combustion and Flame, Conservation of Plants and Animals, Cell Structure and Functions, Reproduction in Animals, Reaching the Age of Adolescence, Force and Pressure, Friction, Sound, Chemical Effects of Electric Current, Some Natural Phenomena, Light, Stars and The Solar System, Pollution of Air and Water", "grade": "8", "subject": "Science"},
            {"id": "science_9", "content": "Grade 9 Science: Matter in Our Surroundings, Is Matter Around Us Pure, Atoms and Molecules, Structure of the Atom, The Fundamental Unit of Life, Tissues, Diversity in Living Organisms, Motion, Force and Laws of Motion, Gravitation, Work and Energy, Sound, Why Do We Fall Ill, Natural Resources, Improvement in Food Resources", "grade": "9", "subject": "Science"},
            {"id": "science_10", "content": "Grade 10 Science: Chemical Reactions and Equations, Acids Bases and Salts, Metals and Non-metals, Carbon and Its Compounds, Periodic Classification of Elements, Life Processes, Control and Coordination, How Do Organisms Reproduce, Heredity and Evolution, Light Reflection and Refraction, Human Eye and Colourful World, Electricity, Magnetic Effects of Electric Current, Our Environment, Management of Natural Resources", "grade": "10", "subject": "Science"},
        ]
        
        try:
            existing_docs = collection.get()
            if len(existing_docs['ids']) == 0:
                contents = [item['content'] for item in curriculum_data]
                ids = [item['id'] for item in curriculum_data]
                metadatas = [{"grade": item['grade'], "subject": item['subject']} for item in curriculum_data]
                
                collection.add(
                    documents=contents,
                    ids=ids,
                    metadatas=metadatas
                )
        except Exception as e:
            pass
    
    @traceable
    def validate_input(self, grade: str, subject: str, sub_topic: str) -> Dict:
        """Validate input using GPT-4o and curriculum knowledge"""
        try:
            # Query relevant curriculum content
            query_results = self.collection.query(
                query_texts=[f"{grade} {subject} {sub_topic}"],
                n_results=3
            )
            
            context = ""
            if query_results['documents']:
                context = " ".join(query_results['documents'][0])
            
            messages = [
                {
                    "role": "system",
                    "content": f"""You are a CBSE curriculum expert. Validate if the given topic is part of the CBSE curriculum for the specified grade and subject.

Curriculum Context: {context}

Respond with a JSON object containing:
- "valid": true/false
- "curriculum_aligned": true/false  
- "suggestion": string (if not valid, suggest correct topic)
- "explanation": string (brief explanation)"""
                },
                {
                    "role": "user",
                    "content": f"Grade: {grade}, Subject: {subject}, Topic: {sub_topic}"
                }
            ]
            
            response = get_gpt4o_response(messages)
            
            try:
                return json.loads(response)
            except:
                return {
                    "valid": True,
                    "curriculum_aligned": True,
                    "suggestion": "",
                    "explanation": "Validation completed"
                }
        except Exception as e:
            return {
                "valid": True,
                "curriculum_aligned": True,
                "suggestion": "",
                "explanation": "Validation completed"
            }

class CBSEQuestionGenerators:
    """Question generators for different types using GPT-4o"""
    
    @staticmethod
    @traceable
    def generate_mcq(config: TestPaperConfig) -> str:
        messages = [
            {
                "role": "system",
                "content": f"""You are an expert CBSE question paper creator. Generate multiple choice questions for Grade {config.grade} {config.subject}.

Requirements:
- Topic: {config.sub_topic}
- Difficulty: {config.difficulty}
- Total duration: {config.duration} minutes
- Special requirements: {config.special_remarks}

Generate MCQs with:
1. Clear, concise questions
2. Four options (A, B, C, D)
3. Appropriate difficulty level
4. CBSE format compliance
5. Include mark allocation

Format each question as:
Q1. [Question text] [1 mark]
(A) Option 1
(B) Option 2  
(C) Option 3
(D) Option 4

Generate 5-8 MCQs based on the duration and difficulty."""
            },
            {
                "role": "user",
                "content": f"Create MCQ questions for {config.sub_topic} for Grade {config.grade} {config.subject}"
            }
        ]
        return get_gpt4o_response(messages)
    
    @staticmethod
    @traceable
    def generate_short_answer(config: TestPaperConfig) -> str:
        messages = [
            {
                "role": "system",
                "content": f"""You are an expert CBSE question paper creator. Generate short answer questions for Grade {config.grade} {config.subject}.

Requirements:
- Topic: {config.sub_topic}
- Difficulty: {config.difficulty}
- Total duration: {config.duration} minutes
- Special requirements: {config.special_remarks}

Generate short answer questions with:
1. Clear, specific questions
2. Expected answer length: 2-3 sentences
3. Appropriate difficulty level
4. CBSE format compliance
5. Include mark allocation (2-3 marks each)

Format each question as:
Q1. [Question text] [2 marks]

Generate 3-5 short answer questions."""
            },
            {
                "role": "user", 
                "content": f"Create short answer questions for {config.sub_topic} for Grade {config.grade} {config.subject}"
            }
        ]
        return get_gpt4o_response(messages)
    
    @staticmethod
    @traceable(name="generate_long_answer_questions")
    def generate_long_answer(config: TestPaperConfig) -> str:
        messages = [
            {
                "role": "system",
                "content": f"""You are an expert CBSE question paper creator. Generate long answer questions for Grade {config.grade} {config.subject}.

Requirements:
- Topic: {config.sub_topic}
- Difficulty: {config.difficulty}
- Total duration: {config.duration} minutes
- Special requirements: {config.special_remarks}

Generate long answer questions with:
1. Comprehensive questions requiring detailed explanations
2. Expected answer length: 5-8 sentences or step-by-step solutions
3. Appropriate difficulty level
4. CBSE format compliance
5. Include mark allocation (5-8 marks each)

Format each question as:
Q1. [Question text] [5 marks]

Generate 2-3 long answer questions."""
            },
            {
                "role": "user",
                "content": f"Create long answer questions for {config.sub_topic} for Grade {config.grade} {config.subject}"
            }
        ]
        return get_gpt4o_response(messages)
    
    @staticmethod
    @traceable(name="generate_numerical_questions")
    def generate_numerical(config: TestPaperConfig) -> str:
        messages = [
            {
                "role": "system",
                "content": f"""You are an expert CBSE question paper creator. Generate numerical/calculation questions for Grade {config.grade} {config.subject}.

Requirements:
- Topic: {config.sub_topic}
- Difficulty: {config.difficulty}
- Total duration: {config.duration} minutes
- Special requirements: {config.special_remarks}

Generate numerical questions with:
1. Clear problem statements
2. Specific numerical data
3. Step-by-step solution requirements
4. Appropriate difficulty level
5. CBSE format compliance
6. Include mark allocation (3-5 marks each)

Use LaTeX formatting for mathematical expressions:
- Inline math: $expression$
- Block math: $$expression$$

Format each question as:
Q1. [Question text with numerical data] [4 marks]

Generate 3-4 numerical questions."""
            },
            {
                "role": "user",
                "content": f"Create numerical questions for {config.sub_topic} for Grade {config.grade} {config.subject}"
            }
        ]
        return get_gpt4o_response(messages)

class CBSETestPaperOrchestrator:
    """Main orchestrator using GPT-4o for generating complete CBSE test papers"""
    
    @traceable(name="exam_orchestrator_init")
    def __init__(self):
        self.validator = CBSEValidationAgent()
        self.generators = CBSEQuestionGenerators()
    
    @traceable(name="calculate_question_distribution")
    def _calculate_question_distribution(self, config: TestPaperConfig) -> Dict[str, int]:
        """Calculate optimal distribution using GPT-4o"""
        messages = [
            {
                "role": "system",
                "content": f"""You are a CBSE exam planning expert. Calculate the optimal distribution of questions for a {config.duration}-minute exam with {config.total_marks} total marks.

Question types requested: {', '.join(config.question_types)}
Grade: {config.grade}
Subject: {config.subject}

Standard CBSE marking scheme:
- MCQ: 1 mark each (1-2 minutes per question)
- Short Answer: 2-3 marks each (3-5 minutes per question)  
- Long Answer: 5-8 marks each (8-12 minutes per question)
- Numerical: 3-5 marks each (5-8 minutes per question)

Respond with only a JSON object containing the number of questions for each type:
{{"mcq": 0, "short_answer": 0, "long_answer": 0, "numerical": 0}}"""
            },
            {
                "role": "user",
                "content": f"Calculate question distribution for {config.duration} minutes, {config.total_marks} marks, types: {config.question_types}"
            }
        ]
        
        response = get_gpt4o_response(messages)
        try:
            return json.loads(response)
        except:
            # Fallback distribution
            return {"mcq": 5, "short_answer": 3, "long_answer": 2, "numerical": 2}
    
    @traceable(name="generate_paper_header")
    def _generate_paper_header(self, config: TestPaperConfig) -> str:
        """Generate CBSE-style paper header using GPT-4o"""
        messages = [
            {
                "role": "system",
                "content": f"""Generate a professional CBSE exam paper header in the standard format.

Requirements:
- Grade: {config.grade}
- Subject: {config.subject}
- Topic: {config.sub_topic}
- Duration: {config.duration} minutes
- Total Marks: {config.total_marks}

Include:
1. CBSE board name
2. Class and subject
3. Time allowed and maximum marks
4. General instructions section
5. Professional formatting

Use proper formatting with **bold** text where appropriate."""
            },
            {
                "role": "user",
                "content": f"Create header for Grade {config.grade} {config.subject} exam on {config.sub_topic}"
            }
        ]
        
        response = get_gpt4o_response(messages)
        return response if response else self._default_header(config)
    
    def _default_header(self, config: TestPaperConfig) -> str:
        """Default header if GPT-4o fails"""
        return f"""**CENTRAL BOARD OF SECONDARY EDUCATION**

**CLASS {config.grade} - {config.subject.upper()}**
**Topic: {config.sub_topic}**

**Time Allowed: {config.duration} minutes**
**Maximum Marks: {config.total_marks}**

**GENERAL INSTRUCTIONS:**
- All questions are compulsory
- Read the questions carefully before answering
- Write your answers clearly and legibly
- Marks are indicated against each question"""
    
    @traceable(name="generate_complete_test_paper")
    def generate_test_paper(self, config: TestPaperConfig) -> Dict:
        """Generate complete CBSE test paper using GPT-4o"""
        try:
            # Validate input
            validation = self.validator.validate_input(config.grade, config.subject, config.sub_topic)
            
            # Calculate question distribution
            distribution = self._calculate_question_distribution(config)
            
            # Generate paper header
            header = self._generate_paper_header(config)
            
            # Generate questions by type
            paper_content = header + "\n\n"
            questions = []
            
            if "mcq" in config.question_types and distribution.get("mcq", 0) > 0:
                mcq_section = self.generators.generate_mcq(config)
                paper_content += f"\n**SECTION A - Multiple Choice Questions**\n\n{mcq_section}\n\n"
                questions.extend([{"type": "mcq", "content": mcq_section}])
            
            if "short_answer" in config.question_types and distribution.get("short_answer", 0) > 0:
                short_section = self.generators.generate_short_answer(config)
                paper_content += f"\n**SECTION B - Short Answer Questions**\n\n{short_section}\n\n"
                questions.extend([{"type": "short_answer", "content": short_section}])
            
            if "long_answer" in config.question_types and distribution.get("long_answer", 0) > 0:
                long_section = self.generators.generate_long_answer(config)
                paper_content += f"\n**SECTION C - Long Answer Questions**\n\n{long_section}\n\n"
                questions.extend([{"type": "long_answer", "content": long_section}])
            
            if "numerical" in config.question_types and distribution.get("numerical", 0) > 0:
                numerical_section = self.generators.generate_numerical(config)
                paper_content += f"\n**SECTION D - Numerical Questions**\n\n{numerical_section}\n\n"
                questions.extend([{"type": "numerical", "content": numerical_section}])
            
            # Calculate total questions
            total_questions = sum(distribution.values())
            
            return {
                "success": True,
                "paper_content": paper_content,
                "metadata": {
                    "grade": config.grade,
                    "subject": config.subject,
                    "sub_topic": config.sub_topic,
                    "difficulty": config.difficulty,
                    "duration": config.duration,
                    "total_questions": total_questions,
                    "total_marks": config.total_marks,
                    "question_distribution": distribution,
                    "curriculum_aligned": validation.get("curriculum_aligned", True),
                    "generated_at": datetime.now().isoformat()
                },
                "questions": questions
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to generate test paper: {str(e)}"
            }

# Main function for external use
@traceable(name="generate_cbse_exam_paper")
def generate_cbse_exam_paper(config_dict: Dict) -> Dict:
    """Main function to generate CBSE exam paper"""
    try:
        config = TestPaperConfig(
            grade=config_dict.get("grade", "10"),
            subject=config_dict.get("subject", "Mathematics"),
            sub_topic=config_dict.get("sub_topic", ""),
            difficulty=config_dict.get("difficulty", "medium"),
            question_types=config_dict.get("question_types", ["mcq"]),
            duration=int(config_dict.get("duration", 60)),
            special_remarks=config_dict.get("special_remarks", ""),
            total_marks=int(config_dict.get("total_marks", 100))
        )
        
        orchestrator = CBSETestPaperOrchestrator()
        return orchestrator.generate_test_paper(config)
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Configuration error: {str(e)}"
        }

if __name__ == "__main__":
    # Example usage
    sample_config = {
        "grade": "10",
        "subject": "Mathematics",
        "sub_topic": "Quadratic Equations",
        "difficulty": "medium",
        "question_types": ["mcq", "short_answer", "long_answer"],
        "duration": 90,
        "special_remarks": "Focus on solving methods",
        "total_marks": 80
    }
    
    result = generate_cbse_exam_paper(sample_config)
    print(json.dumps(result, indent=2))