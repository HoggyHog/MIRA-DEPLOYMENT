import os
import json
import hashlib
import time
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict, field
from openai import OpenAI
# LangSmith tracing imports and setup
from langsmith import traceable, Client
from langsmith.wrappers import wrap_openai
os.environ.setdefault("LANGSMITH_TRACING", "true")
os.environ.setdefault("LANGSMITH_PROJECT", "Mira-Lesson-Generation")
os.environ.setdefault("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com")
os.environ.setdefault("LANGSMITH_API_KEY", "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")
langsmith_client = Client()

# For vector database and embeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OllamaEmbeddings

# For LLM integration
from langchain_community.llms import Ollama
from langchain.schema import HumanMessage, SystemMessage, AIMessage
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

# For OpenAI embeddings
from langchain_openai import OpenAIEmbeddings

# For PDF processing
from pypdf import PdfReader

# For logging
import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
DEFAULT_MODEL = "gpt-4o-mini"
FASTER_MODEL = "gpt-4o-mini"
DEFAULT_TEMPERATURE = 0.2
DEFAULT_MAX_TOKENS = 4000
# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Get OpenAI API key from environment variable
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

# Ensure OPENAI_API_KEY is a string for type safety
assert isinstance(OPENAI_API_KEY, str)



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
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert metadata to dictionary."""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'LessonMetadata':
        """Create metadata from dictionary."""
        return cls(**data)


# In[3]:


@dataclass
class LessonComponent:
    """A component of a lesson, such as an introduction, explanation, or activity."""
    component_type: str
    content: str
    order: int
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert component to dictionary."""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'LessonComponent':
        """Create component from dictionary."""
        return cls(**data)

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
            "metadata": self.metadata.to_dict(),
            "components": [c.to_dict() for c in self.components],
            "version": self.version,
            "created_at": self.created_at,
            "quality_score": self.quality_score,
            "feedback": self.feedback
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Lesson':
        """Create lesson from dictionary."""
        metadata = LessonMetadata.from_dict(data["metadata"])
        components = [LessonComponent.from_dict(c) for c in data["components"]]
        return cls(
            title=data["title"],
            metadata=metadata,
            components=components,
            version=data.get("version", "1.0"),
            created_at=data.get("created_at", time.time()),
            quality_score=data.get("quality_score"),
            feedback=data.get("feedback", [])
        )
    
    def to_markdown(self) -> str:
        """Convert lesson to markdown format."""
        md = f"# {self.title}\n\n"
        
        # Add metadata section
        md += "## Lesson Metadata\n\n"
        md += f"- **Subject:** {self.metadata.subject}\n"
        md += f"- **Grade Level:** {self.metadata.grade_level}\n"
        md += f"- **Topic:** {self.metadata.topic}\n"
        md += f"- **Subtopics:** {', '.join(self.metadata.subtopics)}\n"
        md += f"- **Difficulty Level:** {self.metadata.difficulty_level}\n"
        md += f"- **Estimated Duration:** {self.metadata.estimated_duration}\n\n"
        
        # Add learning objectives
        md += "### Learning Objectives\n\n"
        for i, objective in enumerate(self.metadata.learning_objectives, 1):
            md += f"{i}. {objective}\n"
        md += "\n"
        
        # Add standards alignment if available
        if self.metadata.standards_alignment:
            md += "### Standards Alignment\n\n"
            for standard in self.metadata.standards_alignment:
                md += f"- {standard}\n"
            md += "\n"
        
        # Add prerequisites if available
        if self.metadata.prerequisites:
            md += "### Prerequisites\n\n"
            for prereq in self.metadata.prerequisites:
                md += f"- {prereq}\n"
            md += "\n"
        
        # Sort components by order and add them
        sorted_components = sorted(self.components, key=lambda x: x.order)
        for component in sorted_components:
            md += f"## {component.component_type}\n\n"
            md += f"{component.content}\n\n"
        
        return md
    
    def to_json(self) -> str:
        """Convert lesson to JSON string."""
        return json.dumps(self.to_dict(), indent=2)
    
    @classmethod
    def from_json(cls, json_str: str) -> 'Lesson':
        """Create lesson from JSON string."""
        data = json.loads(json_str)
        return cls.from_dict(data)




class Agent:
    """Base class for all agents in the system."""
    
    def __init__(self, model_name: str = DEFAULT_MODEL, temperature: float = DEFAULT_TEMPERATURE):
        """Initialize the agent with OpenAI's GPT-4o Mini model."""
        self.client = OpenAI(api_key=OPENAI_API_KEY)
        self.model_name = model_name
        self.temperature = temperature
        self.max_tokens = DEFAULT_MAX_TOKENS
        self.system_prompt = "You are a helpful AI assistant."
        self.name = "BaseAgent"
    
    def _call_llm(self, messages: List[Dict[str, str]]) -> str:
        """Call the OpenAI GPT-4o Mini API with the given messages."""
        try:
            # Ensure system prompt is included if not already present
            formatted_messages = []
            has_system = any(msg["role"] == "system" for msg in messages)
            if not has_system:
                formatted_messages.append({
                    "role": "system", 
                    "content": self.system_prompt
                })
            formatted_messages.extend(messages)
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=formatted_messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error calling OpenAI API: {e}")
            return "I apologize, but I encountered an error processing your request."
    
    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process input data and return output. To be implemented by subclasses."""
        raise NotImplementedError("Subclasses must implement this method")





class CurriculumExpertAgent(Agent):
    """Agent specialized in curriculum analysis and learning objective definition."""
    
    def __init__(self, model_name: str = DEFAULT_MODEL, temperature: float = 0.1, vectorstore: Chroma = None):
        """Initialize the curriculum expert agent."""
        super().__init__(model_name, temperature)
        self.name = "CurriculumExpert"
        self.vectorstore = vectorstore
        self.system_prompt = """You are an expert curriculum designer with specialized knowledge of CBSE (Central Board of Secondary Education) educational standards and learning objectives. Your role is to:

1. Analyze CBSE curriculum requirements for specific subjects and topics as per NCERT guidelines
2. Define clear, measurable learning objectives aligned with CBSE assessment patterns and board exam requirements
3. Identify key concepts and skills that students should master according to CBSE syllabus and competency framework
4. Ensure alignment with CBSE educational standards, learning outcomes, and board examination patterns
5. Determine appropriate scope and sequence for lessons following NCERT textbook structure and CBSE time allocation

Focus on CBSE core subjects including Mathematics, Science (Physics, Chemistry, Biology), Social Science (History, Geography, Political Science, Economics), English, and Hindi. Provide detailed, specific outputs that align with CBSE board exam preparation and Indian educational context.

**EXAMPLE OUTPUT FORMAT:**
For a topic like "Acids and Bases" in Chemistry for Class 10:

{{
    "learning_objectives": [
        "Define acids and bases using Arrhenius and Bronsted-Lowry theories",
        "Identify common acids and bases in daily life and their uses",
        "Explain the concept of pH scale and its significance",
        "Demonstrate neutralization reactions with balanced chemical equations",
        "Analyze the strength of acids and bases using indicators"
    ],
    "key_concepts": [
        "Arrhenius theory of acids and bases",
        "pH scale and its range (0-14)",
        "Indicators and their color changes",
        "Neutralization reactions",
        "Common acids: HCl, H2SO4, HNO3",
        "Common bases: NaOH, KOH, Ca(OH)2"
    ],
    "essential_skills": [
        "Chemical equation balancing",
        "Laboratory safety procedures",
        "pH measurement techniques",
        "Identifying acid-base reactions",
        "Problem-solving with molarity calculations"
    ],
    "standards_alignment": [
        "CBSE Class 10 Science - Chapter 2: Acids, Bases and Salts",
        "Learning Outcome: Understanding chemical reactions in daily life",
        "Competency: Scientific inquiry and problem-solving"
    ],
    "prerequisites": [
        "Basic understanding of chemical reactions from Class 9",
        "Knowledge of chemical symbols and formulas",
        "Concept of ions and ionic compounds"
    ],
    "scope": "Single 45-minute lesson covering basic definitions, properties, and 2-3 simple examples",
    "sequence": [
        "Introduction to acids and bases in daily life",
        "Scientific definitions (Arrhenius theory)",
        "Properties and examples",
        "pH scale introduction",
        "Simple neutralization reactions"
    ],
    "potential_misconceptions": [
        "Thinking all acids are dangerous (many are weak and safe)",
        "Confusing concentration with strength of acids",
        "Believing pH only applies to laboratory solutions",
        "Mixing up acid-base color changes with different indicators"
    ]
}}

