-- Migration: Add teacher content generation tables
-- Description: Tables to store teacher-generated content (lessons, exams, practice analyses)

-- Content Generation Tracking for Teachers
CREATE TABLE IF NOT EXISTS content_generations (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('exam', 'lesson', 'practice_analysis')),
  title VARCHAR(500),
  description TEXT,
  input_parameters TEXT NOT NULL, -- JSON string of request params
  generated_content TEXT, -- The actual generated content
  metadata TEXT, -- JSON string of additional metadata
  status VARCHAR(20) DEFAULT 'completed',
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Generated Exams
CREATE TABLE IF NOT EXISTS generated_exams (
  id SERIAL PRIMARY KEY,
  content_generation_id INTEGER REFERENCES content_generations(id) ON DELETE CASCADE NOT NULL,
  exam_config TEXT NOT NULL, -- JSON string of exam configuration
  questions TEXT NOT NULL, -- JSON string of questions array
  total_marks INTEGER NOT NULL,
  estimated_time INTEGER NOT NULL, -- in minutes
  question_distribution TEXT, -- JSON string
  curriculum_aligned BOOLEAN DEFAULT TRUE,
  marking_scheme TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Generated Lessons
CREATE TABLE IF NOT EXISTS generated_lessons (
  id SERIAL PRIMARY KEY,
  content_generation_id INTEGER REFERENCES content_generations(id) ON DELETE CASCADE NOT NULL,
  lesson_config TEXT NOT NULL, -- JSON string of lesson configuration
  lesson_content TEXT NOT NULL, -- Main lesson content
  key_concepts TEXT, -- JSON array of concepts
  estimated_duration INTEGER, -- in minutes
  difficulty_level VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Practice Analysis Sessions
CREATE TABLE IF NOT EXISTS practice_analyses (
  id SERIAL PRIMARY KEY,
  content_generation_id INTEGER REFERENCES content_generations(id) ON DELETE CASCADE NOT NULL,
  practice_config TEXT NOT NULL, -- JSON string of configuration
  student_responses TEXT NOT NULL,
  ideal_answers TEXT NOT NULL,
  analysis_results TEXT, -- JSON string of analysis
  score_awarded INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  misconceptions_identified TEXT, -- JSON array
  improvement_suggestions TEXT, -- JSON array
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_content_generations_user_id ON content_generations(user_id);
CREATE INDEX idx_content_generations_type ON content_generations(content_type);
CREATE INDEX idx_content_generations_created_at ON content_generations(created_at DESC);
CREATE INDEX idx_generated_exams_content_id ON generated_exams(content_generation_id);
CREATE INDEX idx_generated_lessons_content_id ON generated_lessons(content_generation_id);
CREATE INDEX idx_practice_analyses_content_id ON practice_analyses(content_generation_id); 