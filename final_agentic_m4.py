#!/usr/bin/env python
# coding: utf-8

"""
Agentic Lesson Generator using OpenAI GPT-4o

This module implements a multi-agent system for generating high-quality educational lessons.
The system uses specialized agents for different aspects of lesson creation, orchestrated
by a central controller that manages the workflow and ensures quality.
"""

import os
import json
import time
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict, field

from openai import OpenAI
from langsmith import traceable, Client
from langsmith.wrappers import wrap_openai
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

# For PDF processing
from pypdf import PdfReader

# Initialize LangSmith client and set environment variables for tracing
os.environ.setdefault("LANGSMITH_TRACING", "true")
os.environ.setdefault("LANGSMITH_PROJECT", "Mira-Lesson-Generation")
os.environ.setdefault("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com")
os.environ.setdefault("LANGSMITH_API_KEY", "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")
langsmith_client = Client()

# Initialize OpenAI client with LangSmith tracing
client = wrap_openai(OpenAI(api_key=os.getenv("OPENAI_API_KEY")))

# Initialize embeddings and vectorstore
embeddings = OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"))
curriculum_db_path = "./chroma_db_electricity"

# Initialize ChromaDB vectorstore using LangChain
try:
    curriculum_vectorstore = Chroma(
        persist_directory=curriculum_db_path,
        embedding_function=embeddings
    )
except Exception as e:
    print(f"Warning: Could not initialize ChromaDB vectorstore: {e}")
    curriculum_vectorstore = None


@traceable
def query_curriculum_vectorstore(subject: str, topic: str, subtopics: str = "", grade_level: str = "", k: int = 5) -> str:
    """
    Query the ChromaDB vectorstore for relevant curriculum information using LangChain.
    Returns formatted context from the vectorstore for use in lesson generation.
    """
    if not curriculum_vectorstore:
        return ""
    
    try:
        # Create a comprehensive search query
        search_query = f"{subject} {topic} {subtopics} curriculum learning objectives CBSE Class {grade_level}"
        
        # Search the vector store using similarity search
        docs = curriculum_vectorstore.similarity_search(search_query, k=k)
        
        # Format the results into context
        context_parts = []
        for i, doc in enumerate(docs):
            context_entry = f"[Curriculum Reference {i+1}]\n{doc.page_content}\n"
            
            # Add metadata if available
            if doc.metadata:
                meta_info = []
                for key, value in doc.metadata.items():
                    if value:
                        meta_info.append(f"{key}: {value}")
                if meta_info:
                    context_entry += f"Metadata: {', '.join(meta_info)}\n"
            
            context_parts.append(context_entry)
        
        # Combine all context
        if context_parts:
            full_context = "=== CBSE Curriculum Knowledge Base Context ===\n\n" + "\n".join(context_parts)
            return full_context
        else:
            return ""
            
    except Exception as e:
        print(f"Error querying vectorstore: {e}")
        return ""

# Base Agent class for the multi-agent system
class Agent:
    """Base class for all agents in the lesson generation system."""
    
    def __init__(self, model_name: str = "gpt-4o", temperature: float = 0.3):
        self.model_name = model_name
        self.temperature = temperature
        self.client = wrap_openai(OpenAI(api_key=os.getenv("OPENAI_API_KEY")))
    
    @traceable
    def _call_llm(self, messages: List[Dict[str, str]]) -> str:
        """Call the language model with given messages."""
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=self.temperature,
                max_tokens=3000
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            print(f"Error calling LLM: {e}")
            return ""

