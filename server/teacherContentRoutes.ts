import { Router } from 'express';
import { storage } from './storage';
import { requireTeacher } from './authMiddleware';
import type { Request, Response } from 'express';

const router = Router();

// Get all content generations for the logged-in teacher
router.get('/content-generations', requireTeacher, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.user?.id || (req as any).user?.userId;
    const contentType = req.query.contentType as string | undefined;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const contentGenerations = await storage.getContentGenerationsByUser(userId, contentType);
    
    // Enrich with specific content details
    const enrichedContent = await Promise.all(contentGenerations.map(async (content) => {
      let specificContent = null;
      
      switch (content.content_type) {
        case 'exam':
          specificContent = await storage.getGeneratedExamByContentId(content.id);
          break;
        case 'lesson':
          specificContent = await storage.getGeneratedLessonByContentId(content.id);
          break;
        case 'practice_analysis':
          specificContent = await storage.getPracticeAnalysisByContentId(content.id);
          break;
      }
      
      return {
        ...content,
        specificContent,
        input_parameters: content.input_parameters ? JSON.parse(content.input_parameters) : null,
        metadata: content.metadata ? JSON.parse(content.metadata) : null
      };
    }));
    
    res.json({ success: true, content: enrichedContent });
  } catch (error) {
    console.error('Error fetching content generations:', error);
    res.status(500).json({ error: 'Failed to fetch content generations' });
  }
});

// Get a specific content generation
router.get('/content-generations/:id', requireTeacher, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.user?.id || (req as any).user?.userId;
    const contentId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const content = await storage.getContentGenerationById(contentId);
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Verify ownership
    if (content.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get specific content details
    let specificContent = null;
    
    switch (content.content_type) {
      case 'exam':
        specificContent = await storage.getGeneratedExamByContentId(content.id);
        break;
      case 'lesson':
        specificContent = await storage.getGeneratedLessonByContentId(content.id);
        break;
      case 'practice_analysis':
        specificContent = await storage.getPracticeAnalysisByContentId(content.id);
        break;
    }
    
    res.json({
      success: true,
      content: {
        ...content,
        specificContent,
        input_parameters: content.input_parameters ? JSON.parse(content.input_parameters) : null,
        metadata: content.metadata ? JSON.parse(content.metadata) : null
      }
    });
  } catch (error) {
    console.error('Error fetching content generation:', error);
    res.status(500).json({ error: 'Failed to fetch content generation' });
  }
});

// Save generated exam
router.post('/save-exam', requireTeacher, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.user?.id || (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const {
      title,
      description,
      input_parameters,
      generated_content,
      metadata,
      exam_config,
      questions,
      total_marks,
      estimated_time,
      question_distribution,
      marking_scheme
    } = req.body;

    // Create content generation record
    const contentGeneration = await storage.createContentGeneration({
      user_id: userId,
      content_type: 'exam',
      title,
      description,
      input_parameters: JSON.stringify(input_parameters),
      generated_content,
      metadata: metadata ? JSON.stringify(metadata) : null,
      status: 'completed',
      is_favorite: false
    });

    // Create exam-specific record
    const generatedExam = await storage.createGeneratedExam({
      content_generation_id: contentGeneration.id,
      exam_config: JSON.stringify(exam_config),
      questions: JSON.stringify(questions),
      total_marks,
      estimated_time,
      question_distribution: question_distribution ? JSON.stringify(question_distribution) : null,
      curriculum_aligned: true,
      marking_scheme
    });

    res.json({
      success: true,
      contentGeneration,
      generatedExam
    });
  } catch (error) {
    console.error('Error saving exam:', error);
    res.status(500).json({ error: 'Failed to save exam' });
  }
});

// Save generated lesson
router.post('/save-lesson', requireTeacher, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.user?.id || (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const {
      title,
      description,
      input_parameters,
      generated_content,
      metadata,
      lesson_config,
      lesson_content,
      key_concepts,
      estimated_duration,
      difficulty_level
    } = req.body;

    // Create content generation record
    const contentGeneration = await storage.createContentGeneration({
      user_id: userId,
      content_type: 'lesson',
      title,
      description,
      input_parameters: JSON.stringify(input_parameters),
      generated_content,
      metadata: metadata ? JSON.stringify(metadata) : null,
      status: 'completed',
      is_favorite: false
    });

    // Create lesson-specific record
    const generatedLesson = await storage.createGeneratedLesson({
      content_generation_id: contentGeneration.id,
      lesson_config: JSON.stringify(lesson_config),
      lesson_content,
      key_concepts: key_concepts ? JSON.stringify(key_concepts) : null,
      estimated_duration,
      difficulty_level
    });

    res.json({
      success: true,
      contentGeneration,
      generatedLesson
    });
  } catch (error) {
    console.error('Error saving lesson:', error);
    res.status(500).json({ error: 'Failed to save lesson' });
  }
});

// Save practice analysis
router.post('/save-practice-analysis', requireTeacher, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.user?.id || (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const {
      title,
      description,
      input_parameters,
      generated_content,
      metadata,
      practice_config,
      student_responses,
      ideal_answers,
      analysis_results,
      score_awarded,
      total_marks,
      misconceptions_identified,
      improvement_suggestions
    } = req.body;

    // Create content generation record
    const contentGeneration = await storage.createContentGeneration({
      user_id: userId,
      content_type: 'practice_analysis',
      title,
      description,
      input_parameters: JSON.stringify(input_parameters),
      generated_content,
      metadata: metadata ? JSON.stringify(metadata) : null,
      status: 'completed',
      is_favorite: false
    });

    // Create practice analysis-specific record
    const practiceAnalysis = await storage.createPracticeAnalysis({
      content_generation_id: contentGeneration.id,
      practice_config: JSON.stringify(practice_config),
      student_responses,
      ideal_answers,
      analysis_results: analysis_results ? JSON.stringify(analysis_results) : null,
      score_awarded,
      total_marks,
      misconceptions_identified: misconceptions_identified ? JSON.stringify(misconceptions_identified) : null,
      improvement_suggestions: improvement_suggestions ? JSON.stringify(improvement_suggestions) : null
    });

    res.json({
      success: true,
      contentGeneration,
      practiceAnalysis
    });
  } catch (error) {
    console.error('Error saving practice analysis:', error);
    res.status(500).json({ error: 'Failed to save practice analysis' });
  }
});

// Update content generation (e.g., favorite/unfavorite)
router.patch('/content-generations/:id', requireTeacher, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.user?.id || (req as any).user?.userId;
    const contentId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify ownership
    const content = await storage.getContentGenerationById(contentId);
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    if (content.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { is_favorite, title, description } = req.body;
    
    const updatedContent = await storage.updateContentGeneration(contentId, {
      is_favorite,
      title,
      description
    });

    res.json({ success: true, content: updatedContent });
  } catch (error) {
    console.error('Error updating content generation:', error);
    res.status(500).json({ error: 'Failed to update content generation' });
  }
});

// Delete content generation
router.delete('/content-generations/:id', requireTeacher, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.user?.id || (req as any).user?.userId;
    const contentId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify ownership
    const content = await storage.getContentGenerationById(contentId);
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    if (content.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await storage.deleteContentGeneration(contentId);

    res.json({ success: true, message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Error deleting content generation:', error);
    res.status(500).json({ error: 'Failed to delete content generation' });
  }
});

export default router; 