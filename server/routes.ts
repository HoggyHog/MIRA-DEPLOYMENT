import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateExamPaper, getConfigOptions } from "./aiExamRoutes";
import { generateLesson, getLessonConfigOptions } from "./lessonRoutes";
import { 
  analyzePracticeSession, 
  analyzePracticeMultiImage, 
  previewOCR, 
  getPracticeConfigOptions 
} from "./practicePlaygroundRoutes";
import { teachContent, generateExam, chatWithTutor } from "./aiTutorRoutes";
import doubtRoutes from "./doubtRoutes";
import authRoutes from "./authRoutes";
import { verifyToken, requireStudent, requireTeacher, requireAuth } from "./authMiddleware";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes (no authentication required)
  app.use('/api/auth', authRoutes);

  // Public routes (no authentication required) - These are now handled by FastAPI
  // app.get('/api/config-options', getConfigOptions);
  // app.get('/api/lesson-config-options', getLessonConfigOptions);
  // app.get('/api/practice-config-options', getPracticeConfigOptions);

  // Protected routes - require authentication
  app.use('/api/protected', verifyToken);

  // Teacher-only routes
  app.post('/api/protected/generate-exam', requireTeacher, generateExamPaper);
  app.post('/api/protected/generate-lesson', requireTeacher, generateLesson);

  // Student-only routes  
  app.post('/api/protected/analyze-practice', requireStudent, analyzePracticeSession);
  app.post('/api/protected/analyze-practice-multi-image', requireStudent, analyzePracticeMultiImage);
  app.post('/api/protected/ocr-preview', requireStudent, previewOCR);

  // Routes accessible by both students and teachers
  app.use('/api/protected', requireAuth, doubtRoutes);
  app.post('/api/protected/ai-tutor/teach', requireAuth, teachContent);
  app.post('/api/protected/ai-tutor/generate-exam', requireAuth, generateExam);
  app.post('/api/protected/ai-tutor/chat', requireAuth, chatWithTutor);

  // Backward compatibility - unprotected routes for development
  app.post('/api/generate-exam', generateExamPaper);
  app.post('/api/generate-lesson', generateLesson);
  app.use('/api', doubtRoutes);
  app.post('/api/analyze-practice', analyzePracticeSession);
  app.post('/api/analyze-practice-multi-image', analyzePracticeMultiImage);
  app.post('/api/ocr-preview', previewOCR);
  app.post('/api/ai-tutor/teach', teachContent);
  app.post('/api/ai-tutor/generate-exam', generateExam);
  app.post('/api/ai-tutor/chat', chatWithTutor);

  const httpServer = createServer(app);

  return httpServer;
}