Format your response as a structured JSON object with these categories, ensuring content is relevant to CBSE board examination patterns and Indian educational context.
"""
    
    def get_curriculum_context(self, subject: str, topic: str, subtopics: str, k: int = 5, grade_level: str = None) -> str:
        """Retrieve relevant curriculum context from the vector store"""
        if not self.vectorstore:
            return ""
        try:
            search_query = f"{subject} {topic} {subtopics} curriculum learning objectives"
            # Use filter for source_type: Curriculum, class, and subject
            filter_dict = {"source_type": "curriculum"}
            if grade_level:
                filter_dict["class"] = grade_level
            if subject:
                filter_dict["subject"] = subject
            docs = self.vectorstore.similarity_search(
                search_query, k=k, filter=filter_dict
            )
            context = "\n\n".join([doc.page_content for doc in docs])
            return context
        except Exception as e:
            print(f"Error retrieving curriculum context: {e}")
            return ""
    
    @traceable
    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process input data to generate curriculum analysis and learning objectives."""
        subject = input_data.get("subject", "")
        topic = input_data.get("topic", "")
        subtopics = input_data.get("subtopics","")
        grade_level = input_data.get("grade_level", "")
        special_requirements = input_data.get("special_requirements", "")
        context = input_data.get("context", "")
        
        # Get additional curriculum context from RAG
        curriculum_context = self.get_curriculum_context(subject, topic, subtopics, grade_level=grade_level)
        
        # Combine both contexts
        combined_context = f"""
   
        Curriculum Analysis Context:
        {curriculum_context}
        """
        
        prompt = f"""
I need a comprehensive curriculum analysis for a lesson on {topic} with sub_topics {subtopics} in {subject} for {grade_level} students.

Special requirements: {special_requirements}

Context from curriculum materials:
{combined_context}

Please provide analysis specifically aligned with CBSE standards:

1. A list of 3-5 specific learning objectives for this lesson (ensure they are measurable using Bloom's taxonomy and aligned with CBSE learning outcomes)
2. Key concepts from NCERT textbook that must be covered in this lesson
3. Essential skills students should develop as per CBSE competency-based education framework
4. Relevant CBSE educational standards and learning outcomes this lesson should align with
5. Prerequisites students should already understand from  previous chapters
6. Appropriate scope for a single lesson on this topic considering CBSE syllabus time allocation
7. Suggested sequence of concepts (from basic to advanced) following NCERT pedagogical approach
8. Potential misconceptions or difficulties students might encounter with this topic, considering board exam preparation needs

**EXAMPLE OUTPUT FORMAT:**
For a topic like "Acids and Bases" in Chemistry for Class 10:

{{
    "learning_objectives": [
        "Define acids and bases using Arrhenius and Bronsted-Lowry theories",
        "Identify common acids and bases in daily life and their uses",
        "Explain the concept of pH scale and its significance",
        "Demonstrate neutralization reactions with balanced chemical equations",
        "Analyze the strength of acids and bases using indicators"
    ],
    "key_concepts": [
        "Arrhenius theory of acids and bases",
        "pH scale and its range (0-14)",
        "Indicators and their color changes",
        "Neutralization reactions",
        "Common acids: HCl, H2SO4, HNO3",
        "Common bases: NaOH, KOH, Ca(OH)2"
    ],
    "essential_skills": [
        "Chemical equation balancing",
        "Laboratory safety procedures",
        "pH measurement techniques",
        "Identifying acid-base reactions",
        "Problem-solving with molarity calculations"
    ],
    "standards_alignment": [
        "CBSE Class 10 Science - Chapter 2: Acids, Bases and Salts",
        "Learning Outcome: Understanding chemical reactions in daily life",
        "Competency: Scientific inquiry and problem-solving"
    ],
    "prerequisites": [
        "Basic understanding of chemical reactions from Class 9",
        "Knowledge of chemical symbols and formulas",
        "Concept of ions and ionic compounds"
    ],
    "scope": "Single 45-minute lesson covering basic definitions, properties, and 2-3 simple examples",
    "sequence": [
        "Introduction to acids and bases in daily life",
        "Scientific definitions (Arrhenius theory)",
        "Properties and examples",
        "pH scale introduction",
        "Simple neutralization reactions"
    ],
    "potential_misconceptions": [
        "Thinking all acids are dangerous (many are weak and safe)",
        "Confusing concentration with strength of acids",
        "Believing pH only applies to laboratory solutions",
        "Mixing up acid-base color changes with different indicators"
    ]
}}

Format your response as a structured JSON object with these categories, ensuring content is relevant to CBSE board examination patterns and Indian educational context.
"""
        
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        response = self._call_llm(messages)
        
        # Parse the JSON response
        try:
            result = json.loads(response)
        except json.JSONDecodeError:
            # If the response is not valid JSON, try to extract JSON using a simple heuristic
            try:
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = response[json_start:json_end]
                    result = json.loads(json_str)
                else:
                    # Create a structured result manually
                    logger.warning("Could not parse JSON from curriculum expert response")
                    result = {
                        "learning_objectives": ["Understand " + topic],
                        "key_concepts": [topic],
                        "essential_skills": ["Understanding of " + topic],
                        "standards_alignment": [],
                        "prerequisites": [],
                        "scope": "Single lesson on " + topic,
                        "sequence": [topic],
                        "potential_misconceptions": []
                    }
            except Exception as e:
                logger.error(f"Error extracting JSON from response: {e}")
                result = {
                    "learning_objectives": ["Understand " + topic],
                    "key_concepts": [topic],
                    "essential_skills": ["Understanding of " + topic],
                    "standards_alignment": [],
                    "prerequisites": [],
                    "scope": "Single lesson on " + topic,
                    "sequence": [topic],
                    "potential_misconceptions": []
                }
        
        return {
            "curriculum_analysis": result,
            "subject": subject,
            "subtopics":subtopics,
            "topic": topic,
            "grade_level": grade_level
        }




