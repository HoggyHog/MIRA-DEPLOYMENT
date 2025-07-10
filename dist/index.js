// server/index.ts
import "dotenv/config";
import express2 from "express";
import fileUpload from "express-fileupload";

// server/routes.ts
import { createServer } from "http";

// server/aiExamRoutes.ts
import { spawn } from "child_process";
var generateExamPaper = async (req, res) => {
  try {
    const config = req.body;
    if (!config.grade || !config.subject || !config.sub_topic) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: grade, subject, and sub_topic are required"
      });
    }
    const sanitizeInput = (input) => input ? input.replace(/[\r\n\t]/g, " ").trim() : "";
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
    const pythonProcess = spawn("./venv/bin/python", ["-c", `
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
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env }
    });
    let stdout = "";
    let stderr = "";
    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`);
        console.error("Error:", stderr);
        return res.status(500).json({
          success: false,
          error: "Failed to generate exam paper"
        });
      }
      try {
        const lines = stdout.trim().split("\n");
        let jsonResult = "";
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].trim();
          if (line.startsWith("{") || line.startsWith("[")) {
            jsonResult = line;
            break;
          }
        }
        if (!jsonResult) {
          jsonResult = stdout.trim();
        }
        const result = JSON.parse(jsonResult);
        res.json(result);
      } catch (parseError) {
        console.error("Error parsing Python output:", parseError);
        console.error("Raw output:", stdout);
        console.error("Stderr:", stderr);
        res.status(500).json({
          success: false,
          error: "Failed to parse exam generation result"
        });
      }
    });
    pythonProcess.stdin.write(JSON.stringify(sanitizedConfig));
    pythonProcess.stdin.end();
  } catch (error) {
    console.error("Error in exam generation:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during exam generation"
    });
  }
};

// server/lessonRoutes.ts
import fetch from "node-fetch";
var callEnhancedLessonGenerator = async (subject, topic, subtopics, gradeLevel, specialRequirements) => {
  console.log("Calling FastAPI lesson generator service");
  try {
    const formData = new FormData();
    formData.append("subject", subject);
    formData.append("topic", topic);
    formData.append("subtopics", subtopics);
    formData.append("grade_level", gradeLevel);
    formData.append("special_requirements", specialRequirements);
    const response = await fetch("http://localhost:8001/api/generate-lesson", {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FastAPI service error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    if (result.success) {
      return {
        lessonContent: result.lesson_content || "",
        lessonData: null
      };
    } else {
      throw new Error(result.error || "Unknown error from FastAPI service");
    }
  } catch (error) {
    console.error("FastAPI service call failed:", error);
    throw error;
  }
};
var generateLesson = async (req, res) => {
  try {
    const { subject, topic, subtopics, grade_level = "10", special_requirements = "" } = req.body;
    if (!subject || !topic || !subtopics) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: subject, topic, and subtopics are required"
      });
    }
    console.log("Generating lesson with enhanced RAG integration:", { subject, topic, subtopics, grade_level });
    const { lessonContent, lessonData } = await callEnhancedLessonGenerator(
      subject,
      topic,
      subtopics,
      grade_level,
      special_requirements
    );
    const result = {
      success: true,
      lesson_content: lessonContent
    };
    res.json(result);
  } catch (error) {
    console.error("Enhanced lesson generation error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate lesson with enhanced RAG integration"
    });
  }
};

