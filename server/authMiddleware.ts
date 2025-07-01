import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { storage } from './storage';

// Extend Request type to include auth property
declare global {
  namespace Express {
    interface Request {
      auth?: {
        sub: string;
        role?: string;
        user?: any;
      };
    }
  }
}

// Simple JWT verification for development
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    
    // Decode JWT token without verification for development
    const decoded = jwt.decode(token) as any;
    
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ error: 'Invalid token format' });
    }
    
    // Store decoded token info
    req.auth = {
      sub: decoded.sub
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to get user data after token verification
export const attachUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth?.sub) {
      return res.status(401).json({ error: 'No user ID in token' });
    }
    
    // Get user data from database
    const user = await storage.getUserByAuth0Id(req.auth.sub);
    
    if (user) {
      req.auth.role = user.role;
      req.auth.user = user;
    }
    
    next();
  } catch (error) {
    console.error('Error attaching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to check if user has required role
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth?.role) {
      return res.status(401).json({ error: 'No user role found' });
    }
    
    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Middleware for student-only routes
export const requireStudent = requireRole(['student']);

// Middleware for teacher-only routes
export const requireTeacher = requireRole(['teacher']);

// Middleware for both students and teachers
export const requireAuth = requireRole(['student', 'teacher']);