class ContentCreationAgent(Agent):
    """Agent specialized in creating educational content based on curriculum requirements."""
    
    def __init__(self, model_name: str = DEFAULT_MODEL, temperature: float = 0.3, vectorstore: Chroma = None):
        """Initialize the content creation agent."""
        super().__init__(model_name, temperature)
        self.name = "ContentCreator"
        self.vectorstore = vectorstore
        self.system_prompt = """You are an expert educational content creator with specialized knowledge of CBSE curriculum and NCERT textbook standards. Your role is to:

1. Create accurate, comprehensive explanations aligned with NCERT textbook content and CBSE syllabus
2. Develop clear examples to explain the topics if needed
3. Design effective practice problems and activities that prepare students for CBSE board examinations
4. Structure content following NCERT pedagogical approach and logical progression
5. Ensure appropriate depth and breadth of coverage as per CBSE standards
6. Incorporate assessment elements aligned with CBSE marking schemes and question patterns

Focus on creating content that is factually accurate, culturally relevant, clear, engaging, and specifically designed for CBSE board exam preparation while following NCERT guidelines.
CRITICAL: You MUST respond with ONLY valid JSON format. No additional text before or after the JSON.


"""
    
    def get_content_context(self, subject: str, topic: str, subtopics: str, k: int = 5, grade_level: str = None) -> str:
        """Retrieve relevant content context from the fixed vector store"""
        if not self.vectorstore:
            return ""
        try:
            search_query = f"{subject} {topic} {subtopics} NCERT content examples problems activities"
            # Use filter for source_type: ncert, class, and subject
            filter_dict = {"source_type": "ncert"}
            if grade_level:
                filter_dict["class"] = grade_level
            if subject:
                filter_dict["subject"] = subject
            docs = self.vectorstore.similarity_search(
                search_query, k=k, filter=filter_dict
            )
            context = "\n\n".join([doc.page_content for doc in docs])
            return context
        except Exception as e:
            print(f"Error retrieving content context: {e}")
            return ""
    
    @traceable
    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process input data to generate educational content."""
        curriculum_analysis = input_data.get("curriculum_analysis", {})
        subject = input_data.get("subject", "")
        topic = input_data.get("topic", "")
        subtopics = input_data.get("subtopics", "")
        grade_level = input_data.get("grade_level", "")
        context = input_data.get("context", "")  # This is from optional PDF
        
        # Get additional content context from fixed database
        fixed_database_context = self.get_content_context(subject, topic, subtopics, grade_level=grade_level)
        
        # Combine both contexts
        combined_context = f"""
        Fixed Database Content Context:
        {fixed_database_context}
        
        Optional PDF Content Context:
        {context}
        """
        
        # Extract key information from curriculum analysis
        learning_objectives = curriculum_analysis.get("learning_objectives", [])
        key_concepts = curriculum_analysis.get("key_concepts", [])
        sequence = curriculum_analysis.get("sequence", [])
        
        # Format the learning objectives and key concepts as bullet points
        objectives_text = "\n".join([f"- {obj}" for obj in learning_objectives])
        concepts_text = "\n".join([f"- {concept}" for concept in key_concepts])
        sequence_text = "\n".join([f"{i+1}. {step}" for i, step in enumerate(sequence)])
        
        prompt = f"""
Create comprehensive educational content for a lesson on {topic} and sub-topics : {subtopics} in {subject} for {grade_level} students.

Learning Objectives:
{objectives_text}

Key Concepts to Cover:
{concepts_text}

Suggested Sequence:
{sequence_text}

Context from curriculum materials and fixed database:
{combined_context}

Return your response as a JSON object with exactly these keys:

{{
    "introduction": "Mentioning objectives and basic definitions around the {topic} and {subtopics}",
    "core_content": "Detailed explanations of each key concept and sub-topic following NCERT approach, with clear definitions, step-by-step explanations, Indian context examples, and numerical problems with answers",
    "examples": "2-3 detailed worked examples that demonstrate application of concepts, follow CBSE board exam question patterns, and include step-by-step solutions",
    "practice_activities": "Practice problems and activities that reinforce key learning objectives",
    "summary": "Summary that highlights important formulas/concepts for board exams and connects to upcoming topics"
}}

**EXAMPLE OUTPUT FORMAT:**
For a topic like "Light Reflection" in Physics for Class 10:

{{
    "introduction": "Light reflection is a fundamental optical phenomenon where light rays bounce off surfaces. In this lesson, we will explore the laws of reflection, types of reflection, and their applications in mirrors and everyday life. By the end of this lesson, students will understand how reflection works and be able to solve problems involving plane and curved mirrors, preparing them for CBSE board examinations.",
    
    "core_content": "**Laws of Reflection:**\\n1. The incident ray, reflected ray, and normal all lie in the same plane\\n2. The angle of incidence equals the angle of reflection (∠i = ∠r)\\n\\n**Types of Reflection:**\\n- Regular reflection: Occurs on smooth surfaces like mirrors\\n- Irregular/Diffuse reflection: Occurs on rough surfaces\\n\\n**Plane Mirrors:**\\n- Image characteristics: Virtual, erect, same size, laterally inverted\\n- Image distance = Object distance\\n\\n**Numerical Example:**\\nIf an object is placed 20 cm in front of a plane mirror, the image will be formed 20 cm behind the mirror, making the total distance between object and image = 40 cm.",
    
    "examples": "**Example 1: Angle of Reflection**\\nAn incident ray strikes a plane mirror at an angle of 30° with the normal. Find the angle of reflection.\\n**Solution:** According to the law of reflection, angle of incidence = angle of reflection = 30°\\n\\n**Example 2: Image Position**\\nA student stands 1.5 m away from a plane mirror. How far is the student from their image?\\n**Solution:** Object distance = 1.5 m, Image distance = 1.5 m (behind mirror)\\nTotal distance = 1.5 + 1.5 = 3.0 m",
    
    "practice_activities": "**Activity 1:** Draw ray diagrams for objects placed at different distances from a plane mirror\\n**Activity 2:** Calculate angles of reflection for incident rays at 15°, 45°, and 60°\\n**Activity 3:** Practical experiment using laser pointer and mirror to verify laws of reflection\\n**Activity 4:** Solve CBSE previous year questions on reflection",
    
    "summary": "**Key Points for Board Exams:**\\n- Laws of reflection (memorize both laws)\\n- Image characteristics of plane mirror: SAME size, Virtual, Erect, Laterally inverted\\n- Formula: Object distance = Image distance (for plane mirrors)\\n- Regular vs Irregular reflection\\n**Connection to Next Topic:** This foundation in reflection will help us understand refraction and lens behavior in upcoming chapters."
}}

Ensure all content is specifically aligned with CBSE Class 10 standards.
"""

        
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        response = self._call_llm(messages)
        
        # Parse the JSON response
        try:
            result = json.loads(response)
        except json.JSONDecodeError:
            # If the response is not valid JSON, try to extract JSON using a simple heuristic
            try:
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = response[json_start:json_end]
                    result = json.loads(json_str)
                else:
                    # Create a structured result manually
                    logger.warning("Could not parse JSON from content creator response")
                    result = {
                        "introduction": f"Introduction to {topic}",
                        "core_content": f"Explanation of {topic}",
                        "examples": f"Examples of {topic}",
                        "practice_activities": f"Practice activities for {topic}",
                        "summary": f"Summary of {topic}"
                    }
            except Exception as e:
                logger.error(f"Error extracting JSON from response: {e}")
                result = {
                    "introduction": f"Introduction to {topic}",
                    "core_content": f"Explanation of {topic}",
                    "examples": f"Examples of {topic}",
                    "practice_activities": f"Practice activities for {topic}",
                    "summary": f"Summary of {topic}"
                }

                
        
        # Create lesson components from the content
        components = []
        component_order = {
            "introduction": 1,
            "core_content": 2,
            "examples": 3,
            "practice_activities": 4,
            "summary": 5
        }
        
        for component_type, content in result.items():
            order = component_order.get(component_type, 99)
            component = LessonComponent(
                component_type=component_type.replace("_", " ").title(),
                content=content,
                order=order
            )
            components.append(component)
        
        return {
            "components": components,
            "subject": subject,
            "topic": topic,
            "subtopics":subtopics,
            "grade_level": grade_level
        }



class PedagogyExpertAgent(Agent):
    """Agent specialized in problem-solving approaches and numerical/application-based questions."""
    
    def __init__(self, model_name: str = DEFAULT_MODEL, temperature: float = 0.2, ncert_vectorstore: Chroma = None):
        """Initialize the pedagogy expert agent."""
        super().__init__(model_name, temperature)
        self.name = "PedagogyExpert"
        self.ncert_vectorstore = ncert_vectorstore
        self.system_prompt = """You are an expert in problem-solving methodologies and CBSE Class 10 assessment patterns with deep knowledge of numerical problem-solving and application-based questions. Your role is to:

1. Create structured numerical problems aligned with CBSE Class 10 syllabus and board exam patterns
2. Design step-by-step problem-solving approaches for physics, mathematics, and science topics
3. Develop application-based questions that connect theoretical concepts to real-world scenarios
4. Provide detailed solutions with clear mathematical steps and reasoning
5. Ensure all problems follow CBSE marking schemes and difficulty levels
6. Focus on numerical competency and analytical problem-solving skills

