import { Request, Response } from 'express';
import { spawn } from 'child_process';
import fetch from 'node-fetch';

interface LessonRequest {
  subject: string;
  topic: string;
  subtopics: string;
  grade_level: string;
  special_requirements: string;
}

// Enhanced function to call the RAG-integrated lesson generator
const callEnhancedLessonGenerator = async (
  subject: string,
  topic: string,
  subtopics: string,
  gradeLevel: string,
  specialRequirements: string
): Promise<{ lessonContent: string; lessonData: any }> => {
  console.log('Calling FastAPI lesson generator service');
  
  try {
    // Create form data for the FastAPI service
    const formData = new FormData();
    formData.append('subject', subject);
    formData.append('topic', topic);
    formData.append('subtopics', subtopics);
    formData.append('grade_level', gradeLevel);
    formData.append('special_requirements', specialRequirements);
    
    // Call the FastAPI service
    const response = await fetch('http://localhost:8001/api/generate-lesson', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FastAPI service error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json() as { success: boolean; lesson_content?: string; error?: string };
    
    if (result.success) {
      return {
        lessonContent: result.lesson_content || '',
        lessonData: null
      };
    } else {
      throw new Error(result.error || 'Unknown error from FastAPI service');
    }
  } catch (error) {
    console.error('FastAPI service call failed:', error);
    throw error;
  }
};

export const generateLesson = async (req: Request, res: Response) => {
  try {
    const { subject, topic, subtopics, grade_level = "10", special_requirements = "" } = req.body;

    if (!subject || !topic || !subtopics) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: subject, topic, and subtopics are required"
      });
    }

    console.log('Generating lesson with enhanced RAG integration:', { subject, topic, subtopics, grade_level });

    // Call the enhanced RAG-integrated lesson generator
    const { lessonContent, lessonData } = await callEnhancedLessonGenerator(
      subject, topic, subtopics, grade_level, special_requirements
    );

    const result = {
      success: true,
      lesson_content: lessonContent
    };

    res.json(result);

  } catch (error) {
    console.error('Enhanced lesson generation error:', error);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate lesson with enhanced RAG integration"
    });
  }
};

// Health check endpoint for RAG API status
export const checkRagHealth = async (req: Request, res: Response) => {
  try {
    const response = await fetch('http://localhost:8002/health');
    if (response.ok) {
      const health = await response.json();
      res.json({
        rag_api_available: true,
        rag_health: health,
        fallback_available: true
      });
    } else {
      res.json({
        rag_api_available: false,
        rag_error: `API responded with status: ${response.status}`,
        fallback_available: true
      });
    }
  } catch (error) {
    res.json({
      rag_api_available: false,
      rag_error: error instanceof Error ? error.message : 'Unknown error',
      fallback_available: true
    });
  }
};

export const getLessonConfigOptions = async (req: Request, res: Response) => {
  res.json({
    subjects: ["Mathematics", "Science", "English", "Social Studies", "Hindi", "Physics", "Chemistry", "Biology"],
    grade_levels: ["6", "7", "8", "9", "10", "11", "12"],
    difficulty_levels: ["easy", "medium", "hard", "mixed"]
  });
};