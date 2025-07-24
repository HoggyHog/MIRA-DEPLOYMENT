import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Management - Compatible with existing database schema
export const users = pgTable('users', {
  id: varchar('id').primaryKey(), // Using varchar to match existing schema
  email: varchar('email', { length: 255 }),
  first_name: varchar('first_name', { length: 255 }),
  last_name: varchar('last_name', { length: 255 }),
  profile_image_url: varchar('profile_image_url', { length: 255 }),
  roles: text('roles').array().notNull(),
  school_id: varchar('school_id', { length: 255 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  auth0_id: varchar('auth0_id', { length: 255 }).unique(),
  name: varchar('name', { length: 255 }),
  role: varchar('role', { length: 50 })
});

// Student-specific profile data
export const student_profiles = pgTable('student_profiles', {
  id: serial('id').primaryKey(),
  user_id: varchar('user_id').references(() => users.id).notNull(),
  grade_level: varchar('grade_level', { length: 10 }),
  section: varchar('section', { length: 10 }),
  roll_number: varchar('roll_number', { length: 20 }),
  subjects: text('subjects').array(), // Array of enrolled subjects
  created_at: timestamp('created_at').defaultNow()
});

// Teacher-specific profile data
export const teacher_profiles = pgTable('teacher_profiles', {
  id: serial('id').primaryKey(),
  user_id: varchar('user_id').references(() => users.id).notNull(),
  employee_id: varchar('employee_id', { length: 50 }),
  subjects: text('subjects').array(), // Array of subjects they teach
  grades: text('grades').array(), // Array of grades they teach
  department: varchar('department', { length: 100 }),
  created_at: timestamp('created_at').defaultNow()
});

// Content Generation Tracking for Teachers
export const content_generations = pgTable('content_generations', {
  id: serial('id').primaryKey(),
  user_id: varchar('user_id').references(() => users.id).notNull(),
  content_type: varchar('content_type', { length: 50 }).notNull(), // 'exam', 'lesson', 'practice_analysis'
  title: varchar('title', { length: 500 }),
  description: text('description'),
  input_parameters: text('input_parameters').notNull(), // JSON string of request params
  generated_content: text('generated_content'), // The actual generated content
  metadata: text('metadata'), // JSON string of additional metadata
  status: varchar('status', { length: 20 }).default('completed'),
  is_favorite: boolean('is_favorite').default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Generated Exams
export const generated_exams = pgTable('generated_exams', {
  id: serial('id').primaryKey(),
  content_generation_id: integer('content_generation_id').references(() => content_generations.id).notNull(),
  exam_config: text('exam_config').notNull(), // JSON string of exam configuration
  questions: text('questions').notNull(), // JSON string of questions array
  total_marks: integer('total_marks').notNull(),
  estimated_time: integer('estimated_time').notNull(), // in minutes
  question_distribution: text('question_distribution'), // JSON string
  curriculum_aligned: boolean('curriculum_aligned').default(true),
  marking_scheme: text('marking_scheme'),
  created_at: timestamp('created_at').defaultNow()
});

// Generated Lessons
export const generated_lessons = pgTable('generated_lessons', {
  id: serial('id').primaryKey(),
  content_generation_id: integer('content_generation_id').references(() => content_generations.id).notNull(),
  lesson_config: text('lesson_config').notNull(), // JSON string of lesson configuration
  lesson_content: text('lesson_content').notNull(), // Main lesson content
  key_concepts: text('key_concepts'), // JSON array of concepts
  estimated_duration: integer('estimated_duration'), // in minutes
  difficulty_level: varchar('difficulty_level', { length: 20 }),
  created_at: timestamp('created_at').defaultNow()
});

// Practice Analysis Sessions
export const practice_analyses = pgTable('practice_analyses', {
  id: serial('id').primaryKey(),
  content_generation_id: integer('content_generation_id').references(() => content_generations.id).notNull(),
  practice_config: text('practice_config').notNull(), // JSON string of configuration
  student_responses: text('student_responses').notNull(),
  ideal_answers: text('ideal_answers').notNull(),
  analysis_results: text('analysis_results'), // JSON string of analysis
  score_awarded: integer('score_awarded').notNull(),
  total_marks: integer('total_marks').notNull(),
  misconceptions_identified: text('misconceptions_identified'), // JSON array
  improvement_suggestions: text('improvement_suggestions'), // JSON array
  created_at: timestamp('created_at').defaultNow()
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type StudentProfile = typeof student_profiles.$inferSelect;
export type InsertStudentProfile = typeof student_profiles.$inferInsert;
export type TeacherProfile = typeof teacher_profiles.$inferSelect;
export type InsertTeacherProfile = typeof teacher_profiles.$inferInsert;
export type ContentGeneration = typeof content_generations.$inferSelect;
export type InsertContentGeneration = typeof content_generations.$inferInsert;
export type GeneratedExam = typeof generated_exams.$inferSelect;
export type InsertGeneratedExam = typeof generated_exams.$inferInsert;
export type GeneratedLesson = typeof generated_lessons.$inferSelect;
export type InsertGeneratedLesson = typeof generated_lessons.$inferInsert;
export type PracticeAnalysis = typeof practice_analyses.$inferSelect;
export type InsertPracticeAnalysis = typeof practice_analyses.$inferInsert;

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertStudentProfileSchema = createInsertSchema(student_profiles).omit({
  id: true,
  created_at: true
});

export const insertTeacherProfileSchema = createInsertSchema(teacher_profiles).omit({
  id: true,
  created_at: true
});

export const insertContentGenerationSchema = createInsertSchema(content_generations).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertGeneratedExamSchema = createInsertSchema(generated_exams).omit({
  id: true,
  created_at: true
});

export const insertGeneratedLessonSchema = createInsertSchema(generated_lessons).omit({
  id: true,
  created_at: true
});

export const insertPracticeAnalysisSchema = createInsertSchema(practice_analyses).omit({
  id: true,
  created_at: true
});
