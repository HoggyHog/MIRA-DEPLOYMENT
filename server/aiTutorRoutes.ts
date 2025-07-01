import { Request, Response } from 'express';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface ContentSource {
  source_type: 'pdf' | 'youtube' | 'text' | 'slides';
  content: string;
  title: string;
  metadata?: Record<string, any>;
}

interface TeachingRequest {
  content_sources: ContentSource[];
  student_grade: string;
  subject: string;
  learning_objective: string;
  teaching_style?: string;
  difficulty_level?: string;
}

interface ExamRequest {
  content_sources: ContentSource[];
  student_grade: string;
  subject: string;
  num_questions?: number;
  difficulty_level?: string;
  question_types?: string[];
}

interface ChatRequest {
  content_sources: ContentSource[];
  chat_history: Array<{ role: string; content: string }>;
  current_question: string;
  student_grade: string;
  subject: string;
}

// Teaching style prompts
const TEACHING_PROMPTS = {
  interactive: `
You are Mira, an expert AI tutor specializing in making complex topics simple and engaging for school students.

TEACHING STYLE: Interactive and Engaging
- Use simple, clear language appropriate for the student's grade level
- Break down complex concepts into digestible pieces
- Include real-world examples and analogies
- Encourage active participation with questions
- Make learning fun and relatable

STRUCTURE YOUR EXPLANATION:
1. Start with a friendly hook to grab attention
2. Explain the main concept in simple terms
3. Provide 2-3 real-world examples
4. Break down into step-by-step understanding
5. Include interactive elements (questions, comparisons)
6. Summarize key takeaways
7. Suggest practice activities

Remember: You're teaching a {grade} student studying {subject}. Keep it age-appropriate, encouraging, and engaging!
`,
  
  visual: `
You are Mira, an AI tutor who excels at creating visual learning experiences for students.

TEACHING STYLE: Visual and Descriptive
- Paint clear mental pictures with your words
- Describe visual relationships and patterns
- Use spatial and visual analogies
- Suggest diagrams, charts, and visual aids
- Connect abstract concepts to concrete visual examples

STRUCTURE YOUR EXPLANATION:
1. Create a vivid opening scenario
2. Describe the concept using visual metaphors
3. Guide through visual step-by-step process
4. Compare and contrast with familiar visuals
5. Suggest specific visual aids and diagrams
6. Provide visual memory techniques
7. Recommend visual practice exercises

Focus on helping the {grade} student "see" the {subject} concepts clearly!
`,

  'step-by-step': `
You are Mira, an AI tutor who specializes in methodical, step-by-step teaching.

TEACHING STYLE: Systematic and Sequential
- Break everything into clear, logical steps
- Number each step for easy following
- Check understanding before moving forward
- Provide clear transitions between steps
- Build complexity gradually

STRUCTURE YOUR EXPLANATION:
1. Overview: What we'll learn and why it matters
2. Prerequisites: What the student needs to know first
3. Step-by-step breakdown (numbered clearly)
4. Practice: Apply each step with examples
5. Common mistakes to avoid
6. Quick review of all steps
7. Next level challenges

Perfect for {grade} students learning {subject} systematically!
`,

  'example-based': `
You are Mira, an AI tutor who teaches through rich, relatable examples.

TEACHING STYLE: Example-Rich and Practical
- Start every concept with a familiar example
- Use multiple examples from different contexts
- Show both correct and incorrect examples
- Connect examples to student's daily life
- Build from simple to complex examples

STRUCTURE YOUR EXPLANATION:
1. Hook with a surprising or interesting example
2. Explain the concept through the example
3. Show 2-3 different examples of the same concept
4. Compare examples to highlight key features
5. Let student predict outcomes in new examples
6. Provide counter-examples (what it's NOT)
7. Challenge with real-world application examples

Make {subject} come alive for this {grade} student through powerful examples!
`
};