class PedagogyExpertAgent(Agent):
    """Agent specialized in problem-solving approaches and numerical/application-based questions."""
    
    def __init__(self, model_name: str = "gpt-4o", temperature: float = 0.2):
        """Initialize the pedagogy expert agent."""
        super().__init__(model_name, temperature)
        self.name = "PedagogyExpert"
        self.system_prompt = """You are an expert in problem-solving methodologies and CBSE Class 10 assessment patterns with deep knowledge of numerical problem-solving and application-based questions. Your role is to:

1. Create structured numerical problems aligned with CBSE Class 10 syllabus and board exam patterns
2. Design step-by-step problem-solving approaches for physics, mathematics, and science topics
3. Develop application-based questions that connect theoretical concepts to real-world scenarios
4. Provide detailed solutions with clear mathematical steps and reasoning
5. Ensure all problems follow CBSE marking schemes and difficulty levels
6. Focus on numerical competency and analytical problem-solving skills

Focus on creating comprehensive problem sets with varying difficulty levels, detailed solutions, and clear problem-solving strategies specifically aligned with CBSE Class 10 board examination requirements.
"""
    
    @traceable
    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process input data to create numerical problems and application-based questions."""
        components = input_data.get("components", [])
        curriculum_analysis = input_data.get("curriculum_analysis", {})
        subject = input_data.get("subject", "")
        topic = input_data.get("topic", "")
        subtopics = input_data.get("subtopics", "")
        grade_level = input_data.get("grade_level", "")
        optional_pdf_context = input_data.get("context", "")  # Context from optional PDF
        
        # Query vectorstore for relevant curriculum information
        vectorstore_context = query_curriculum_vectorstore(
            subject=subject,
            topic=topic,
            subtopics=subtopics,
            grade_level=grade_level,
            k=3
        )
        
        # Use context from optional PDF, vectorstore, and general CBSE knowledge
        combined_context = f"""
        {vectorstore_context}
        
        Optional PDF Context (additional materials):
        {optional_pdf_context}
        
        CBSE Class 10 Guidelines:
        Focus on NCERT textbook examples, previous years' board exam questions, and standard CBSE problem formats.
        """
        
        # Extract learning objectives
        learning_objectives = curriculum_analysis.get("learning_objectives", [])
        objectives_text = "\n".join([f"- {obj}" for obj in learning_objectives])
        
        # Process each component to add numerical problems and applications
        enhanced_components = []
        
        for component in components:
            component_type = component.component_type
            content = component.content
            
            prompt = f"""
Transform and enhance the following {component_type.lower()} for a lesson on {topic} (subtopics: {subtopics}) in {subject} for {grade_level} students by adding comprehensive numerical problems and application-based questions.

Learning Objectives:
{objectives_text}

Original Content:
{content}

Context for Problem Creation:
{combined_context}

Enhance this content by:
1. Adding 3-5 numerical problems with step-by-step solutions aligned with CBSE Class 10 board exam patterns
2. Including application-based questions that connect theory to real-world scenarios
3. Providing detailed mathematical solutions with clear reasoning steps
4. Ensuring problems follow CBSE marking schemes (1, 2, 3, and 5 mark questions)
5. Creating problems of varying difficulty levels (basic, intermediate, advanced)
6. Including formula derivations where relevant
7. Adding practice problems for students to solve independently

Structure the enhanced content with:
- Original content (if relevant)
- Numerical Problems Section (with detailed solutions)
- Application-Based Questions Section
- Practice Problems Section (without solutions for student practice)

Focus on numerical competency and problem-solving skills specific to CBSE Class 10 requirements.
"""
            
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": prompt}
            ]
            
            enhanced_content = self._call_llm(messages)
            
            # Create enhanced component
            enhanced_component = LessonComponent(
                component_type=component.component_type,
                content=enhanced_content,
                order=component.order,
                metadata=component.metadata
            )
            enhanced_components.append(enhanced_component)
        
        # Add a new component for comprehensive problem-solving strategies
        problem_solving_strategies_prompt = f"""
Create a comprehensive "Numerical Problem-Solving Strategies" section for the topic "{topic}" and subtopics "{subtopics}" in {subject} for {grade_level} students.

Learning Objectives:
{objectives_text}

Context:
{combined_context}