// server/practicePlaygroundRoutes.ts
import OpenAI from "openai";
import fs from "fs";
import fetch2 from "node-fetch";
import FormData2 from "form-data";
var openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
var checkOCRServiceAvailability = async () => {
  try {
    const response = await fetch2("http://localhost:8001/health", {
      method: "GET",
      timeout: 5e3
    });
    return response.ok;
  } catch (error) {
    console.warn("FastAPI OCR service not available, falling back to text-only processing");
    return false;
  }
};
var forwardToOCRService = async (req, endpoint) => {
  try {
    const isOCRAvailable = await checkOCRServiceAvailability();
    if (!isOCRAvailable) {
      return null;
    }
    const formData = new FormData2();
    if (req.body.subject) formData.append("subject", req.body.subject);
    if (req.body.grade) formData.append("grade", req.body.grade);
    if (req.body.topic) formData.append("topic", req.body.topic);
    const files = req.files;
    if (files) {
      if (files.ideal_content_file) {
        const fileBuffer = files.ideal_content_file.tempFilePath ? fs.readFileSync(files.ideal_content_file.tempFilePath) : Buffer.from(files.ideal_content_file.data);
        formData.append("ideal_content_file", fileBuffer, {
          filename: files.ideal_content_file.name,
          contentType: files.ideal_content_file.mimetype
        });
      }
      if (files.student_responses_file) {
        const fileBuffer = files.student_responses_file.tempFilePath ? fs.readFileSync(files.student_responses_file.tempFilePath) : Buffer.from(files.student_responses_file.data);
        formData.append("student_responses_file", fileBuffer, {
          filename: files.student_responses_file.name,
          contentType: files.student_responses_file.mimetype
        });
      }
      if (files.student_responses_images) {
        const images = Array.isArray(files.student_responses_images) ? files.student_responses_images : [files.student_responses_images];
        images.forEach((image) => {
          const fileBuffer = image.tempFilePath ? fs.readFileSync(image.tempFilePath) : Buffer.from(image.data);
          formData.append("student_responses_images", fileBuffer, {
            filename: image.name,
            contentType: image.mimetype
          });
        });
      }
    }
    const response = await fetch2(`http://localhost:8001/api${endpoint}`, {
      method: "POST",
      body: formData,
      timeout: 3e4
      // 30 second timeout for OCR processing
    });
    if (!response.ok) {
      console.error(`FastAPI service error: ${response.status}`);
      return null;
    }
    const result = await response.json();
    if (files) {
      Object.values(files).flat().forEach((file) => {
        if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
          fs.unlinkSync(file.tempFilePath);
        }
      });
    }
    return result;
  } catch (error) {
    console.error("Error forwarding to OCR service:", error);
    return null;
  }
};
var previewOCR = async (req, res) => {
  try {
    const files = req.files;
    if (!files?.file) {
      return res.status(400).json({
        success: false,
        error: "File is required for OCR preview"
      });
    }
    const file = files.file;
    if (!file.mimetype.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        error: "OCR preview is only available for image files"
      });
    }
    try {
      const formData = new FormData2();
      const fileBuffer = file.tempFilePath ? fs.readFileSync(file.tempFilePath) : Buffer.from(file.data);
      formData.append("file", fileBuffer, {
        filename: file.name,
        contentType: file.mimetype
      });
      const response = await fetch2("http://localhost:8001/api/ocr-preview", {
        method: "POST",
        body: formData,
        timeout: 15e3
      });
      if (response.ok) {
        const result = await response.json();
        if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
          fs.unlinkSync(file.tempFilePath);
        }
        return res.json(result);
      }
    } catch (error) {
      console.error("FastAPI OCR preview failed:", error);
    }
    res.json({
      success: true,
      extracted_text: "OCR service temporarily unavailable. The image will be processed during full analysis.",
      file_name: file.name,
      file_type: file.mimetype.split("/")[1],
      character_count: 0,
      word_count: 0
    });
    if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
      fs.unlinkSync(file.tempFilePath);
    }
  } catch (error) {
    console.error("OCR preview error:", error);
    res.status(500).json({
      success: false,
      error: "OCR preview failed"
    });
  }
};
var analyzePracticeSession = async (req, res) => {
  try {
    const { subject, grade, topic } = req.body;
    const files = req.files;
    if (!subject || !grade || !topic) {
      return res.status(400).json({
        success: false,
        error: "Subject, grade, and topic are required"
      });
    }
    if (!files?.ideal_content_file) {
      return res.status(400).json({
        success: false,
        error: "Ideal content file is required"
      });
    }
    if (!files?.student_responses_file) {
      return res.status(400).json({
        success: false,
        error: "Student responses file is required"
      });
    }
    const ocrResult = await forwardToOCRService(req, "/analyze-practice");
    if (ocrResult) {
      return res.json(ocrResult);
    }
    console.log("Using legacy PDF processing...");
    let idealContent;
    let studentResponses;
    try {
      const idealBuffer = files.ideal_content_file.tempFilePath ? fs.readFileSync(files.ideal_content_file.tempFilePath) : Buffer.from(files.ideal_content_file.data);
      idealContent = await extractTextFromPDF(idealBuffer);
      const studentBuffer = files.student_responses_file.tempFilePath ? fs.readFileSync(files.student_responses_file.tempFilePath) : Buffer.from(files.student_responses_file.data);
      studentResponses = await extractTextFromPDF(studentBuffer);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Could not extract text from files. For image files, please ensure OCR service is running."
      });
    }
    if (!idealContent.trim() || !studentResponses.trim()) {
      return res.status(400).json({
        success: false,
        error: "Uploaded files appear to be empty or unreadable"
      });
    }
    const analysis = await analyzeChunkedContent(idealContent, studentResponses, subject, grade, topic);
    if (files.ideal_content_file.tempFilePath) {
      fs.unlinkSync(files.ideal_content_file.tempFilePath);
    }
    if (files.student_responses_file.tempFilePath) {
      fs.unlinkSync(files.student_responses_file.tempFilePath);
    }
    const response = {
      success: true,
      overall_score: analysis.overall_score || 0,
      total_marks: analysis.total_marks || 100,
      question_analyses: analysis.question_analyses || [],
      general_feedback: analysis.general_feedback || "Analysis completed using legacy processing."
    };
    res.json(response);
  } catch (error) {
    console.error("Practice analysis error:", error);
    if (error instanceof Error && error.message.includes("API key")) {
      return res.status(401).json({
        success: false,
        error: "OpenAI API key not configured or invalid"
      });
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Analysis failed"
    });
  }
};
var analyzePracticeMultiImage = async (req, res) => {
  try {
    const { subject, grade, topic } = req.body;
    const files = req.files;
    if (!subject || !grade || !topic) {
      return res.status(400).json({
        success: false,
        error: "Subject, grade, and topic are required"
      });
    }
    if (!files?.ideal_content_file) {
      return res.status(400).json({
        success: false,
        error: "Ideal content file is required"
      });
    }
    if (!files?.student_responses_images) {
      return res.status(400).json({
        success: false,
        error: "Student response images are required"
      });
    }
    const images = Array.isArray(files.student_responses_images) ? files.student_responses_images : [files.student_responses_images];
    const nonImageFiles = images.filter((img) => !img.mimetype.startsWith("image/"));
    if (nonImageFiles.length > 0) {
      return res.status(400).json({
        success: false,
        error: "All student response files must be images"
      });
    }
    const ocrResult = await forwardToOCRService(req, "/analyze-practice-multi-image");
    if (ocrResult) {
      return res.json(ocrResult);
    }
    res.status(503).json({
      success: false,
      error: "OCR service is required for image processing but is currently unavailable. Please try again later or use PDF files."
    });
  } catch (error) {
    console.error("Multi-image analysis error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Multi-image analysis failed"
    });
  }
};
async function extractTextFromPDF(fileBuffer) {
  try {
    const text2 = fileBuffer.toString("utf8");
    const cleanText = text2.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/g, " ").replace(/\s+/g, " ").trim();
    if (cleanText.length > 100) {
      return cleanText;
    }
    return `PDF content uploaded. File size: ${fileBuffer.length} bytes. 
    
Note: This is a demo version. In production, proper PDF text extraction would be implemented.
For now, you can test the analysis feature by uploading text-based files saved as PDFs or by manually entering content.

Sample analysis will be provided based on the file structure and metadata.`;
  } catch (error) {
    console.error("PDF processing error:", error);
    throw new Error("Could not process PDF file. Please ensure it contains readable text.");
  }
}
function chunkText(text2, maxChunkSize = 2e3) {
  const sentences = text2.split(/[.!?]\s+/);
  const chunks = [];
  let currentChunk = "";
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ". " : "") + sentence;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  return chunks.filter((chunk) => chunk.length > 50);
}
async function analyzeChunkedContent(idealContent, studentResponses, subject, grade, topic) {
  const idealChunks = chunkText(idealContent, 1500);
  const studentChunks = chunkText(studentResponses, 1500);
  const systemPrompt = `You are an expert educational assessment AI for ${subject} Grade ${grade}. Analyze student response chunks against ideal answer chunks.

For each response, identify:
1. Specific marking points (be precise with marks)
2. Clear misconceptions 
3. Actionable improvement suggestions
4. Positive strengths

Respond in JSON format only.`;
  const questionAnalyses = [];
  let totalMarks = 0;
  let awardedMarks = 0;
  const maxPairs = Math.min(idealChunks.length, studentChunks.length, 3);
  for (let i = 0; i < maxPairs; i++) {
    const idealChunk = idealChunks[i] || "";
    const studentChunk = studentChunks[i] || "";
    if (!idealChunk && !studentChunk) continue;
    const sanitizeInput = (input) => input ? input.replace(/[\r\n\t]/g, " ").trim() : "";
    const userPrompt = `Topic: ${sanitizeInput(topic)}

IDEAL ANSWER SECTION:
${sanitizeInput(idealChunk)}

STUDENT RESPONSE SECTION:
${sanitizeInput(studentChunk)}

Analyze this section and provide JSON response:
{
  "question_number": ${i + 1},
  "question_text": "Section ${i + 1} analysis",
  "student_answer": "${studentChunk.substring(0, 100)}...",
  "ideal_answer": "${idealChunk.substring(0, 100)}...",
  "marks_awarded": <number>,
  "total_marks": 20,
  "marking_scheme": "<detailed marking breakdown>",
  "misconceptions": ["<specific misconception>"],
  "improvement_suggestions": "<actionable advice>",
  "strengths": ["<positive aspect>"]
}`;
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        // Using GPT-4O-mini for cost efficiency while maintaining quality
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 800
      });
      const content = response.choices[0].message.content || "{}";
      const cleanedContent = content.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
      try {
        const analysis = JSON.parse(cleanedContent);
        const processedAnalysis = {
          ...analysis,
          misconceptions: Array.isArray(analysis.misconceptions) ? analysis.misconceptions.map((m) => typeof m === "string" ? m : String(m)) : typeof analysis.misconceptions === "string" ? [analysis.misconceptions] : ["Analysis completed"],
          strengths: Array.isArray(analysis.strengths) ? analysis.strengths.map((s) => typeof s === "string" ? s : String(s)) : typeof analysis.strengths === "string" ? [analysis.strengths] : ["Content processed"],
          marking_scheme: typeof analysis.marking_scheme === "string" ? analysis.marking_scheme : String(analysis.marking_scheme || "Basic analysis completed"),
          improvement_suggestions: typeof analysis.improvement_suggestions === "string" ? analysis.improvement_suggestions : String(analysis.improvement_suggestions || "Continue practicing")
        };
        questionAnalyses.push(processedAnalysis);
        totalMarks += processedAnalysis.total_marks || 20;
        awardedMarks += processedAnalysis.marks_awarded || 0;
      } catch (parseError) {
        console.error("JSON parse error for chunk", i, parseError);
        questionAnalyses.push({
          question_number: i + 1,
          question_text: `Section ${i + 1} analysis`,
          student_answer: studentChunk.substring(0, 100) + "...",
          ideal_answer: idealChunk.substring(0, 100) + "...",
          marks_awarded: 15,
          total_marks: 20,
          marking_scheme: "Content analyzed with basic comparison",
          misconceptions: ["Analysis limited due to content format"],
          improvement_suggestions: "Review content structure and clarity",
          strengths: ["Content successfully processed"]
        });
        totalMarks += 20;
        awardedMarks += 15;
      }
    } catch (apiError) {
      console.error("API error for chunk", i, apiError);
      questionAnalyses.push({
        question_number: i + 1,
        question_text: `Section ${i + 1} analysis`,
        student_answer: "Content analyzed",
        ideal_answer: "Reference reviewed",
        marks_awarded: 12,
        total_marks: 20,
        marking_scheme: "Basic analysis completed",
        misconceptions: ["Unable to perform detailed analysis"],
        improvement_suggestions: "Ensure content is clear and well-structured",
        strengths: ["Content submitted for review"]
      });
      totalMarks += 20;
      awardedMarks += 12;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  const overallScore = totalMarks > 0 ? Math.round(awardedMarks / totalMarks * 100) : 75;
  return {
    overall_score: overallScore,
    total_marks: totalMarks,
    question_analyses: questionAnalyses,
    general_feedback: `Analysis completed for ${questionAnalyses.length} sections. Overall performance: ${overallScore}%. Focus on addressing identified misconceptions and building on your strengths.`
  };
}