Focus on creating comprehensive problem sets with varying difficulty levels, detailed solutions, and clear problem-solving strategies specifically aligned with CBSE Class 10 board examination requirements.
"""
    
    def get_ncert_context(self, subject: str, topic: str, subtopics: str, k: int = 3, grade_level: str = None) -> str:
        """Retrieve relevant NCERT context for problem-solving and examples"""
        if not self.ncert_vectorstore:
            return ""
        try:
            search_query = f"{subject} {topic} {subtopics} NCERT problems numerical questions solved examples CBSE Class 10"
            # Use filter for source_type: question_bank, class, and subject
            filter_dict = {"source_type": "question_bank"}
            if grade_level:
                filter_dict["class"] = grade_level
            if subject:
                filter_dict["subject"] = subject
            docs = self.ncert_vectorstore.similarity_search(
                search_query, k=k, filter=filter_dict
            )
            context = "\n\n".join([doc.page_content for doc in docs])
            return context
        except Exception as e:
            print(f"Error retrieving NCERT context for pedagogy: {e}")
            return ""
    
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
        
        # Get RAG context from NCERT database
        ncert_context = self.get_ncert_context(subject, topic, subtopics, grade_level=grade_level)
        
        # Combine both contexts
        combined_context = f"""
        NCERT Database Context (for problem examples and solutions):
        {ncert_context}
        
        Optional PDF Context (additional materials):
        {optional_pdf_context}
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

RAG Context for Problem Creation:
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

RAG Context:
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

RAG Context:
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



# In[8]:



class ProblemSolvingExpertAgent(Agent):
    """Agent specialized in problem-solving techniques and methodologies."""
    
    def __init__(self, model_name: str = DEFAULT_MODEL, temperature: float = 0.2):
        """Initialize the problem-solving expert agent."""
        super().__init__(model_name, temperature)
        self.name = "ProblemSolvingExpert"
        self.system_prompt = """You are an expert in problem-solving methodologies and critical thinking approaches with deep knowledge of how students develop analytical skills. Your role is to:

1. Design structured problem-solving frameworks for specific topics
2. Create step-by-step problem-solving strategies tailored to the subject matter
3. Develop critical thinking exercises that build analytical capabilities
4. Provide real-world problem scenarios that connect to the curriculum
5. Suggest scaffolding techniques to guide students through complex problem-solving processes

Focus on developing students' analytical thinking, logical reasoning, and systematic approach to solving problems in the given subject area.
"""
    
    @traceable
    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process input data to enhance content with problem-solving techniques."""
        components = input_data.get("components", [])
        curriculum_analysis = input_data.get("curriculum_analysis", {})
        subject = input_data.get("subject", "")
        topic = input_data.get("topic", "")
        subtopics = input_data.get("subtopics", "")
        grade_level = input_data.get("grade_level", "")
        
        # Extract learning objectives
        learning_objectives = curriculum_analysis.get("learning_objectives", [])
        objectives_text = "\n".join([f"- {obj}" for obj in learning_objectives])
        
        # Process each component to enhance with problem-solving techniques
        enhanced_components = []
        
        for component in components:
            component_type = component.component_type
            content = component.content
            
            prompt = f"""
Transform the following {component_type.lower()} for a lesson on {topic} (subtopic: {subtopics}) in {subject} for {grade_level} students into a problem-solving focused approach.

Learning Objectives:
{objectives_text}

Original Content:
{content}

Please redesign this content by:
1. Incorporating specific problem-solving frameworks (e.g., IDEAL method, 5-step problem solving, design thinking)
2. Creating structured analytical thinking exercises related to the topic
3. Developing real-world problem scenarios that students can solve using the concepts
4. Including step-by-step problem-solving processes with clear reasoning steps
5. Adding critical thinking questions that guide students through logical analysis

