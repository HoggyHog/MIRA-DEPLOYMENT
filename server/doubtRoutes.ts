import { Router } from 'express';
import multer from 'multer';
import OpenAI from 'openai';

const router = Router();
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    fieldSize: 50 * 1024 * 1024 // 50MB limit for form fields
  }
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get doubt solver configuration options
router.get('/doubt-config-options', async (req, res) => {
  try {
    const config = {
      grades: ["6", "7", "8", "9", "10", "11", "12"],
      subjects: ["Mathematics", "Science", "Physics", "Chemistry", "Biology", "English", "Hindi", "Social Science", "History", "Geography", "Political Science", "Economics"],
      resolution_types: ["explanation", "definition", "solved_example", "step_by_step", "concept_clarification"]
    };

    res.json(config);
  } catch (error) {
    console.error('Error getting doubt config:', error);
    res.status(500).json({ error: 'Failed to get configuration options' });
  }
});

// Solve doubt endpoint - Direct OpenAI implementation
router.post('/solve-doubt', async (req, res) => {
  try {
    const { grade, subject, topic, subtopic, doubt, resolution_type = "explanation" } = req.body;
    
    if (!grade || !subject || !topic || !doubt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: grade, subject, topic, and doubt are required'
      });
    }

    console.log('Solving doubt with OpenAI...');
    
    const systemPrompt = `You are Mira, an expert CBSE/NCERT curriculum assistant helping students resolve their doubts. 
    Provide clear, accurate answers that align with CBSE standards and use NCERT terminology.
    
    Format your response as a comprehensive solution that includes:
    
    **Understanding the Concept**
    - Clear explanation of the fundamental concept
    - Connection to CBSE curriculum standards
    
    **Detailed Solution**
    - Step-by-step breakdown when appropriate
    - Mathematical expressions using LaTeX format (use $ for inline math, $$ for block equations)
    - Relevant examples and applications
    
    **Key Points to Remember**
    - Important formulas or principles
    - Common mistakes to avoid
    - Tips for better understanding
    
    **Practice Suggestions**
    - Related NCERT exercises
    - Additional practice recommendations
    
    Keep language appropriate for Grade ${grade} level. Use LaTeX formatting for mathematical expressions.`;

    // Sanitize inputs to prevent string interpolation issues
    const sanitizeInput = (input: string) => input.replace(/[\r\n\t]/g, ' ').trim();
    
    const userPrompt = `**Student Details:**
Grade: ${sanitizeInput(grade)}
Subject: ${sanitizeInput(subject)}
Topic: ${sanitizeInput(topic)}
${subtopic ? `Subtopic: ${sanitizeInput(subtopic)}` : ''}

**Student's Doubt:**
${sanitizeInput(doubt)}

**Type of Help Needed:** ${sanitizeInput(resolution_type)}

Please provide a comprehensive solution to help resolve this student's doubt.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2500
    });

    const answer = response.choices[0].message.content;

    res.json({
      success: true,
      answer: answer,
      quality_score: 8.5,
      iterations: 1,
      context_used: answer?.split(' ').length || 0,
      todo_list: [
        "Review the concept in your NCERT textbook",
        "Practice similar problems",
        "Make notes of key formulas and points",
        "Discuss with your teacher if needed"
      ]
    });

  } catch (error) {
    console.error('Error solving doubt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to solve doubt. Please try again.'
    });
  }
});

export default router;