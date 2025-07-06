import { Request, Response } from 'express';
import { spawn } from 'child_process';

interface ExamConfig {
  grade: string;
  subject: string;
  sub_topic: string;
  difficulty: string;
  question_types: string[];
  duration: number;
  special_remarks: string;
  total_marks: number;
}

export const generateExamPaper = async (req: Request, res: Response) => {
  try {
    const config: ExamConfig = req.body;

    if (!config.grade || !config.subject || !config.sub_topic) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: grade, subject, and sub_topic are required"
      });
    }

    // Sanitize inputs to prevent string interpolation issues
    const sanitizeInput = (input: string) => input ? input.replace(/[\r\n\t]/g, ' ').trim() : '';

    const sanitizedConfig = {
      grade: sanitizeInput(config.grade),
      subject: sanitizeInput(config.subject),
      sub_topic: sanitizeInput(config.sub_topic),
      difficulty: sanitizeInput(config.difficulty),
      question_types: config.question_types.map(sanitizeInput),
      duration: config.duration,
      special_remarks: sanitizeInput(config.special_remarks),
      total_marks: config.total_marks
    };

    // Use QPA_2.py for comprehensive exam generation with LangSmith tracing
    const pythonProcess = spawn('./venv/bin/python', ['-c', `
import sys
import json
from QPA_2 import generate_cbse_exam_paper

# Read configuration from stdin
config_data = sys.stdin.read()
config = json.loads(config_data)

# Generate exam paper using QPA_2
result = generate_cbse_exam_paper(config)

# Output result as JSON
print(json.dumps(result))
`], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`);
        console.error('Error:', stderr);
        return res.status(500).json({
          success: false,
          error: 'Failed to generate exam paper'
        });
      }

      try {
        // Filter out non-JSON output and find the actual JSON result
        const lines = stdout.trim().split('\n');
        let jsonResult = '';
        
        // Look for the last line that looks like JSON (starts with { or [)
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].trim();
          if (line.startsWith('{') || line.startsWith('[')) {
            jsonResult = line;
            break;
          }
        }
        
        if (!jsonResult) {
          // If no JSON found, try to parse the entire output
          jsonResult = stdout.trim();
        }
        
        const result = JSON.parse(jsonResult);
        res.json(result);
      } catch (parseError) {
        console.error('Error parsing Python output:', parseError);
        console.error('Raw output:', stdout);
        console.error('Stderr:', stderr);
        res.status(500).json({
          success: false,
          error: 'Failed to parse exam generation result'
        });
      }
    });

    // Send the configuration as JSON to the Python process
    pythonProcess.stdin.write(JSON.stringify(sanitizedConfig));
    pythonProcess.stdin.end();

  } catch (error) {
    console.error('Error in exam generation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during exam generation'
    });
  }
};

export const getConfigOptions = async (req: Request, res: Response) => {
  res.json({
    grades: ['6', '7', '8', '9', '10', '11', '12'],
    subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'],
    difficulty_levels: ['easy', 'medium', 'hard', 'mixed'],
    question_types: ['mcq', 'short_answer', 'long_answer', 'numerical', 'diagram', 'mixed'],
    exam_durations: ['30', '60', '90', '120', '180']
  });
};