Provide content that actively engages students in solving problems rather than passively receiving information.
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
        
        # Add a new component for problem-solving strategies
        problem_solving_strategies_prompt = f"""
Create a "Problem-Solving Techniques" section for the topic "{topic}" and subtopic "{subtopics}" in {subject} for {grade_level} students.

Learning Objectives:
{objectives_text}

This section should include:
1. Specific problem-solving frameworks applicable to this topic (e.g., scientific method, mathematical problem-solving steps, historical analysis framework)
2. Step-by-step analytical thinking processes students should follow
3. Common problem types in this subject area and systematic approaches to solve them
4. Critical thinking questions and prompts that guide logical reasoning
5. Troubleshooting strategies for when students get stuck
6. Real-world problem scenarios that require application of the topic concepts

Provide practical, systematic approaches that students can apply independently to solve problems in this subject area.
"""
        
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": problem_solving_strategies_prompt}
        ]
        
        problem_solving_strategies = self._call_llm(messages)
        
        # Create problem-solving strategies component
        strategies_component = LessonComponent(
            component_type="Problem-Solving Techniques",
            content=problem_solving_strategies,
            order=6,
            metadata={}
        )
        enhanced_components.append(strategies_component)
        
        # Add a problem-based assessment component
        assessment_prompt = f"""
Create a "Problem-Based Assessment" section for the topic "{topic}" and subtopic "{subtopics}" in {subject} for {grade_level} students.

Learning Objectives:
{objectives_text}

This section should include:
1. Complex, multi-step problems that require application of the learned concepts
2. Real-world scenarios where students must identify the problem, analyze it, and propose solutions
3. Rubric for evaluating problem-solving process (not just final answers)
4. Self-reflection questions for students to assess their own problem-solving approach
5. Progressive problem sets that build from simple to complex analytical challenges
6. Collaborative problem-solving activities that encourage peer discussion and reasoning

Focus on assessing students' analytical thinking process, logical reasoning, and systematic approach to problem-solving rather than memorization.
"""
        
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": assessment_prompt}
        ]
        
        assessment_content = self._call_llm(messages)
        
        # Create assessment component
        assessment_component = LessonComponent(
            component_type="Problem-Based Assessment",
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


# In[9]:



class QualityAssuranceAgent(Agent):
    """Agent specialized in evaluating lesson quality from a first-time student learner's perspective."""
    
    def __init__(self, model_name: str = DEFAULT_MODEL, temperature: float = 0.1):
        """Initialize the quality assurance agent."""
        super().__init__(model_name, temperature)
        self.name = "QualityAssurance"
        self.system_prompt = """You are an expert educational evaluator who assesses lesson quality from the perspective of a CBSE Class 10 student encountering these concepts for the first time. Your role is to:

1. Evaluate whether a first-time learner would understand the concepts clearly
2. Assess if there are enough practice problems and solved examples for mastery
3. Check if explanations are accessible to students with no prior knowledge of the topic
4. Determine if the lesson builds confidence through progressive difficulty
5. Verify that real-world connections help students relate to the material
6. Ensure the lesson prepares students adequately for CBSE board examinations
7. Verify that all content strictly adheres to CBSE Class 10 curriculum guidelines

**Evaluation Perspective**: Always think as a Class 10 student who is:
- Learning this topic for the very first time
- Needs clear, step-by-step explanations
- Requires multiple solved examples to understand patterns
- Benefits from real-world applications to see relevance
- Needs adequate practice to build confidence
- Preparing for CBSE board exams with specific marking schemes
- Following the official CBSE Class 10 syllabus and curriculum

**CBSE Curriculum Compliance**: Ensure that:
- Content depth matches CBSE Class 10 level (not too advanced, not too basic)
- Topics covered are within the prescribed CBSE syllabus
- Complexity and mathematical rigor align with Class 10 standards
- No content goes beyond what's expected at this grade level
- All concepts are age-appropriate and curriculum-compliant

Be thorough, empathetic to student learning challenges, and provide constructive feedback that improves student comprehension and success while maintaining strict CBSE curriculum adherence.
"""
    
    @traceable
    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process input data to evaluate lesson quality and provide feedback."""
        components = input_data.get("enhanced_components", [])
        curriculum_analysis = input_data.get("curriculum_analysis", {})
        subject = input_data.get("subject", "")
        topic = input_data.get("topic", "")
        grade_level = input_data.get("grade_level", "")
        
        # Extract learning objectives
        learning_objectives = curriculum_analysis.get("learning_objectives", [])
        objectives_text = "\n".join([f"- {obj}" for obj in learning_objectives])
        
        # Combine all components into a single lesson text for evaluation
        lesson_text = ""
        for component in sorted(components, key=lambda x: x.order):
            lesson_text += f"## {component.component_type}\n\n{component.content}\n\n"
        
        prompt = f"""
As a CBSE Class 10 student learning about {topic} for the FIRST TIME, evaluate this lesson on how well it would help you understand and master the concepts.

Learning Objectives:
{objectives_text}

Lesson Content:
{lesson_text}

**STUDENT-CENTERED EVALUATION CRITERIA:**

Please evaluate this lesson from a first-time student learner's perspective on the following criteria:

1. **Concept Clarity for Beginners** (1-5): Would I understand the basic concepts clearly as a first-time learner?
2. **Sufficient Problem Exposure** (1-5): Are there enough solved examples and practice problems for me to master the patterns?
3. **Step-by-Step Learning** (1-5): Does the lesson build my understanding progressively from basic to advanced?
4. **Real-World Relevance** (1-5): Can I relate these concepts to my daily life and see why they matter?
5. **Confidence Building** (1-5): Does the lesson give me enough practice to feel confident about the topic?
6. **CBSE Exam Preparation** (1-5): Am I well-prepared for board exam questions after studying this lesson?
7. **Fear Reduction** (1-5): Does the lesson reduce my fear/anxiety about this topic through clear explanations?
8. **CBSE Curriculum Compliance** (1-5): Does the lesson strictly adhere to CBSE Class 10 curriculum guidelines without going beyond or falling short?

**EXAMPLE EVALUATION:**
For a lesson on "Quadratic Equations" in Mathematics:

{{
    "concept_clarity": {{
        "score": 4,
        "strengths": ["Clear definition of quadratic equations", "Good use of visual examples", "Step-by-step formula derivation"],
        "areas_for_improvement": ["Could use more real-life analogies for abstract concepts"],
        "recommendations": ["Add more visual diagrams showing parabola graphs", "Include everyday examples like projectile motion"]
    }},
    "problem_exposure": {{
        "score": 5,
        "strengths": ["15+ solved examples with different difficulty levels", "Covers all question types from CBSE papers", "Progressive difficulty increase"],
        "areas_for_improvement": [],
        "recommendations": ["Continue this excellent approach in other topics"]
    }},
    "step_by_step_learning": {{
        "score": 4,
        "strengths": ["Logical progression from simple to complex", "Each step builds on previous knowledge"],
        "areas_for_improvement": ["Some jumps between intermediate steps"],
        "recommendations": ["Add more intermediate practice before advanced problems"]
    }},
    "real_world_relevance": {{
        "score": 3,
        "strengths": ["Mentions applications in physics and engineering"],
        "areas_for_improvement": ["Limited everyday life connections", "Abstract examples hard to relate to"],
        "recommendations": ["Add examples from sports, architecture, or technology that students can relate to"]
    }},
    "confidence_building": {{
        "score": 4,
        "strengths": ["Plenty of practice problems", "Solutions are detailed", "Encourages multiple solution methods"],
        "areas_for_improvement": ["Could have more beginner-level confidence boosters"],
        "recommendations": ["Start with very simple examples that guarantee early success"]
    }},
    "cbse_exam_preparation": {{
        "score": 5,
        "strengths": ["Question formats match CBSE papers exactly", "Covers all marking schemes", "Time management tips included"],
        "areas_for_improvement": [],
        "recommendations": ["Perfect alignment with board exam requirements"]
    }},
    "fear_reduction": {{
        "score": 3,
        "strengths": ["Encouraging tone", "Emphasizes that everyone can learn"],
        "areas_for_improvement": ["Still feels intimidating for weak students", "Mathematical notation might scare beginners"],
        "recommendations": ["Use more encouraging language", "Start with very basic examples", "Show common mistakes to normalize errors"]
    }},
    "cbse_curriculum_compliance": {{
        "score": 5,
        "strengths": ["Perfect alignment with CBSE Class 10 syllabus", "Appropriate difficulty level", "Covers all required subtopics"],
        "areas_for_improvement": [],
        "recommendations": ["Maintain this excellent curriculum alignment"]
    }},
    "overall_summary": "This lesson effectively covers quadratic equations with strong CBSE alignment and comprehensive problem practice. However, it could be more encouraging for beginners and include more relatable real-world examples to reduce math anxiety.",
    "quality_score": 8
}}

For each criterion:
- Provide a score from 1-5 (where 5 is excellent for a first-time learner)
- Identify what works well for student understanding
- Identify what would confuse or overwhelm a first-time learner
- Provide specific recommendations to improve student comprehension and confidence

**STUDENT PERSPECTIVE QUESTIONS TO CONSIDER:**
- "If I knew nothing about this topic, would I understand it after this lesson?"
- "Do I have enough examples to see the patterns and solve similar problems?"
- "Am I confident enough to attempt board exam questions on this topic?"
- "Do the explanations assume knowledge I don't have as a first-time learner?"
- "Are there enough practice opportunities before I'm expected to solve independently?"
- "Is this content exactly what I need to know for my CBSE Class 10 exams - not more, not less?"
- "Does the lesson cover topics that are actually in my CBSE syllabus?"
- "Is the mathematical/conceptual complexity appropriate for my grade level?"
- "Are the problem types and difficulty levels aligned with what appears in CBSE board papers?"

Also provide an overall evaluation summary from a student's perspective and a final quality score from 1-10 based on how effective this would be for a first-time learner.

Format your response as a JSON object with these categories.
"""
        
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        response = self._call_llm(messages)
        
        # Parse the JSON response
        try:
            result = json.loads(response)
        except json.JSONDecodeError:
            # If the response is not valid JSON, try to extract JSON using a simple heuristic
            try:
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = response[json_start:json_end]
                    result = json.loads(json_str)
                else:
                    # Create a structured result manually
                    logger.warning("Could not parse JSON from quality assurance response")
                    result = {
                        "concept_clarity": {"score": 3, "strengths": [], "areas_for_improvement": [], "recommendations": []},
                        "problem_exposure": {"score": 3, "strengths": [], "areas_for_improvement": [], "recommendations": []},
                        "step_by_step_learning": {"score": 3, "strengths": [], "areas_for_improvement": [], "recommendations": []},
                        "real_world_relevance": {"score": 3, "strengths": [], "areas_for_improvement": [], "recommendations": []},
                        "confidence_building": {"score": 3, "strengths": [], "areas_for_improvement": [], "recommendations": []},
                        "cbse_exam_preparation": {"score": 3, "strengths": [], "areas_for_improvement": [], "recommendations": []},
                        "fear_reduction": {"score": 3, "strengths": [], "areas_for_improvement": [], "recommendations": []},
                        "cbse_curriculum_compliance": {"score": 3, "strengths": [], "areas_for_improvement": [], "recommendations": []},
                        "overall_summary": f"Basic student-centered evaluation of {topic} lesson",
                        "quality_score": 6
                    }
            except Exception as e:
                logger.error(f"Error extracting JSON from response: {e}")
                result = {
                    "concept_clarity": {"score": 3, "strengths": [], "areas_for_improvement": [], "recommendations": []},
                    "problem_exposure": {"score": 3, "strengths": [], "areas_for_improvement": [], "recommendations": []},
                    "step_by_step_learning": {"score": 3, "strengths": [], "areas_for_improvement": [], "recommendations": []},
                    "real_world_relevance": {"score": 3, "strengths": [], "areas_for_improvement": [], "recommendations": []},
                    "confidence_building": {"score": 3, "strengths": [], "areas_for_improvement": [], "recommendations": []},
                    "cbse_exam_preparation": {"score": 3, "strengths": [], "areas_for_improvement": [], "recommendations": []},
                    "fear_reduction": {"score": 3, "strengths": [], "areas_for_improvement": [], "recommendations": []},
                    "cbse_curriculum_compliance": {"score": 3, "strengths": [], "areas_for_improvement": [], "recommendations": []},
                    "overall_summary": f"Basic student-centered evaluation of {topic} lesson",
                    "quality_score": 6
                }
        
        # Extract feedback for each component
        feedback = []
        for category, evaluation in result.items():
            if isinstance(evaluation, dict) and "recommendations" in evaluation:
                for recommendation in evaluation["recommendations"]:
                    feedback.append(f"{category.replace('_', ' ').title()}: {recommendation}")
        
        # Add overall summary
        if "overall_summary" in result:
            feedback.append(f"Overall: {result['overall_summary']}")
        
        # Extract quality score
        quality_score = result.get("quality_score", 6)
        
        return {
            "evaluation": result,
            "feedback": feedback,
            "quality_score": quality_score,
            "components": components,
            "subject": subject,
            "topic": topic,
            "grade_level": grade_level
        }



# In[10]:


class RefinementAgent(Agent):
    """Agent specialized in refining and improving lesson content based on feedback."""
    
    def __init__(self, model_name: str = DEFAULT_MODEL, temperature: float = 0.3):
        """Initialize the refinement agent."""
        super().__init__(model_name, temperature)
        self.name = "Refinement"
        self.system_prompt = """You are an expert educational content refiner with deep knowledge of curriculum, pedagogy, and effective teaching. Your role is to:

1. Improve lesson content based on specific feedback
2. Enhance explanations, examples, and activities
3. Address identified gaps or weaknesses
4. Ensure alignment with learning objectives
5. Polish language and presentation for clarity and engagement

Focus on making targeted, substantive improvements while maintaining the original structure and purpose.
"""
    
    @traceable
    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process input data to refine lesson content based on feedback."""
        components = input_data.get("components", [])
        feedback = input_data.get("feedback", [])
        evaluation = input_data.get("evaluation", {})
        curriculum_analysis = input_data.get("curriculum_analysis", {})
        subject = input_data.get("subject", "")
        topic = input_data.get("topic", "")
        grade_level = input_data.get("grade_level", "")
        
        # Extract learning objectives
        learning_objectives = curriculum_analysis.get("learning_objectives", [])
        objectives_text = "\n".join([f"- {obj}" for obj in learning_objectives])
        
        # Format feedback as bullet points
        feedback_text = "\n".join([f"- {item}" for item in feedback])
        
        # Process each component to refine based on feedback
        refined_components = []
        
        for component in components:
            component_type = component.component_type
            content = component.content
            
            # Find specific feedback for this component type
            component_feedback = []
            for item in feedback:
                if component_type.lower() in item.lower():
                    component_feedback.append(item)
            
            component_feedback_text = "\n".join([f"- {item}" for item in component_feedback])
            if not component_feedback_text:
                component_feedback_text = "No specific feedback for this component."
            
            prompt = f"""
Refine the following {component_type.lower()} for a lesson on {topic} in {subject} for {grade_level} students based on quality feedback.

Learning Objectives:
{objectives_text}

Original Content:
{content}

Feedback (overall):
{feedback_text}

Specific Feedback for this component:
{component_feedback_text}

**EXAMPLE REFINEMENT:**
**Original Content Example:** "Photosynthesis is a process where plants make food using sunlight."

**Feedback Example:** "Too basic for Class 10, needs chemical equation, lacks real-world relevance, students need more detailed explanation"

**Refined Content Example:** "Photosynthesis is the biochemical process where green plants convert carbon dioxide and water into glucose using chlorophyll and sunlight energy. The chemical equation is: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂. This process is crucial for life on Earth as it produces the oxygen we breathe and forms the base of food chains. In India, this process in crops like rice and wheat directly impacts our food security and agricultural economy."

**REFINEMENT TECHNIQUES:**
1. **For "Too Basic" Feedback:** Add scientific terminology, chemical equations, mathematical formulas appropriate for Class 10
2. **For "Lacks Examples" Feedback:** Include 2-3 detailed worked examples with step-by-step solutions
3. **For "Poor Real-World Connection" Feedback:** Add Indian context examples, daily life applications, current events
4. **For "Insufficient Practice" Feedback:** Include more CBSE-style problems with varying difficulty levels
5. **For "Unclear Explanations" Feedback:** Break down complex concepts into smaller steps, use analogies
6. **For "Not CBSE Aligned" Feedback:** Ensure content matches exact CBSE syllabus requirements, add board exam question patterns
7. **For "Intimidating for Beginners" Feedback:** Start with simpler concepts, use encouraging language, show common mistakes as normal
8. **For "Missing Numerical Problems" Feedback:** Add step-by-step mathematical solutions with proper units and significant figures

Please refine this content by:
1. Addressing the specific feedback provided
2. Enhancing explanations, examples, or activities as needed
3. Ensuring strong alignment with the learning objectives
4. Improving clarity, engagement, and effectiveness
5. Maintaining the original purpose and structure while making substantive improvements

**SPECIFIC REFINEMENT FOCUS:**
- If feedback mentions "too difficult": Simplify language, add more basic examples, include prerequisite review
- If feedback mentions "too easy": Add advanced applications, include extension problems, deepen conceptual understanding
- If feedback mentions "lacks engagement": Add interactive elements, real-world scenarios, student-relatable examples
- If feedback mentions "poor progression": Reorganize content logically, add smooth transitions, ensure building complexity

Provide the refined content in a well-structured format that a teacher could use directly.
"""
            
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": prompt}
            ]
            
            refined_content = self._call_llm(messages)
            
            # Create refined component
            refined_component = LessonComponent(
                component_type=component.component_type,
                content=refined_content,
                order=component.order,
                metadata=component.metadata
            )
            refined_components.append(refined_component)
        
        return {
            "refined_components": refined_components,
            "subject": subject,
            "topic": topic,
            "grade_level": grade_level,
            "feedback": feedback
        }