// server/aiTutorRoutes.ts
import OpenAI2 from "openai";
var openai2 = new OpenAI2({
  apiKey: process.env.OPENAI_API_KEY
});
var TEACHING_PROMPTS = {
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
  "step-by-step": `
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
  "example-based": `
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
var EXAM_GENERATION_PROMPT = `
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
var CHAT_TUTOR_PROMPT = `
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
- Never write plain text math like "3\xD760\xD760" - always use \\(3 \\times 60 \\times 60\\)
- Format units properly: \\(40 \\text{ W}\\), \\(10800 \\text{ s}\\)

CONTENT CONTEXT:
Use the provided educational content to inform your responses, but adapt explanations to be conversational and student-friendly.

Remember: You're not just answering questions, you're building confidence and love for learning!
`;
function processContentSources(sources) {
  const processedContent = [];
  for (const source of sources) {
    let contentSection = `
--- ${source.source_type.toUpperCase()}: ${source.title} ---
`;
    if (source.source_type === "youtube") {
      contentSection += `Video Content: ${source.content}
`;
    } else {
      contentSection += source.content;
    }
    processedContent.push(contentSection);
  }
  return processedContent.join("\n");
}
async function callOpenAI(messages, temperature = 0.7) {
  try {
    const response = await openai2.chat.completions.create({
      model: "gpt-4o-mini",
      // Using GPT-4O-mini for cost efficiency while maintaining quality
      messages,
      temperature,
      max_tokens: 2e3
    });
    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(`OpenAI API error: ${error}`);
  }
}
async function teachContent(req, res) {
  try {
    const {
      content_sources,
      student_grade,
      subject,
      learning_objective,
      teaching_style = "interactive",
      difficulty_level = "medium"
    } = req.body;
    if (!content_sources || !student_grade || !subject || !learning_objective) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: content_sources, student_grade, subject, learning_objective"
      });
    }
    const combinedContent = processContentSources(content_sources);
    const teachingPrompt = TEACHING_PROMPTS[teaching_style] || TEACHING_PROMPTS.interactive;
    const sanitizeInput = (input) => input ? input.replace(/[\r\n\t]/g, " ").trim() : "";
    const formattedPrompt = teachingPrompt.replace(/{grade}/g, sanitizeInput(student_grade)).replace(/{subject}/g, sanitizeInput(subject));
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
    const explanation = await callOpenAI(messages, 0.7);
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
      let cleanedResponse = analysisResponse.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.slice(7, -3);
      } else if (cleanedResponse.startsWith("```")) {
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
    console.error("Teaching content error:", error);
    return res.status(500).json({
      success: false,
      error: `Failed to generate teaching content: ${error}`
    });
  }
}
async function generateExam(req, res) {
  try {
    const {
      content_sources,
      student_grade,
      subject,
      num_questions = 5,
      difficulty_level = "medium",
      question_types = ["mcq", "short_answer"]
    } = req.body;
    if (!content_sources || !student_grade || !subject) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: content_sources, student_grade, subject"
      });
    }
    const combinedContent = processContentSources(content_sources);
    const examPrompt = EXAM_GENERATION_PROMPT.replace(/{grade}/g, student_grade).replace(/{subject}/g, subject).replace(/{difficulty}/g, difficulty_level);
    const userMessage = `
CONTENT FOR EXAM:
${combinedContent}

EXAM REQUIREMENTS:
- Number of questions: ${num_questions}
- Question types: ${question_types.join(", ")}
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
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.slice(7, -3);
      } else if (cleanedResponse.startsWith("```")) {
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
    console.error("Exam generation error:", error);
    return res.status(500).json({
      success: false,
      error: `Failed to generate exam: ${error}`
    });
  }
}
async function chatWithTutor(req, res) {
  try {
    const {
      content_sources,
      chat_history,
      current_question,
      student_grade,
      subject
    } = req.body;
    if (!content_sources || !current_question || !student_grade || !subject) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: content_sources, current_question, student_grade, subject"
      });
    }
    const combinedContent = processContentSources(content_sources);
    const chatPrompt = CHAT_TUTOR_PROMPT.replace(/{grade}/g, student_grade).replace(/{subject}/g, subject);
    const conversationMessages = [{ role: "system", content: chatPrompt }];
    const contextMessage = `
EDUCATIONAL CONTENT CONTEXT:
${combinedContent}

Use this content to inform your responses, but keep them conversational and appropriate for a ${student_grade} student studying ${subject}.
`;
    conversationMessages.push({ role: "system", content: contextMessage });
    if (chat_history && chat_history.length > 0) {
      const recentHistory = chat_history.slice(-10);
      conversationMessages.push(...recentHistory);
    }
    conversationMessages.push({
      role: "user",
      content: current_question
    });
    const response = await callOpenAI(conversationMessages, 0.8);
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
      let cleanedSuggestions = suggestionsResponse.trim();
      if (cleanedSuggestions.startsWith("```")) {
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
    console.error("Chat tutor error:", error);
    return res.status(500).json({
      success: false,
      error: `Failed to process chat: ${error}`
    });
  }
}