const EXAM_GENERATION_PROMPT = `
You are Mira, an AI tutor creating personalized exams for school students.

EXAM CREATION GUIDELINES:
- Design questions appropriate for {grade} level
- Focus on {subject} concepts from the provided content
- Difficulty level: {difficulty}
- Include variety in question types
- Provide clear, fair marking schemes
- Add helpful hints for difficult questions

QUESTION TYPES TO INCLUDE:
- Multiple Choice: Clear options, one obviously correct answer
- Short Answer: 2-3 sentence responses, specific marking points
- Long Answer: Structured responses, multiple marking criteria
- Application: Real-world problem solving

FOR EACH QUESTION PROVIDE:
1. Clear, unambiguous question text
2. Marking scheme with point allocation
3. Model answer/expected response
4. Common mistakes students make
5. Helpful hints if needed

Ensure questions test understanding, not just memorization!
`;

const CHAT_TUTOR_PROMPT = `
You are Mira, a friendly and patient AI tutor having a conversation with a {grade} student about {subject}.

CRITICAL: You MUST format ALL mathematical content using LaTeX notation.

CONVERSATION STYLE:
- Be warm, encouraging, and supportive
- Use age-appropriate language and examples
- Ask follow-up questions to check understanding
- Celebrate progress and learning moments
- Be patient with mistakes and confusion
- Provide gentle corrections and guidance

TUTORING APPROACH:
- Listen carefully to the student's question
- Identify the core concept they're struggling with
- Explain using simple, relatable terms
- Use examples from their everyday life
- Check understanding with gentle questions
- Offer encouragement and positive reinforcement

MATHEMATICAL FORMATTING:
- ALWAYS use LaTeX notation for ALL mathematical expressions
- For inline math within text, use \\( ... \\) delimiters
- For standalone equations, use \\[ ... \\] delimiters
- Examples: 
  * "The formula \\(E = mc^2\\) shows..." for inline
  * For standalone: \\[E = mc^2\\]
  * For calculations: \\[3 \\times 60 \\times 60 = 10800\\]
- Convert ALL numbers, equations, and mathematical operations to LaTeX
- Never write plain text math like "3×60×60" - always use \\(3 \\times 60 \\times 60\\)
- Format units properly: \\(40 \\text{ W}\\), \\(10800 \\text{ s}\\)

CONTENT CONTEXT:
Use the provided educational content to inform your responses, but adapt explanations to be conversational and student-friendly.

Remember: You're not just answering questions, you're building confidence and love for learning!
`;

function processContentSources(sources: ContentSource[]): string {
  const processedContent: string[] = [];
  
  for (const source of sources) {
    let contentSection = `\n--- ${source.source_type.toUpperCase()}: ${source.title} ---\n`;
    
    if (source.source_type === 'youtube') {
      contentSection += `Video Content: ${source.content}\n`;
    } else {
      contentSection += source.content;
    }
    
    processedContent.push(contentSection);
  }
  
  return processedContent.join('\n');
}

async function callOpenAI(messages: Array<{role: string, content: string}>, temperature: number = 0.7): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using GPT-4O-mini for cost efficiency while maintaining quality
      messages: messages as any,
      temperature,
      max_tokens: 2000
    });
    
    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`OpenAI API error: ${error}`);
  }
}

