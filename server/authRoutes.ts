import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { neon } from '@neondatabase/serverless';
import { storage } from './storage';

const router = Router();

// Auth0 webhook to handle user creation/updates
router.post('/auth0-webhook', async (req, res) => {
  try {
    const { user, event_type } = req.body;
    
    if (event_type === 'post-registration' || event_type === 'post-login') {
      const auth0Id = user.user_id;
      const email = user.email;
      const name = user.name || user.nickname || email.split('@')[0];
      
      // Check if user exists
      let existingUser = await storage.getUserByAuth0Id(auth0Id);
      
      if (!existingUser) {
        // Get role from user metadata (set during registration)
        const role = user.app_metadata?.role || user.user_metadata?.role || 'student';
        
        // Create new user
        const newUser = await storage.createUser({
          auth0_id: auth0Id,
          email: email,
          name: name,
          role: role,
          roles: [role],
          first_name: name.split(' ')[0],
          last_name: name.split(' ').slice(1).join(' ') || null
        });
        
        // Create profile based on role
        if (role === 'student') {
          await storage.createStudentProfile({
            user_id: newUser.id,
            grade_level: user.user_metadata?.grade_level || '10',
            section: user.user_metadata?.section || 'A',
            subjects: user.user_metadata?.subjects || ['Mathematics', 'Science', 'English']
          });
        } else if (role === 'teacher') {
          await storage.createTeacherProfile({
            user_id: newUser.id,
            subjects: user.user_metadata?.subjects || ['Mathematics'],
            grades: user.user_metadata?.grades || ['10'],
            department: user.user_metadata?.department || 'Science'
          });
        }
        
        console.log(`Created new ${role} user: ${email}`);
      }
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Auth0 webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Profile request - Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header found');
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    console.log('Token received, length:', token.length);
    
    // Decode JWT token
    const decoded = jwt.decode(token) as any;
    
    console.log('Decoded token success:', !!decoded);
    console.log('Token sub:', decoded?.sub);
    console.log('Token email:', decoded?.email);
    
    if (!decoded || !decoded.sub) {
      console.log('Invalid token format');
      return res.status(401).json({ error: 'Invalid token format' });
    }
    
    const auth0Id = decoded.sub;
    // Create unique fallback email using Auth0 ID to avoid duplicate key violations
    const email = decoded.email || `user_${auth0Id.replace(/[^a-zA-Z0-9]/g, '_')}@unknown.local`;
    const name = decoded.name || decoded.nickname || `User_${auth0Id.split('|').pop()}`;
    
    console.log('Looking up user for Auth0 ID:', auth0Id);
    
    // Try to get existing user from database
    let userWithProfile = await storage.getUserWithProfile(auth0Id);
    
    if (!userWithProfile) {
      console.log('User not found, creating new user:', email);
      
      // Get role from URL parameter or default to student
      const roleParam = req.query.role as string;
      const userRole = roleParam === 'teacher' ? 'teacher' : 'student';
      
      try {
        // Create new user
        const newUser = await storage.createUser({
          auth0_id: auth0Id,
          email: email,
          name: name,
          role: userRole,
          roles: [userRole], // Add to roles array as well
          first_name: name.split(' ')[0],
          last_name: name.split(' ').slice(1).join(' ') || null
        });
        
        // Create profile based on role
        let profile = undefined;
        if (userRole === 'student') {
          profile = await storage.createStudentProfile({
            user_id: newUser.id,
            grade_level: '10',
            section: 'A',
            subjects: ['Mathematics', 'Science', 'English']
          });
        } else if (userRole === 'teacher') {
          profile = await storage.createTeacherProfile({
            user_id: newUser.id,
            subjects: ['Mathematics'],
            grades: ['10'],
            department: 'Science'
          });
        }
        
        userWithProfile = { user: newUser, profile };
        console.log(`Created new ${userRole} user:`, email);
      } catch (createError) {
        console.error('Error creating user:', createError);
        // If user creation fails, try to get the user again in case it was created by another request
        userWithProfile = await storage.getUserWithProfile(auth0Id);
        if (!userWithProfile) {
          throw createError; // Re-throw the error if user still doesn't exist
        }
      }
    }
    
    res.json(userWithProfile);
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const auth0Id = req.auth?.sub;
    
    if (!auth0Id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = await storage.getUserByAuth0Id(auth0Id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { name, profile_data } = req.body;
    
    // Update user basic info
    if (name) {
      await storage.updateUser(user.id, { name });
    }
    
    // Update profile data based on role
    if (profile_data && user.role === 'student') {
      await storage.updateStudentProfile(user.id, profile_data);
    } else if (profile_data && user.role === 'teacher') {
      await storage.updateTeacherProfile(user.id, profile_data);
    }
    
    // Return updated profile
    const updatedProfile = await storage.getUserWithProfile(auth0Id);
    res.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;