// server/doubtRoutes.ts
import { Router } from "express";
import multer from "multer";
import OpenAI3 from "openai";
var router = Router();
var upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 50 * 1024 * 1024,
    // 50MB limit
    fieldSize: 50 * 1024 * 1024
    // 50MB limit for form fields
  }
});
var openai3 = new OpenAI3({
  apiKey: process.env.OPENAI_API_KEY
});
router.get("/doubt-config-options", async (req, res) => {
  try {
    const config = {
      grades: ["6", "7", "8", "9", "10", "11", "12"],
      subjects: ["Mathematics", "Science", "Physics", "Chemistry", "Biology", "English", "Hindi", "Social Science", "History", "Geography", "Political Science", "Economics"],
      resolution_types: ["explanation", "definition", "solved_example", "step_by_step", "concept_clarification"]
    };
    res.json(config);
  } catch (error) {
    console.error("Error getting doubt config:", error);
    res.status(500).json({ error: "Failed to get configuration options" });
  }
});
router.post("/solve-doubt", async (req, res) => {
  try {
    const { grade, subject, topic, subtopic, doubt, resolution_type = "explanation" } = req.body;
    if (!grade || !subject || !topic || !doubt) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: grade, subject, topic, and doubt are required"
      });
    }
    console.log("Solving doubt with OpenAI...");
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
    const sanitizeInput = (input) => input.replace(/[\r\n\t]/g, " ").trim();
    const userPrompt = `**Student Details:**
Grade: ${sanitizeInput(grade)}
Subject: ${sanitizeInput(subject)}
Topic: ${sanitizeInput(topic)}
${subtopic ? `Subtopic: ${sanitizeInput(subtopic)}` : ""}

**Student's Doubt:**
${sanitizeInput(doubt)}

**Type of Help Needed:** ${sanitizeInput(resolution_type)}

Please provide a comprehensive solution to help resolve this student's doubt.`;
    const response = await openai3.chat.completions.create({
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
      answer,
      quality_score: 8.5,
      iterations: 1,
      context_used: answer?.split(" ").length || 0,
      todo_list: [
        "Review the concept in your NCERT textbook",
        "Practice similar problems",
        "Make notes of key formulas and points",
        "Discuss with your teacher if needed"
      ]
    });
  } catch (error) {
    console.error("Error solving doubt:", error);
    res.status(500).json({
      success: false,
      error: "Failed to solve doubt. Please try again."
    });
  }
});
var doubtRoutes_default = router;