This section should include:
1. Step-by-step problem-solving methodology specific to this topic
2. 5-7 CBSE board exam style numerical problems with complete solutions
3. Formula sheet with derivations and applications
4. Common mistakes and how to avoid them
5. Real-world applications with numerical examples
6. Quick calculation techniques and shortcuts
7. Problem classification based on CBSE marking schemes (1, 2, 3, 5 marks)

Structure the problems to cover:
- Basic conceptual problems (1-2 marks)
- Standard numerical problems (3 marks)
- Complex application problems (5 marks)
- Previous years' board exam style questions

Ensure all solutions show complete mathematical steps with proper units and significant figures as per CBSE requirements.
"""
        
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": problem_solving_strategies_prompt}
        ]
        
        problem_solving_strategies = self._call_llm(messages)
        
        # Create problem-solving strategies component
        strategies_component = LessonComponent(
            component_type="Numerical Problem-Solving Strategies",
            content=problem_solving_strategies,
            order=6,
            metadata={}
        )
        enhanced_components.append(strategies_component)
        
        # Add a comprehensive assessment component with numerical focus
        assessment_prompt = f"""
Create a "CBSE-Style Numerical Assessment" section for the topic "{topic}" and subtopics "{subtopics}" in {subject} for {grade_level} students.

Learning Objectives:
{objectives_text}

Context:
{combined_context}

This section should include:
1. A complete question paper format following CBSE pattern
2. Questions distributed as per CBSE marking scheme:
   - 5 questions of 1 mark each (MCQ/Fill in the blanks)
   - 4 questions of 2 marks each (Short answer with numerical)
   - 3 questions of 3 marks each (Numerical problems)
   - 2 questions of 5 marks each (Long answer/Application problems)
3. Detailed marking scheme with step-wise marking
4. Model answers with complete solutions
5. Time allocation guidelines
6. Common errors and marking deductions

**EXAMPLE FORMAT:**
For a topic like "Electricity - Ohm's Law" in Physics for Class 10:

