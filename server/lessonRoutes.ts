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
  try {
    // First try the new RAG-enhanced API
    // Commented out old Express /api/generate-lesson route
    // const response = await fetch('http://localhost:8002/generate-lesson', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     subject,
    //     topic,
    //     subtopics,
    //     grade_level,
    //     special_requirements
    //   })
    // });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        return {
          lessonContent: result.lesson_content,
          lessonData: null
        };
      } else {
        throw new Error(result.error || 'RAG API returned error');
      }
    } else {
      throw new Error(`RAG API responded with status: ${response.status}`);
    }
  } catch (ragError) {
    console.log('RAG API unavailable, falling back to original method:', ragError.message);
    
    // Fallback to original Python script method
    return new Promise((resolve, reject) => {
      // Properly escape all user inputs to prevent string literal issues
      const escapeForPython = (str: string) => JSON.stringify(str);
      
      const pythonScript = `
import sys
import os
sys.path.append('.')
from final_agentic_m4_RAG_logic import OrchestratorAgent
import json

try:
    # Initialize the comprehensive multi-agent orchestrator
    orchestrator = OrchestratorAgent()
    
    # Generate lesson using the enhanced RAG-enabled multi-agent system
    lesson = orchestrator.generate_lesson(
        subject=${escapeForPython(subject)},
        topic=${escapeForPython(topic)},
        grade_level=${escapeForPython(gradeLevel)},
        pdf_path=None,
        subtopics=${escapeForPython(subtopics)},
        special_requirements=${escapeForPython(specialRequirements)}
    )
    
    # Convert lesson to markdown format only
    lesson_content = lesson.to_markdown()
    
    # Print markdown with clear delimiters for extraction
    print("###MARKDOWN_START###")
    print(lesson_content)
    print("###MARKDOWN_END###")
except Exception as e:
    print("###ERROR_START###")
    print(f"Error: {str(e)}")
    print("###ERROR_END###")
`;

      const python = spawn('python3', ['-c', pythonScript], {
        env: { ...process.env, PYTHONPATH: '.' }
      });

      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script error:', errorOutput);
          reject(new Error(`Both RAG API and fallback failed. Python script failed with code ${code}: ${errorOutput}`));
          return;
        }

        try {
          const result = JSON.parse(output.trim());
          if (result.success) {
            resolve({
              lessonContent: result.lesson_content,
              lessonData: null
            });
          } else {
            reject(new Error(result.error));
          }
        } catch (parseError) {
          console.error('Failed to parse Python output:', output);
          reject(new Error('Failed to parse lesson generation result'));
        }
      });
    });
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
      rag_error: error.message,
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