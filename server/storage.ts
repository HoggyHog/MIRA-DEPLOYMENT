import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { 
  users, 
  student_profiles, 
  teacher_profiles,
  type User, 
  type InsertUser,
  type StudentProfile,
  type InsertStudentProfile,
  type TeacherProfile,
  type InsertTeacherProfile
} from "@shared/schema";
import { eq } from "drizzle-orm";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export interface IStorage {
  // User management
  createUser(user: InsertUser): Promise<User>;
  getUserByAuth0Id(auth0Id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  
  // Student profile management
  createStudentProfile(profile: InsertStudentProfile): Promise<StudentProfile>;
  getStudentProfileByUserId(userId: string): Promise<StudentProfile | undefined>;
  updateStudentProfile(userId: string, updates: Partial<InsertStudentProfile>): Promise<StudentProfile | undefined>;
  
  // Teacher profile management
  createTeacherProfile(profile: InsertTeacherProfile): Promise<TeacherProfile>;
  getTeacherProfileByUserId(userId: string): Promise<TeacherProfile | undefined>;
  updateTeacherProfile(userId: string, updates: Partial<InsertTeacherProfile>): Promise<TeacherProfile | undefined>;
  
  // User with profile data
  getUserWithProfile(auth0Id: string): Promise<{ user: User; profile: StudentProfile | TeacherProfile | undefined } | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createUser(user: InsertUser): Promise<User> {
    // Generate unique ID if not provided
    const userId = user.auth0_id ? `user_${user.auth0_id.replace(/[^a-zA-Z0-9]/g, '_')}` : `user_${Date.now()}`;
    const userWithId = { ...user, id: userId };
    const [newUser] = await db.insert(users).values(userWithId).returning();
    return newUser;
  }

  async getUserByAuth0Id(auth0Id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.auth0_id, auth0Id));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set({
      ...updates,
      updated_at: new Date()
    }).where(eq(users.id, id)).returning();
    return updated;
  }

  async createStudentProfile(profile: InsertStudentProfile): Promise<StudentProfile> {
    const [newProfile] = await db.insert(student_profiles).values(profile).returning();
    return newProfile;
  }

  async getStudentProfileByUserId(userId: string): Promise<StudentProfile | undefined> {
    const [profile] = await db.select().from(student_profiles).where(eq(student_profiles.user_id, userId));
    return profile;
  }

  async updateStudentProfile(userId: string, updates: Partial<InsertStudentProfile>): Promise<StudentProfile | undefined> {
    const [updated] = await db.update(student_profiles).set(updates).where(eq(student_profiles.user_id, userId)).returning();
    return updated;
  }

  async createTeacherProfile(profile: InsertTeacherProfile): Promise<TeacherProfile> {
    const [newProfile] = await db.insert(teacher_profiles).values(profile).returning();
    return newProfile;
  }

  async getTeacherProfileByUserId(userId: string): Promise<TeacherProfile | undefined> {
    const [profile] = await db.select().from(teacher_profiles).where(eq(teacher_profiles.user_id, userId));
    return profile;
  }

  async updateTeacherProfile(userId: string, updates: Partial<InsertTeacherProfile>): Promise<TeacherProfile | undefined> {
    const [updated] = await db.update(teacher_profiles).set(updates).where(eq(teacher_profiles.user_id, userId)).returning();
    return updated;
  }

  async getUserWithProfile(auth0Id: string): Promise<{ user: User; profile: StudentProfile | TeacherProfile | undefined } | undefined> {
    const user = await this.getUserByAuth0Id(auth0Id);
    if (!user) return undefined;

    let profile: StudentProfile | TeacherProfile | undefined = undefined;
    
    if (user.role === 'student') {
      profile = await this.getStudentProfileByUserId(user.id);
    } else if (user.role === 'teacher') {
      profile = await this.getTeacherProfileByUserId(user.id);
    }

    return { user, profile };
  }
}

export const storage = new DatabaseStorage();