**CBSE-Style Question Paper - Electricity (Ohm's Law)**
**Time: 1 hour**                                                             **Maximum Marks: 30**

**SECTION A - Multiple Choice Questions (1 mark each)**
1. The SI unit of resistance is:
   (a) Volt  (b) Ampere  (c) Ohm  (d) Watt
   **Answer: (c) Ohm**

2. According to Ohm's law, V = IR. If voltage is doubled and resistance remains constant, current will:
   (a) Remain same  (b) Double  (c) Become half  (d) Become four times
   **Answer: (b) Double**

**SECTION B - Short Answer Questions (2 marks each)**
3. A resistor of 5Ω is connected to a 10V battery. Calculate the current flowing through it.
   **Solution:** Using Ohm's Law: I = V/R = 10V/5Ω = 2A
   **Marking:** 1 mark for formula, 1 mark for correct answer with unit

4. Define Ohm's Law and state its mathematical expression.
   **Solution:** Ohm's Law states that current through a conductor is directly proportional to voltage across it, provided temperature remains constant. V = IR
   **Marking:** 1 mark for definition, 1 mark for formula

**SECTION C - Long Answer Questions (3 marks each)**
5. A circuit has three resistors of 2Ω, 3Ω, and 5Ω connected in series to a 12V battery. Calculate:
   (a) Total resistance  (b) Total current  (c) Voltage across 5Ω resistor
   **Solution:** 
   (a) R_total = 2+3+5 = 10Ω                     [1 mark]
   (b) I = V/R = 12V/10Ω = 1.2A                  [1 mark]
   (c) V_5Ω = I×R = 1.2A×5Ω = 6V                 [1 mark]

**SECTION D - Application Problems (5 marks each)**
6. A household uses the following appliances daily:
   - 4 LED bulbs (10W each) for 6 hours
   - 1 refrigerator (150W) for 24 hours
   - 1 TV (80W) for 4 hours
   
   If electricity costs ₹5 per kWh, calculate:
   (a) Total energy consumed per day
   (b) Monthly electricity bill (30 days)
   
   **Solution:**
   Energy by bulbs = 4×10W×6h = 240Wh = 0.24kWh     [1 mark]
   Energy by refrigerator = 150W×24h = 3600Wh = 3.6kWh [1 mark]
   Energy by TV = 80W×4h = 320Wh = 0.32kWh          [1 mark]
   Total daily energy = 0.24+3.6+0.32 = 4.16kWh    [1 mark]
   Monthly bill = 4.16×30×₹5 = ₹624                 [1 mark]

**Common Errors and Deductions:**
- Not writing units: -0.5 marks per question
- Wrong formula used: -1 mark
- Calculation errors: -0.5 marks
- Incomplete steps: -1 mark per missing step

Ensure all numerical problems are:
- Aligned with CBSE Class 10 syllabus
- Based on real-world applications
- Include proper units and significant figures
- Follow standard CBSE problem formats
- Cover all subtopics comprehensively
"""
        
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": assessment_prompt}
        ]
        
        assessment_content = self._call_llm(messages)
        
        # Create assessment component
        assessment_component = LessonComponent(
            component_type="CBSE-Style Numerical Assessment",
            content=assessment_content,
            order=7,
            metadata={}
        )
        enhanced_components.append(assessment_component)
        
        return {
            "enhanced_components": enhanced_components,
            "subject": subject,
            "topic": topic,
            "grade_level": grade_level,
            "subtopics": subtopics
        }

@dataclass
class LessonMetadata:
    """Metadata for a lesson, including curriculum alignment and pedagogical information."""
    subject: str
    grade_level: str
    topic: str
    subtopics: List[str]
    learning_objectives: List[str] = field(default_factory=list)
    standards_alignment: List[str] = field(default_factory=list)
    difficulty_level: str = "intermediate"
    estimated_duration: str = "45 minutes"
    prerequisites: List[str] = field(default_factory=list)
    target_skills: List[str] = field(default_factory=list)

@dataclass
class LessonComponent:
    """A component of a lesson, such as an introduction, explanation, or activity."""
    component_type: str
    content: str
    order: int
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class Lesson:
    """A complete lesson with metadata and components."""
    title: str
    metadata: LessonMetadata
    components: List[LessonComponent] = field(default_factory=list)
    version: str = "1.0"
    created_at: float = field(default_factory=time.time)
    quality_score: Optional[float] = None
    feedback: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert lesson to dictionary."""
        return {
            "title": self.title,
            "metadata": asdict(self.metadata),
            "components": [asdict(c) for c in self.components],
            "version": self.version,
            "created_at": self.created_at,
            "quality_score": self.quality_score,
            "feedback": self.feedback
        }

@traceable
def call_openai_api(messages: List[Dict[str, str]], model: str = "gpt-4o-mini") -> str:
    """Call OpenAI API with given messages."""
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.2,
            max_tokens=4000
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        raise Exception(f"OpenAI API error: {str(e)}")

@traceable
def generate_curriculum_analysis(subject: str, topic: str, subtopics: str, grade_level: str, 
                               special_requirements: str, context: str = "") -> Dict[str, Any]:
    """Generate curriculum analysis using OpenAI."""

    # Query vectorstore for relevant curriculum information
    vectorstore_context = query_curriculum_vectorstore(
        subject=subject,
        topic=topic,
        subtopics=subtopics,
        grade_level=grade_level,
        k=5
    )

    system_prompt = """You are an expert lesson designer with specialized knowledge of CBSE (Central Board of Secondary Education) Class 10 educational standards and learning objectives. Your role is to:

1. Analyze CBSE Class 10 curriculum requirements for specific subjects and topics as per NCERT guidelines
2. Define clear, measurable learning objectives aligned with CBSE assessment patterns and board exam requirements
3. Identify key concepts and skills that students should master according to CBSE syllabus and competency framework
4. Ensure alignment with CBSE educational standards, learning outcomes, and board examination patterns
5. Determine appropriate scope and sequence for lessons following NCERT textbook structure and CBSE time allocation

Focus on CBSE Class 10 core subjects including Mathematics, Science (Physics, Chemistry, Biology), Social Science (History, Geography, Political Science, Economics), English, and Hindi. Provide detailed, specific outputs that align with CBSE board exam preparation and Indian educational context."""

    prompt = f"""
I need a comprehensive curriculum analysis for a lesson on {topic} with sub_topics {subtopics} in {subject} for {grade_level} students.

Special requirements: {special_requirements}

{vectorstore_context}

Context from curriculum materials:
{context}

Please provide analysis specifically aligned with CBSE Class 10 standards:

1. A list of 3-5 specific learning objectives for this lesson (ensure they are measurable using Bloom's taxonomy and aligned with CBSE learning outcomes)
2. Key concepts from NCERT textbook that must be covered in this lesson
3. Essential skills students should develop as per CBSE competency-based education framework
4. Relevant CBSE educational standards and learning outcomes this lesson should align with
5. Prerequisites students should already understand from Class 9 or previous Class 10 chapters
6. Appropriate scope for a single lesson on this topic considering CBSE syllabus time allocation
7. Suggested sequence of concepts (from basic to advanced) following NCERT pedagogical approach
8. Potential misconceptions or difficulties CBSE Class 10 students might encounter with this topic, considering board exam preparation needs

Format your response as a structured JSON object with these categories, ensuring content is relevant to CBSE board examination patterns and Indian educational context.
"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt}
    ]

    response = call_openai_api(messages)

    try:
        result = json.loads(response)
    except json.JSONDecodeError:
        # Extract JSON from response
        json_start = response.find('{')
        json_end = response.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            json_str = response[json_start:json_end]
            result = json.loads(json_str)
        else:
            result = {
                "learning_objectives": [f"Understand {topic}"],
                "key_concepts": [topic],
                "essential_skills": ["Problem solving"],
                "standards_alignment": ["CBSE Class 10"],
                "prerequisites": ["Basic knowledge"],
                "scope": f"Single lesson on {topic}",
                "sequence": ["Introduction", "Main content", "Practice"],
                "potential_difficulties": ["Understanding concepts"]
            }

    return result

@traceable
def generate_lesson_content(curriculum_analysis: Dict[str, Any], subject: str, topic: str, 
                          subtopics: str, grade_level: str) -> str:
    """Generate comprehensive lesson content."""

    # Query vectorstore for relevant curriculum information
    vectorstore_context = query_curriculum_vectorstore(
        subject=subject,
        topic=topic,
        subtopics=subtopics,
        grade_level=grade_level,
        k=4
    )

    system_prompt = """You are an expert lesson content with detailed explanation yet simple, specializing in creating detailed, comprehensive educational content for CBSE Class 10 students. Your role is to provide content that:
1. Directly aligns with NCERT textbook concepts and CBSE examination patterns
2. Emphasizes real-world applications and practical problem-solving
3. Includes previous years' CBSE board exam questions and similar practice problems
4. Follows the exact NCERT chapter structure and learning progression
5. Incorporates CBSE marking schemes and answer formats
6. Provides detailed solutions following CBSE answer writing guidelines
7. Includes practical applications and case studies from NCERT exemplar problems
8. Focuses on developing skills needed for CBSE board examinations

IMPORTANT: For each section, you MUST provide actual content, not just instructions or placeholders. Include:
- Complete mathematical formulas with explanations
- Step-by-step solved examples
- Actual experiment procedures and observations
- Real numerical problems with solutions
- Specific examples from NCERT textbook
- Detailed explanations of concepts
- Actual practice questions with answers"""

    prompt = f"""
Create a comprehensive lesson for {subject} on the topic "{topic}" with subtopics "{subtopics}" for Grade {grade_level} students.

{vectorstore_context}

Based on this curriculum analysis:
{json.dumps(curriculum_analysis, indent=2)}

Create a complete lesson with the following structure:

# Lesson Title: [Creative, engaging title]

## NCERT Chapter Alignment
- NCERT Chapter Reference: [Exact chapter number and name]
- Key NCERT Concepts Covered: [List specific concepts from NCERT textbook]
- CBSE Board Exam Weightage: [Marks allocation in board exams]

## Detailed Lesson Content

### 1. Introduction (5-10 minutes)
[Provide actual content:
- Real-world example: [Include a specific, detailed example]
- Practical application: [Describe a real-world scenario]
- Connection to previous chapters: [List specific concepts and their connections]
- Board exam relevance: [Include specific question types and marks distribution]]

### 2. Core Concepts (20-25 minutes)
[Provide actual content:
- Concept 1: [Complete explanation with formulas]
  * Formula: [Write the actual formula]
  * Derivation: [Step-by-step derivation if applicable]
  * Example: [Solved example with steps]
  * Application: [Real-world application]

- Concept 2: [Complete explanation with formulas]
  * Formula: [Write the actual formula]
  * Derivation: [Step-by-step derivation if applicable]
  * Example: [Solved example with steps]
  * Application: [Real-world application]

- Previous Board Exam Questions:
  * Question 1: [Actual question]
  * Solution: [Detailed solution]
  * Marking Scheme: [CBSE marking scheme]]

### 3. Practice Problems (15-20 minutes)
[Provide actual problems:
- NCERT Example 1:
  * Problem: [Actual problem]
  * Solution: [Step-by-step solution]
  * Key Points: [Important concepts used]

- Board Exam Question 1:
  * Problem: [Actual question]
  * Solution: [Detailed solution]
  * Marking Scheme: [CBSE marking scheme]

- Practice Problem 1:
  * Problem: [Actual problem]
  * Solution: [Step-by-step solution]
  * Common Mistakes: [List specific mistakes]]

### 4. Practical Activities (15-20 minutes)
[Provide actual experiment/activity:
- Experiment Title: [Specific name]
- Materials Required: [Complete list]
- Procedure:
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]
- Observations: [Expected observations]
- Calculations: [Required formulas and calculations]
- Results: [Expected results]
- Precautions: [Specific precautions]
- Viva Questions: [Actual questions with answers]]