class OrchestratorAgent:
    """Agent that orchestrates the entire lesson generation workflow."""
    
    def __init__(self, model_name: str = DEFAULT_MODEL, embedding_model: str = ""):
        """Initialize the orchestrator with all specialized agents."""
        
        # For tracking progress and errors - initialize first
        self.errors = []
        self.progress = []
        
        # Initialize OpenAI client and embedding model
        self.openai_client = OpenAI(api_key=OPENAI_API_KEY)
        self.embeddings = OpenAIEmbeddings(
            model=embedding_model if embedding_model else "text-embedding-3-small",
            openai_api_key=OPENAI_API_KEY
        )
        
        # Use the new embeddings path
        self.curriculum_db_path = os.path.join(os.getcwd(), "embeddings_test")
        self.content_db_path = os.path.join(os.getcwd(), "embeddings_test")
        self.ncert_db_path = os.path.join(os.getcwd(), "embeddings_test")
        self.optional_pdf_path = "/Users/aryangoyal/Documents/K-12 AI Agent/ncjescsa12.pdf"
        
        # Initialize curriculum vector store from existing chroma database
        self.curriculum_vectorstore = None
        if os.path.exists(self.curriculum_db_path):
            self._log_progress("Initialization", f"Loading curriculum database from {self.curriculum_db_path}")
            try:
                self.curriculum_vectorstore = Chroma(
                    persist_directory=self.curriculum_db_path,
                    embedding_function=self.embeddings
                )
                self._log_progress("Initialization", f"Curriculum database loaded successfully")
            except Exception as e:
                self._log_error("Initialization", f"Failed to load curriculum database: {e}")
        
        # Initialize content vector store from existing chroma database
        self.content_vectorstore = None
        if os.path.exists(self.content_db_path):
            self._log_progress("Initialization", f"Loading content database from {self.content_db_path}")
            try:
                self.content_vectorstore = Chroma(
                    persist_directory=self.content_db_path,
                    embedding_function=self.embeddings
                )
                self._log_progress("Initialization", f"Content database loaded successfully")
            except Exception as e:
                self._log_error("Initialization", f"Failed to load content database: {e}")
        
        # Initialize NCERT vector store from existing chroma database
        self.ncert_vectorstore = None
        if os.path.exists(self.ncert_db_path):
            self._log_progress("Initialization", f"Loading NCERT database from {self.ncert_db_path}")
            try:
                self.ncert_vectorstore = Chroma(
                    persist_directory=self.ncert_db_path,
                    embedding_function=self.embeddings
                )
                self._log_progress("Initialization", f"NCERT database loaded successfully")
            except Exception as e:
                self._log_error("Initialization", f"Failed to load NCERT database: {e}")
        
        # Initialize agents with their respective vector stores
        self.curriculum_expert = CurriculumExpertAgent(model_name, vectorstore=self.curriculum_vectorstore)
        self.content_creator = ContentCreationAgent(model_name, vectorstore=self.content_vectorstore)
        self.pedagogy_expert = PedagogyExpertAgent(model_name, ncert_vectorstore=self.ncert_vectorstore)
        self.Problem_Solving_Expert = ProblemSolvingExpertAgent(model_name)
        #self.quality_assurance = QualityAssuranceAgent(model_name)
        #self.refinement_agent = RefinementAgent(model_name)
    
    def _log_progress(self, stage: str, message: str):
        """Log progress of the workflow."""
        self.progress.append({"stage": stage, "message": message})
        logger.info(f"[{stage}] {message}")
    
    def _log_error(self, stage: str, error: str):
        """Log errors encountered during the workflow."""
        self.errors.append({"stage": stage, "error": error})
        logger.error(f"[{stage}] {error}")
    
    def _extract_text_from_pdf(self, pdf_path: str) -> List[Document]:
        """Extract text from a PDF file and create Document objects."""
        self._log_progress("PDF Processing", f"Extracting text from {pdf_path}")
        
        try:
            reader = PdfReader(pdf_path)
            documents = []
            
            # Process each page as a separate document
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                
                if text.strip():  # Only add non-empty pages
                    documents.append(
                        Document(
                            page_content=text.strip(),
                            metadata={
                                "page": i + 1,
                                "source": os.path.basename(pdf_path)
                            }
                        )
                    )
            
            self._log_progress("PDF Processing", f"Created {len(documents)} documents from PDF")
            return documents
        
        except Exception as e:
            self._log_error("PDF Processing", f"Error extracting text from PDF: {str(e)}")
            return []
    
    def _create_vector_store(self, documents: List[Document], persist_directory: str) -> Chroma:
        """Create a vector store from documents."""
        self._log_progress("Vector Store", f"Creating vector store with {len(documents)} documents")
        
        try:
            # Split documents into smaller chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=500,
                chunk_overlap=50,
                separators=["\n\n", "\n", ". ", " ", ""]
            )
            
            splits = text_splitter.split_documents(documents)
            self._log_progress("Vector Store", f"Split {len(documents)} documents into {len(splits)} chunks")
            
            # Create vector store from documents
            vectorstore = Chroma.from_documents(
                documents=splits,
                embedding=self.embeddings,
                persist_directory=persist_directory
            )
            
            # Persist the vector store to disk
            vectorstore.persist()
            self._log_progress("Vector Store", f"Vector store created and saved to {persist_directory}")
            
            return vectorstore
        
        except Exception as e:
            self._log_error("Vector Store", f"Error creating vector store: {str(e)}")
            return None
    
    def _get_or_create_vector_store(self, pdf_path: str, store_type: str = "lesson") -> Tuple[Chroma, bool]:
        """Get existing vector store or create a new one if it doesn't exist."""
        # Create a document identifier from the PDF filename
        document_id = os.path.basename(pdf_path).replace('.pdf', '')
        
        # Calculate a hash of the PDF file to detect changes
        file_hash = hashlib.md5(open(pdf_path, 'rb').read()).hexdigest()[:10]
        
        # Define the persistent directory with document ID, hash, and store type
        persist_directory = f"chroma_db_{store_type}_{document_id}_{file_hash}"
        
        # Check if this exact vector store already exists
        if os.path.exists(persist_directory) and os.listdir(persist_directory):
            self._log_progress("Vector Store", f"Vector store for {document_id} ({store_type}) already exists at {persist_directory}")
            
            # Load the existing vector store
            vectorstore = Chroma(
                persist_directory=persist_directory,
                embedding_function=self.embeddings
            )
            self._log_progress("Vector Store", f"Loaded existing vector store with {vectorstore._collection.count()} documents")
            
            return vectorstore, False
        else:
            # Extract text from PDF
            documents = self._extract_text_from_pdf(pdf_path)
            
            # Create vector store from documents
            vectorstore = self._create_vector_store(documents, persist_directory)
            
            return vectorstore, True
    
    def _retrieve_context(self, vectorstore: Chroma, query: str, k: int = 5) -> str:
        """Retrieve relevant context from the vector store."""
        self._log_progress("Context Retrieval", f"Retrieving context for query: {query}")
        
        try:
            docs = vectorstore.similarity_search(query, k=k)
            context = "\n\n".join([doc.page_content for doc in docs])
            self._log_progress("Context Retrieval", f"Retrieved {len(docs)} documents for context")
            
            return context
        
        except Exception as e:
            self._log_error("Context Retrieval", f"Error retrieving context: {str(e)}")
            return ""

    @traceable
    def generate_lesson(self, 
                        subject: str, 
                        topic: str, 
                        grade_level: str, 
                        pdf_path: str = None,
                        subtopics: str = "",
                        special_requirements: str = "") -> Lesson:
        """Generate a complete lesson using the multi-agent workflow."""
        self._log_progress("Initialization", f"Starting lesson generation for {subject}: {topic}")
        
        # Step 1: Initialize lesson content vector store from PDF if provided
        lesson_vectorstore = None
        pdf_to_use = pdf_path if pdf_path else self.optional_pdf_path
        
        if pdf_to_use and os.path.exists(pdf_to_use):
            lesson_vectorstore, is_new = self._get_or_create_vector_store(pdf_to_use, "lesson")
            if not lesson_vectorstore:
                self._log_error("Initialization", f"Failed to create or load lesson vector store from {pdf_to_use}")
            else:
                self._log_progress("Initialization", f"Using PDF: {pdf_to_use}")
        else:
            self._log_progress("Initialization", f"No valid PDF found, proceeding without lesson-specific content")
        
        # Step 2: Retrieve relevant context from lesson content
        lesson_context = ""
        if lesson_vectorstore:
            search_query = f"{subject} {topic} {subtopics}".strip()
            lesson_context = self._retrieve_context(lesson_vectorstore, search_query, k=5)
            self._log_progress("Lesson Context", f"Retrieved lesson context: {len(lesson_context)} characters")
        
        # Step 3: Log database setup
        if self.curriculum_vectorstore:
            self._log_progress("Curriculum Analysis", "Using curriculum database for analysis")
        else:
            self._log_progress("Curriculum Analysis", "No curriculum database available, proceeding without curriculum RAG")
        
        # Step 3.5: Log content database setup
        if self.content_vectorstore:
            self._log_progress("Content Creation", "Using fixed content database for enhanced content creation")
        else:
            self._log_progress("Content Creation", "No fixed content database available, proceeding with optional PDF only")
        
        # Step 3.6: Log NCERT database setup
        if self.ncert_vectorstore:
            self._log_progress("Problem Solving Enhancement", "Using NCERT database for numerical problems and examples")
        else:
            self._log_progress("Problem Solving Enhancement", "No NCERT database available, proceeding with optional PDF only")
        
        # Step 4: Curriculum analysis with RAG
        self._log_progress("Curriculum Analysis", "Analyzing curriculum requirements with RAG retrieval")
        curriculum_input = {
            "subject": subject,
            "subtopics": subtopics,
            "topic": topic,
            "grade_level": grade_level,
            "special_requirements": special_requirements,
            "context": lesson_context
        }
        curriculum_output = self.curriculum_expert.process(curriculum_input)
        self._log_progress("Curriculum Analysis", f"Completed curriculum analysis with {len(curriculum_output.get('curriculum_analysis', {}))} analysis points")
        
        # Step 5: Content creation
        self._log_progress("Content Creation", "Generating initial lesson content")
        content_input = {
            **curriculum_output,
            "context": lesson_context
        }
        content_output = self.content_creator.process(content_input)
        self._log_progress("Content Creation", f"Created {len(content_output.get('components', []))} lesson components")
        
        # Step 6: Problem-solving enhancement
        self._log_progress("Problem Solving Enhancement", "Enhancing with problem-solving techniques")
        pedagogy_input = {
            **content_output,
            "curriculum_analysis": curriculum_output.get("curriculum_analysis", {})
        }
        pedagogy_output = self.Problem_Solving_Expert.process(pedagogy_input)
        self._log_progress("Problem Solving Enhancement", f"Enhanced to {len(pedagogy_output.get('enhanced_components', []))} components")

        ##COMMENTING TO REMOVE QUALITY AND REFINEMENT FOR NOW
        """
        # Step 7: Quality assurance
        self._log_progress("Quality Assurance", "Evaluating lesson quality")
        qa_input = {
            **pedagogy_output,
            "curriculum_analysis": curriculum_output.get("curriculum_analysis", {})
        }
        qa_output = self.quality_assurance.process(qa_input)
        quality_score = qa_output.get("quality_score", 0)
        self._log_progress("Quality Assurance", f"Quality evaluation complete - Score: {quality_score}/10")
        
        # Step 8: Refinement
        self._log_progress("Refinement", "Refining lesson based on feedback")
        refinement_input = {
            **qa_output,
            "curriculum_analysis": curriculum_output.get("curriculum_analysis", {})
        }
        refinement_output = self.refinement_agent.process(refinement_input)
        self._log_progress("Refinement", f"Refined {len(refinement_output.get('refined_components', []))} components")
        """
        
        # Step 9: Create final lesson
        self._log_progress("Finalization", "Creating final lesson")
        
        # Create lesson metadata
        curriculum_analysis = curriculum_output.get("curriculum_analysis", {})
        metadata = LessonMetadata(
            subject=subject,
            grade_level=grade_level,
            topic=topic,
            subtopics=subtopics.split(",") if subtopics else [],
            learning_objectives=curriculum_analysis.get("learning_objectives", []),
            standards_alignment=curriculum_analysis.get("standards_alignment", []),
            prerequisites=curriculum_analysis.get("prerequisites", []),
            target_skills=curriculum_analysis.get("essential_skills", [])
        )
        
        # Create lesson with refined components
        lesson = Lesson(
            title=f"{topic} - {subject} Lesson for {grade_level}",
            metadata=metadata,
            #components=refinement_output.get("refined_components", []),
            #quality_score=qa_output.get("quality_score"),
            #feedback=qa_output.get("feedback", []),
            components=pedagogy_output.get("enhanced_components", []),
            quality_score=6,
            feedback="NA"
        )
        
        self._log_progress("Completion", f"Lesson generation complete with quality score: {lesson.quality_score}/10")
        
        return lesson

    @traceable
    def generate_lesson_new(self, 
                    subject: str, 
                    topic: str, 
                    grade_level: str, 
                    pdf_path: str = None,
                    subtopics: str = "",
                    special_requirements: str = "") -> Lesson:
        """Generate a complete lesson using the multi-agent workflow."""
        self._log_progress("Initialization", f"Starting lesson generation for {subject}: {topic}")
        
        # Step 1: Initialize vector store from PDF if provided
        vectorstore = None
        if pdf_path and os.path.exists(pdf_path):
            vectorstore, is_new = self._get_or_create_vector_store(pdf_path)
            if not vectorstore:
                self._log_error("Initialization", "Failed to create or load vector store")
                return None
        
        # Step 2: Retrieve relevant context
        context = ""
        if vectorstore:
            search_query = f"{subject} {topic} {subtopics}".strip()
            context = self._retrieve_context(vectorstore, search_query, k=5)
        
        # Step 3: Curriculum analysis
        self._log_progress("Curriculum Analysis", "Analyzing curriculum requirements")
        curriculum_input = {
            "subject": subject,
            "sub_topic": subtopics,
            "topic": topic,
            "grade_level": grade_level,
            "special_requirements": special_requirements,
            "context": context
        }
        curriculum_output = self.curriculum_expert.process(curriculum_input)
        
        # Step 4: Content creation
        self._log_progress("Content Creation", "Generating initial lesson content")
        content_input = {
            **curriculum_output,
            "context": context
        }
        content_output = self.content_creator.process(content_input)
        
        # ❌ Step 5: Skipped Pedagogical Enhancement
        # Directly proceed to QA using content_output

        # Step 6: Quality assurance
        ### COMMENTING TO REMOVE QUALITY AND REFINEMENT FOR NOW
        """
        self._log_progress("Quality Assurance", "Evaluating lesson quality")
        qa_input = {
            **content_output,
            "curriculum_analysis": curriculum_output.get("curriculum_analysis", {})
        }
        qa_output = self.quality_assurance.process(qa_input)
        
        # Step 7: Refinement
        self._log_progress("Refinement", "Refining lesson based on feedback")
        refinement_input = {
            **qa_output,
            "curriculum_analysis": curriculum_output.get("curriculum_analysis", {})
        }
        refinement_output = self.refinement_agent.process(refinement_input)
        """
        # Step 8: Create final lesson
        self._log_progress("Finalization", "Creating final lesson")
        
        curriculum_analysis = curriculum_output.get("curriculum_analysis", {})
        metadata = LessonMetadata(
            subject=subject,
            grade_level=grade_level,
            topic=topic,
            subtopics=subtopics.split(",") if subtopics else [],
            learning_objectives=curriculum_analysis.get("learning_objectives", []),
            standards_alignment=curriculum_analysis.get("standards_alignment", []),
            prerequisites=curriculum_analysis.get("prerequisites", []),
            target_skills=curriculum_analysis.get("essential_skills", [])
        )
        
        lesson = Lesson(
            title=f"{topic} - {subject} Lesson for {grade_level}",
            metadata=metadata,
            #components=refinement_output.get("refined_components", []),
            #quality_score=qa_output.get("quality_score"),
            #feedback=qa_output.get("feedback", [])
            components=pedagogy_output.get("enhanced_components", []),
            quality_score=6,
            feedback="NA"
        )
        
        self._log_progress("Completion", f"Lesson generation complete with quality score: {lesson.quality_score}/10")
        
        return lesson

        
    