export async function teachContent(req: Request, res: Response) {
  try {
    const {
      content_sources,
      student_grade,
      subject,
      learning_objective,
      teaching_style = 'interactive',
      difficulty_level = 'medium'
    }: TeachingRequest = req.body;

    if (!content_sources || !student_grade || !subject || !learning_objective) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: content_sources, student_grade, subject, learning_objective"
      });
    }

    // Process content sources
    const combinedContent = processContentSources(content_sources);

    // Select appropriate teaching prompt
    const teachingPrompt = TEACHING_PROMPTS[teaching_style as keyof typeof TEACHING_PROMPTS] || 
                          TEACHING_PROMPTS.interactive;

    // Sanitize inputs to prevent string interpolation issues
    const sanitizeInput = (input: string) => input ? input.replace(/[\r\n\t]/g, ' ').trim() : '';
    
    // Format the prompt with student details
    const formattedPrompt = teachingPrompt
      .replace(/{grade}/g, sanitizeInput(student_grade))
      .replace(/{subject}/g, sanitizeInput(subject));

    // Create the teaching request
    const userMessage = `
CONTENT TO TEACH:
${sanitizeInput(combinedContent)}

LEARNING OBJECTIVE: ${sanitizeInput(learning_objective)}
STUDENT GRADE: ${sanitizeInput(student_grade)}
SUBJECT: ${sanitizeInput(subject)}
DIFFICULTY LEVEL: ${sanitizeInput(difficulty_level)}

Please provide a comprehensive teaching explanation following your specialized teaching style.
`;

    const messages = [
      { role: "system", content: formattedPrompt },
      { role: "user", content: userMessage }
    ];

    // Get AI response
    const explanation = await callOpenAI(messages, 0.7);

    // Extract key components using a second API call
    const analysisPrompt = `
Analyze this teaching explanation and extract the following components:

EXPLANATION: ${explanation}

Extract and return as JSON:
{
    "key_concepts": ["concept1", "concept2", "concept3"],
    "examples": ["example1", "example2"],
    "practice_questions": ["question1", "question2"],
    "visual_aids_suggestions": ["suggestion1", "suggestion2"]
}
`;

    const analysisMessages = [
      { role: "system", content: "You are an educational content analyzer. Return only valid JSON." },
      { role: "user", content: analysisPrompt }
    ];

    try {
      const analysisResponse = await callOpenAI(analysisMessages, 0.3);
      
      // Clean and parse JSON response
      let cleanedResponse = analysisResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7, -3);
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.slice(3, -3);
      }

      const analysisData = JSON.parse(cleanedResponse);

      return res.json({
        success: true,
        explanation,
        key_concepts: analysisData.key_concepts || [],
        examples: analysisData.examples || [],
        practice_questions: analysisData.practice_questions || [],
        visual_aids_suggestions: analysisData.visual_aids_suggestions || []
      });

    } catch (parseError) {
      // Fallback if JSON parsing fails
      return res.json({
        success: true,
        explanation,
        key_concepts: ["Main concept from the content"],
        examples: ["Real-world example"],
        practice_questions: ["Practice question about the topic"],
        visual_aids_suggestions: ["Diagram or chart suggestion"]
      });
    }

  } catch (error) {
    console.error('Teaching content error:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to generate teaching content: ${error}`
    });
  }
}

export async function generateExam(req: Request, res: Response) {
  try {
    const {
      content_sources,
      student_grade,
      subject,
      num_questions = 5,
      difficulty_level = 'medium',
      question_types = ['mcq', 'short_answer']
    }: ExamRequest = req.body;

    if (!content_sources || !student_grade || !subject) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: content_sources, student_grade, subject"
      });
    }

    // Process content sources
    const combinedContent = processContentSources(content_sources);

    // Format exam generation prompt
    const examPrompt = EXAM_GENERATION_PROMPT
      .replace(/{grade}/g, student_grade)
      .replace(/{subject}/g, subject)
      .replace(/{difficulty}/g, difficulty_level);

    const userMessage = `
CONTENT FOR EXAM:
${combinedContent}

EXAM REQUIREMENTS:
- Number of questions: ${num_questions}
- Question types: ${question_types.join(', ')}
- Difficulty level: ${difficulty_level}
- Student grade: ${student_grade}
- Subject: ${subject}

Generate exam questions with complete marking schemes and explanations.
Format as JSON with this structure:
{
    "questions": [
        {
            "id": 1,
            "type": "mcq",
            "question": "Question text",
            "options": ["A", "B", "C", "D"],
            "correct_answer": "A",
            "marks": 2,
            "explanation": "Why this is correct",
            "hints": ["Helpful hint"]
        }
    ],
    "total_marks": 20,
    "estimated_time": 30
}
`;

    const messages = [
      { role: "system", content: examPrompt },
      { role: "user", content: userMessage }
    ];

    const response = await callOpenAI(messages, 0.5);

    try {
      // Clean JSON response
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7, -3);
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.slice(3, -3);
      }

      const examData = JSON.parse(cleanedResponse);

      return res.json({
        success: true,
        questions: examData.questions || [],
        total_marks: examData.total_marks || num_questions * 2,
        estimated_time: examData.estimated_time || num_questions * 3
      });

    } catch (parseError) {
      // Fallback exam generation
      const fallbackQuestions = [];
      for (let i = 0; i < num_questions; i++) {
        fallbackQuestions.push({
          id: i + 1,
          type: "mcq",
          question: `Question ${i + 1} about the provided content`,
          options: ["Option A", "Option B", "Option C", "Option D"],
          correct_answer: "Option A",
          marks: 2,
          explanation: "Detailed explanation of the correct answer",
          hints: ["Consider the main concepts from the content"]
        });
      }

      return res.json({
        success: true,
        questions: fallbackQuestions,
        total_marks: num_questions * 2,
        estimated_time: num_questions * 3
      });
    }

  } catch (error) {
    console.error('Exam generation error:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to generate exam: ${error}`
    });
  }
}

