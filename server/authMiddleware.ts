import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
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

// JWKS client for Auth0 token verification
const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN || 'your-domain.auth0.com'}/.well-known/jwks.json`,
  requestHeaders: {}, // Optional
  timeout: 30000, // Defaults to 30s
  cache: true, // Default value
  rateLimit: true,
  jwksRequestsPerMinute: 5, // Default value
  cacheMaxEntries: 5, // Default value
  cacheMaxAge: 600000, // Defaults to 10m
});

// Function to get signing key
const getKey = (header: any, callback: any) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.error('Error getting signing key:', err);
      return callback(err);
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
};

// Verify Auth0 JWT token
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    const audience = process.env.AUTH0_AUDIENCE || 'your-api-identifier';
    const issuer = `https://${process.env.AUTH0_DOMAIN || 'your-domain.auth0.com'}/`;
    
    // For development, use simple decode without verification
    if (process.env.NODE_ENV === 'development') {
      const decoded = jwt.decode(token) as any;
      
      if (!decoded || !decoded.sub) {
        return res.status(401).json({ error: 'Invalid token format' });
      }
      
      req.auth = {
        sub: decoded.sub
      };
      
      return next();
    }
    
    // For production, verify the token
    jwt.verify(token, getKey, {
      audience: audience,
      issuer: issuer,
      algorithms: ['RS256']
    }, (err, decoded: any) => {
      if (err) {
        console.error('JWT verification error:', err);
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      if (!decoded || !decoded.sub) {
        return res.status(401).json({ error: 'Invalid token format' });
      }
      
      req.auth = {
        sub: decoded.sub
      };
      
      next();
    });
    
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