### 5. Assessment Questions (10 minutes)
[Provide actual questions:
- Multiple Choice Questions:
  1. [Actual question]
     a) [Option]
     b) [Option]
     c) [Option]
     d) [Option]
     Answer: [Correct option]
     Explanation: [Detailed explanation]

- Short Answer Questions:
  1. [Actual question]
     Solution: [Detailed solution]
     Marking Scheme: [CBSE marking scheme]

- Long Answer Questions:
  1. [Actual question]
     Solution: [Detailed solution]
     Marking Scheme: [CBSE marking scheme]]

### 6. Summary and Review (5 minutes)
[Provide actual content:
- Key Formulas: [List all formulas with explanations]
- Important Concepts: [List with brief explanations]
- Quick Review Questions:
  1. [Actual question]
     Answer: [Brief answer]
- Board Exam Tips: [Specific tips for this topic]]

## Additional Resources
[Provide actual resources:
- NCERT Textbook Pages: [Specific page numbers]
- NCERT Exemplar Problems: [Problem numbers]
- Previous Years' Papers: [Specific question numbers]
- Online Resources: [Specific URLs]
- Practice Problems: [Problem numbers]]

## Exam Preparation Focus
[Provide actual content:
- Important Questions:
  1. [Actual question]
     Solution: [Detailed solution]
     Marking Scheme: [CBSE marking scheme]
- Answer Writing Tips: [Specific tips for this topic]
- Time Management: [Specific strategies]
- Sample Answers: [Actual answers with marking scheme]]

