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

// Insert schemas
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type StudentProfile = typeof student_profiles.$inferSelect;
export type InsertStudentProfile = z.infer<typeof insertStudentProfileSchema>;
export type TeacherProfile = typeof teacher_profiles.$inferSelect;
export type InsertTeacherProfile = z.infer<typeof insertTeacherProfileSchema>;