export async function chatWithTutor(req: Request, res: Response) {
  try {
    const {
      content_sources,
      chat_history,
      current_question,
      student_grade,
      subject
    }: ChatRequest = req.body;

    if (!content_sources || !current_question || !student_grade || !subject) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: content_sources, current_question, student_grade, subject"
      });
    }

    // Process content sources for context
    const combinedContent = processContentSources(content_sources);

    // Format chat prompt
    const chatPrompt = CHAT_TUTOR_PROMPT
      .replace(/{grade}/g, student_grade)
      .replace(/{subject}/g, subject);

    // Build conversation history
    const conversationMessages = [{ role: "system", content: chatPrompt }];

    // Add content context
    const contextMessage = `
EDUCATIONAL CONTENT CONTEXT:
${combinedContent}

Use this content to inform your responses, but keep them conversational and appropriate for a ${student_grade} student studying ${subject}.
`;
    conversationMessages.push({ role: "system", content: contextMessage });

    // Add chat history (last 10 messages for context)
    if (chat_history && chat_history.length > 0) {
      const recentHistory = chat_history.slice(-10);
      conversationMessages.push(...recentHistory);
    }

    // Add current question
    conversationMessages.push({
      role: "user",
      content: current_question
    });

    // Get response
    const response = await callOpenAI(conversationMessages, 0.8);

    // Generate follow-up suggestions
    const suggestionPrompt = `
Based on this tutoring conversation about ${subject} for a ${student_grade} student:

STUDENT QUESTION: ${current_question}
TUTOR RESPONSE: ${response}

Generate 3 helpful follow-up suggestions or questions the student might want to ask next.
Return as JSON array: ["suggestion1", "suggestion2", "suggestion3"]
`;

    try {
      const suggestionMessages = [
        { role: "system", content: "Generate helpful follow-up suggestions. Return only JSON array." },
        { role: "user", content: suggestionPrompt }
      ];

      const suggestionsResponse = await callOpenAI(suggestionMessages, 0.6);

      // Parse suggestions
      let cleanedSuggestions = suggestionsResponse.trim();
      if (cleanedSuggestions.startsWith('```')) {
        cleanedSuggestions = cleanedSuggestions.slice(3, -3);
      }

      const suggestions = JSON.parse(cleanedSuggestions);

      return res.json({
        success: true,
        response,
        suggestions,
        follow_up_questions: suggestions
      });

    } catch (parseError) {
      return res.json({
        success: true,
        response,
        suggestions: [
          "Can you explain this with an example?",
          "What are the key points I should remember?",
          "How does this connect to what we learned before?"
        ],
        follow_up_questions: [
          "Can you explain this with an example?",
          "What are the key points I should remember?",
          "How does this connect to what we learned before?"
        ]
      });
    }

  } catch (error) {
    console.error('Chat tutor error:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to process chat: ${error}`
    });
  }
}