Make the lesson content detailed, specific, and directly aligned with NCERT textbook and CBSE examination patterns. Include actual examples, problems, and solutions from NCERT and previous board exams. Ensure all content follows CBSE marking schemes and answer writing guidelines. Provide complete mathematical formulas, derivations, and step-by-step solutions where applicable.
"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt}
    ]

    return call_openai_api(messages)

def extract_pdf_context(pdf_path: Optional[str] = None) -> str:
    """Extract text context from PDF for pedagogy agent."""
    try:
        # Use default NCERT PDF if available
        default_ncert_path = "./attached_assets/b1.pdf"
        ncert_path = pdf_path if pdf_path else default_ncert_path
        
        if not ncert_path or not os.path.exists(ncert_path):
            return ""
            
        # Extract text from PDF
        reader = PdfReader(ncert_path)
        text_content = ""
        for page in reader.pages[:10]:  # Limit to first 10 pages to avoid token limits
            text_content += page.extract_text() + "\n"
        
        return text_content[:3000]  # Limit context size
    except Exception as e:
        print(f"Error extracting PDF context: {e}")
        return ""

@traceable
def generate_lesson(subject: str, topic: str, grade_level: str, pdf_path: Optional[str] = None, 
                   subtopics: str = "", special_requirements: str = "", context: str = "") -> Tuple[str, Dict]:
    """
    Main function to generate a comprehensive lesson plan with pedagogy expert enhancement.
    
    Args:
        subject: The subject of the lesson
        topic: The main topic
        grade_level: Grade level (default "10")
        pdf_path: Optional path to curriculum PDF
        subtopics: Comma-separated subtopics
        special_requirements: Special requirements for the lesson
        context: Additional context from curriculum materials
    
    Returns:
        Tuple of (lesson_content, lesson_data)
    """
    
    try:
        # Query vectorstore for initial context retrieval
        initial_vectorstore_context = query_curriculum_vectorstore(
            subject=subject,
            topic=topic,
            subtopics=subtopics,
            grade_level=grade_level,
            k=3
        )
        
        # Generate curriculum analysis with vectorstore context
        curriculum_analysis = generate_curriculum_analysis(
            subject, topic, subtopics, grade_level, special_requirements, context
        )

        # Generate base lesson content with vectorstore context
        base_lesson_content = generate_lesson_content(
            curriculum_analysis, subject, topic, subtopics, grade_level
        )

        # Create base lesson components
        base_components = [
            LessonComponent(
                component_type="Complete Lesson Plan",
                content=base_lesson_content,
                order=1
            )
        ]

        # Initialize PedagogyExpertAgent
        pedagogy_agent = PedagogyExpertAgent(
            model_name="gpt-4o",
            temperature=0.2
        )
        
        # Extract PDF context for enhanced content
        pdf_context = extract_pdf_context(pdf_path)

        # Prepare input data for pedagogy agent with all context sources
        pedagogy_input = {
            "components": base_components,
            "curriculum_analysis": curriculum_analysis,
            "subject": subject,
            "topic": topic,
            "subtopics": subtopics,
            "grade_level": grade_level,
            "context": f"{initial_vectorstore_context}\n\n{context}\n\nPDF Context:\n{pdf_context}"
        }

        # Process through pedagogy agent to add numerical problems and assessments
        pedagogy_result = pedagogy_agent.process(pedagogy_input)
        enhanced_components = pedagogy_result.get("enhanced_components", base_components)

        # Combine all enhanced content
        combined_content = []
        for component in enhanced_components:
            combined_content.append(f"## {component.component_type}\n\n{component.content}\n\n")
        
        final_lesson_content = "\n".join(combined_content)

        # Create lesson metadata
        metadata = LessonMetadata(
            subject=subject,
            grade_level=grade_level,
            topic=topic,
            subtopics=subtopics.split(',') if subtopics else [],
            learning_objectives=curriculum_analysis.get('learning_objectives', []),
            standards_alignment=curriculum_analysis.get('standards_alignment', []),
            prerequisites=curriculum_analysis.get('prerequisites', [])
        )

        # Create enhanced lesson object
        lesson = Lesson(
            title=f"{subject}: {topic} - Comprehensive Lesson with Numerical Problems",
            metadata=metadata,
            components=enhanced_components
        )

        return final_lesson_content, lesson.to_dict()

    except Exception as e:
        raise Exception(f"Failed to generate lesson: {str(e)}")