# In[12]:


@traceable
def generate_lesson(subject: str, 
                   topic: str, 
                   grade_level: str, 
                   pdf_path: str = None,
                   subtopics: str = "",
                   special_requirements: str = "",
                   output_format: str = "markdown") -> str:
    """
    Generate a high-quality lesson using the multi-agent workflow.
    
    Args:
        subject: The subject of the lesson (e.g., "Physics", "Mathematics")
        topic: The main topic of the lesson (e.g., "Electricity", "Fractions")
        grade_level: The grade level for the lesson (e.g., "10th Grade", "Elementary")
        pdf_path: Optional path to a PDF with lesson content materials
        subtopics: Optional comma-separated list of subtopics to cover
        special_requirements: Optional special requirements or focus areas
        output_format: Format for the output ("markdown" or "json")
        
    Returns:
        The generated lesson in the specified format
    """
    # Initialize the orchestrator (fixed database paths are hardcoded inside)
    orchestrator = OrchestratorAgent()
    
    # Generate the lesson
    lesson = orchestrator.generate_lesson(
        subject=subject,
        topic=topic,
        grade_level=grade_level,
        pdf_path=pdf_path,
        subtopics=subtopics,
        special_requirements=special_requirements
    )
    
    # Return the lesson in the requested format
    if output_format.lower() == "json":
        return lesson.to_json()
    else:
        return lesson.to_markdown()