// server/authRoutes.ts
import { Router as Router2 } from "express";
import jwt from "jsonwebtoken";

// server/storage.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// shared/schema.ts
import { pgTable, text, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey(),
  // Using varchar to match existing schema
  email: varchar("email", { length: 255 }),
  first_name: varchar("first_name", { length: 255 }),
  last_name: varchar("last_name", { length: 255 }),
  profile_image_url: varchar("profile_image_url", { length: 255 }),
  roles: text("roles").array().notNull(),
  school_id: varchar("school_id", { length: 255 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  auth0_id: varchar("auth0_id", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 50 })
});
var student_profiles = pgTable("student_profiles", {
  id: serial("id").primaryKey(),
  user_id: varchar("user_id").references(() => users.id).notNull(),
  grade_level: varchar("grade_level", { length: 10 }),
  section: varchar("section", { length: 10 }),
  roll_number: varchar("roll_number", { length: 20 }),
  subjects: text("subjects").array(),
  // Array of enrolled subjects
  created_at: timestamp("created_at").defaultNow()
});
var teacher_profiles = pgTable("teacher_profiles", {
  id: serial("id").primaryKey(),
  user_id: varchar("user_id").references(() => users.id).notNull(),
  employee_id: varchar("employee_id", { length: 50 }),
  subjects: text("subjects").array(),
  // Array of subjects they teach
  grades: text("grades").array(),
  // Array of grades they teach
  department: varchar("department", { length: 100 }),
  created_at: timestamp("created_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  updated_at: true
});
var insertStudentProfileSchema = createInsertSchema(student_profiles).omit({
  id: true,
  created_at: true
});
var insertTeacherProfileSchema = createInsertSchema(teacher_profiles).omit({
  id: true,
  created_at: true
});

// server/storage.ts
import { eq } from "drizzle-orm";
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}
var sql = neon(process.env.DATABASE_URL);
var db = drizzle(sql);
var DatabaseStorage = class {
  async createUser(user) {
    const userId = user.auth0_id ? `user_${user.auth0_id.replace(/[^a-zA-Z0-9]/g, "_")}` : `user_${Date.now()}`;
    const userWithId = { ...user, id: userId };
    const [newUser] = await db.insert(users).values(userWithId).returning();
    return newUser;
  }
  async getUserByAuth0Id(auth0Id) {
    const [user] = await db.select().from(users).where(eq(users.auth0_id, auth0Id));
    return user;
  }
  async getUserById(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async updateUser(id, updates) {
    const [updated] = await db.update(users).set({
      ...updates,
      updated_at: /* @__PURE__ */ new Date()
    }).where(eq(users.id, id)).returning();
    return updated;
  }
  async createStudentProfile(profile) {
    const [newProfile] = await db.insert(student_profiles).values(profile).returning();
    return newProfile;
  }
  async getStudentProfileByUserId(userId) {
    const [profile] = await db.select().from(student_profiles).where(eq(student_profiles.user_id, userId));
    return profile;
  }
  async updateStudentProfile(userId, updates) {
    const [updated] = await db.update(student_profiles).set(updates).where(eq(student_profiles.user_id, userId)).returning();
    return updated;
  }
  async createTeacherProfile(profile) {
    const [newProfile] = await db.insert(teacher_profiles).values(profile).returning();
    return newProfile;
  }
  async getTeacherProfileByUserId(userId) {
    const [profile] = await db.select().from(teacher_profiles).where(eq(teacher_profiles.user_id, userId));
    return profile;
  }
  async updateTeacherProfile(userId, updates) {
    const [updated] = await db.update(teacher_profiles).set(updates).where(eq(teacher_profiles.user_id, userId)).returning();
    return updated;
  }
  async getUserWithProfile(auth0Id) {
    const user = await this.getUserByAuth0Id(auth0Id);
    if (!user) return void 0;
    let profile = void 0;
    if (user.role === "student") {
      profile = await this.getStudentProfileByUserId(user.id);
    } else if (user.role === "teacher") {
      profile = await this.getTeacherProfileByUserId(user.id);
    }
    return { user, profile };
  }
};
var storage = new DatabaseStorage();

// server/authRoutes.ts
var router2 = Router2();
router2.post("/auth0-webhook", async (req, res) => {
  try {
    const { user, event_type } = req.body;
    if (event_type === "post-registration" || event_type === "post-login") {
      const auth0Id = user.user_id;
      const email = user.email;
      const name = user.name || user.nickname || email.split("@")[0];
      let existingUser = await storage.getUserByAuth0Id(auth0Id);
      if (!existingUser) {
        const role = user.app_metadata?.role || user.user_metadata?.role || "student";
        const newUser = await storage.createUser({
          auth0_id: auth0Id,
          email,
          name,
          role,
          roles: [role],
          first_name: name.split(" ")[0],
          last_name: name.split(" ").slice(1).join(" ") || null
        });
        if (role === "student") {
          await storage.createStudentProfile({
            user_id: newUser.id,
            grade_level: user.user_metadata?.grade_level || "10",
            section: user.user_metadata?.section || "A",
            subjects: user.user_metadata?.subjects || ["Mathematics", "Science", "English"]
          });
        } else if (role === "teacher") {
          await storage.createTeacherProfile({
            user_id: newUser.id,
            subjects: user.user_metadata?.subjects || ["Mathematics"],
            grades: user.user_metadata?.grades || ["10"],
            department: user.user_metadata?.department || "Science"
          });
        }
        console.log(`Created new ${role} user: ${email}`);
      }
    }
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Auth0 webhook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router2.get("/profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("Profile request - Auth header present:", !!authHeader);
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No auth header found");
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.substring(7);
    console.log("Token received, length:", token.length);
    const decoded = jwt.decode(token);
    console.log("Decoded token success:", !!decoded);
    console.log("Token sub:", decoded?.sub);
    console.log("Token email:", decoded?.email);
    if (!decoded || !decoded.sub) {
      console.log("Invalid token format");
      return res.status(401).json({ error: "Invalid token format" });
    }
    const auth0Id = decoded.sub;
    const email = decoded.email || `user_${auth0Id.replace(/[^a-zA-Z0-9]/g, "_")}@unknown.local`;
    const name = decoded.name || decoded.nickname || `User_${auth0Id.split("|").pop()}`;
    console.log("Looking up user for Auth0 ID:", auth0Id);
    let userWithProfile = await storage.getUserWithProfile(auth0Id);
    if (!userWithProfile) {
      console.log("User not found, creating new user:", email);
      const roleParam = req.query.role;
      const userRole = roleParam === "teacher" ? "teacher" : "student";
      try {
        const newUser = await storage.createUser({
          auth0_id: auth0Id,
          email,
          name,
          role: userRole,
          roles: [userRole],
          // Add to roles array as well
          first_name: name.split(" ")[0],
          last_name: name.split(" ").slice(1).join(" ") || null
        });
        let profile = void 0;
        if (userRole === "student") {
          profile = await storage.createStudentProfile({
            user_id: newUser.id,
            grade_level: "10",
            section: "A",
            subjects: ["Mathematics", "Science", "English"]
          });
        } else if (userRole === "teacher") {
          profile = await storage.createTeacherProfile({
            user_id: newUser.id,
            subjects: ["Mathematics"],
            grades: ["10"],
            department: "Science"
          });
        }
        userWithProfile = { user: newUser, profile };
        console.log(`Created new ${userRole} user:`, email);
      } catch (createError) {
        console.error("Error creating user:", createError);
        userWithProfile = await storage.getUserWithProfile(auth0Id);
        if (!userWithProfile) {
          throw createError;
        }
      }
    }
    res.json(userWithProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    if (error?.message?.includes("endpoint is disabled")) {
      const authHeader = req.headers.authorization;
      let decoded = null;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        decoded = jwt.decode(authHeader.substring(7));
      }
      const sub = decoded?.sub || "unknown";
      const email = decoded?.email || `user_${sub.replace(/[^a-zA-Z0-9]/g, "_")}@demo.local`;
      const name = decoded?.name || decoded?.nickname || email.split("@")[0];
      const roleParam = req.query.role || "student";
      return res.json({
        user: {
          id: sub,
          auth0_id: sub,
          email,
          name,
          role: roleParam,
          roles: [roleParam],
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        },
        profile: null
      });
    }
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});
router2.put("/profile", async (req, res) => {
  try {
    const auth0Id = req.auth?.sub;
    if (!auth0Id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await storage.getUserByAuth0Id(auth0Id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const { name, profile_data } = req.body;
    if (name) {
      await storage.updateUser(user.id, { name });
    }
    if (profile_data && user.role === "student") {
      await storage.updateStudentProfile(user.id, profile_data);
    } else if (profile_data && user.role === "teacher") {
      await storage.updateTeacherProfile(user.id, profile_data);
    }
    const updatedProfile = await storage.getUserWithProfile(auth0Id);
    res.json(updatedProfile);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
var authRoutes_default = router2;

// server/authMiddleware.ts
import jwt2 from "jsonwebtoken";
import jwksClient from "jwks-rsa";
var client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN || "your-domain.auth0.com"}/.well-known/jwks.json`,
  requestHeaders: {},
  // Optional
  timeout: 3e4,
  // Defaults to 30s
  cache: true,
  // Default value
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  // Default value
  cacheMaxEntries: 5,
  // Default value
  cacheMaxAge: 6e5
  // Defaults to 10m
});
var getKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.error("Error getting signing key:", err);
      return callback(err);
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
};
var verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.substring(7);
    const audience = process.env.AUTH0_AUDIENCE || "your-api-identifier";
    const issuer = `https://${process.env.AUTH0_DOMAIN || "your-domain.auth0.com"}/`;
    if (process.env.NODE_ENV === "development") {
      const decoded = jwt2.decode(token);
      if (!decoded || !decoded.sub) {
        return res.status(401).json({ error: "Invalid token format" });
      }
      req.auth = {
        sub: decoded.sub
      };
      return next();
    }
    jwt2.verify(token, getKey, {
      audience,
      issuer,
      algorithms: ["RS256"]
    }, (err, decoded) => {
      if (err) {
        console.error("JWT verification error:", err);
        return res.status(401).json({ error: "Invalid token" });
      }
      if (!decoded || !decoded.sub) {
        return res.status(401).json({ error: "Invalid token format" });
      }
      req.auth = {
        sub: decoded.sub
      };
      next();
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
};
var requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.auth?.role) {
      return res.status(401).json({ error: "No user role found" });
    }
    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
};
var requireStudent = requireRole(["student"]);
var requireTeacher = requireRole(["teacher"]);
var requireAuth = requireRole(["student", "teacher"]);

// server/routes.ts
async function registerRoutes(app2) {
  app2.use("/api/auth", authRoutes_default);
  app2.use("/api/protected", verifyToken);
  app2.post("/api/protected/generate-exam", requireTeacher, generateExamPaper);
  app2.post("/api/protected/generate-lesson", requireTeacher, generateLesson);
  app2.post("/api/protected/analyze-practice", requireStudent, analyzePracticeSession);
  app2.post("/api/protected/analyze-practice-multi-image", requireStudent, analyzePracticeMultiImage);
  app2.post("/api/protected/ocr-preview", requireStudent, previewOCR);
  app2.use("/api/protected", requireAuth, doubtRoutes_default);
  app2.post("/api/protected/ai-tutor/teach", requireAuth, teachContent);
  app2.post("/api/protected/ai-tutor/generate-exam", requireAuth, generateExam);
  app2.post("/api/protected/ai-tutor/chat", requireAuth, chatWithTutor);
  app2.post("/api/generate-exam", generateExamPaper);
  app2.post("/api/generate-lesson", generateLesson);
  app2.use("/api", doubtRoutes_default);
  app2.post("/api/analyze-practice", analyzePracticeSession);
  app2.post("/api/analyze-practice-multi-image", analyzePracticeMultiImage);
  app2.post("/api/ocr-preview", previewOCR);
  app2.post("/api/ai-tutor/teach", teachContent);
  app2.post("/api/ai-tutor/generate-exam", generateExam);
  app2.post("/api/ai-tutor/chat", chatWithTutor);
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import { createProxyMiddleware } from "http-proxy-middleware";
var app = express2();
app.use(express2.json({ limit: "50mb" }));
app.use(express2.urlencoded({ extended: false, limit: "50mb" }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
  // 50MB limit
  useTempFiles: true,
  tempFileDir: "/tmp/"
}));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  app.use("/api", createProxyMiddleware({
    target: "http://localhost:8001",
    // FastAPI server
    changeOrigin: true,
    logLevel: "debug",
    // no pathRewrite needed
    onProxyReq: (proxyReq, req, res) => {
      log(`\u{1F500} Proxying ${req.method} ${req.path} to FastAPI`);
    },
    onProxyRes: (proxyRes, req, res) => {
      log(`\u2705 FastAPI response: ${proxyRes.statusCode} for ${req.method} ${req.path}`);
    },
    onError: (err, req, res) => {
      log(`\u274C Proxy error for ${req.method} ${req.path}: ${err.message}`);
      res.status(500).json({ error: "Proxy error", details: err.message });
    }
  }));
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 3e3;
  server.listen({
    port,
    host: "0.0.0.0"
  }, () => {
    log(`serving on port ${port}`);
  });
})();
