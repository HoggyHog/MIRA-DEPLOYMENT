import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { neon } from '@neondatabase/serverless';
import { storage } from './storage';
import fetch from 'node-fetch';

// In-memory user store for when database is unavailable
const memoryUsers = new Map<string, any>();

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
    console.log('Full decoded token:', decoded);
    
    if (!decoded || !decoded.sub) {
      console.log('Invalid token format');
      return res.status(401).json({ error: 'Invalid token format' });
    }
    
    const auth0Id = decoded.sub;
    const roleParam = req.query.role as string;
    const userRole = roleParam === 'teacher' ? 'teacher' : 'student';
    
    // Check memory store first
    const memoryKey = `${auth0Id}_${userRole}`;
    if (memoryUsers.has(memoryKey)) {
      console.log('Returning user from memory store');
      return res.json(memoryUsers.get(memoryKey));
    }
    
    // For Google OAuth2 tokens, try to extract user info from different fields
    let email = decoded.email || decoded['https://your-app.com/email'] || decoded['email_verified'];
    let name = decoded.name || decoded['https://your-app.com/name'] || decoded.nickname || decoded.given_name;
    
    // If still no email/name, try to fetch from Auth0 userinfo endpoint
    if (!email || !name) {
      console.log('No email/name in token, attempting to fetch from Auth0 userinfo endpoint');
      try {
                 const userinfoResponse = await fetch(`https://${process.env.AUTH0_DOMAIN || 'dev-fmpogod2vih2psgh.us.auth0.com'}/userinfo`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (userinfoResponse.ok) {
          const userinfo = await userinfoResponse.json() as any;
          console.log('Userinfo from Auth0:', userinfo);
          email = email || userinfo.email;
          name = name || userinfo.name || userinfo.nickname;
        } else {
          console.log('Failed to fetch userinfo:', userinfoResponse.status);
        }
      } catch (userinfoError) {
        console.log('Error fetching userinfo:', userinfoError);
      }
    }
    
    // Final fallbacks
    email = email || `user_${auth0Id.replace(/[^a-zA-Z0-9]/g, '_')}@demo.local`;
    name = name || `User_${auth0Id.split('|').pop()}`;
    
    console.log('Looking up user for Auth0 ID:', auth0Id);
    console.log('Using email:', email, 'name:', name);
    
    let userWithProfile;
    let isDatabaseWorking = true;
    
    try {
      // Try to get existing user from database
      userWithProfile = await storage.getUserWithProfile(auth0Id);
      
      if (!userWithProfile) {
        console.log('User not found, creating new user:', email);
        
        // Create new user
        const newUser = await storage.createUser({
          auth0_id: auth0Id,
          email: email,
          name: name,
          role: userRole,
          roles: [userRole],
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
      }
      
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      isDatabaseWorking = false;
      
      // Database is unavailable, create in-memory user
      console.log('Database unavailable, creating in-memory user');
      userWithProfile = {
        user: {
          id: auth0Id,
          auth0_id: auth0Id,
          email,
          name,
          role: userRole,
          roles: [userRole],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          first_name: name.split(' ')[0],
          last_name: name.split(' ').slice(1).join(' ') || null,
        },
        profile: userRole === 'student' ? {
          id: 1,
          user_id: auth0Id,
          grade_level: '10',
          section: 'A',
          subjects: ['Mathematics', 'Science', 'English'],
          created_at: new Date().toISOString()
        } : userRole === 'teacher' ? {
          id: 1,
          user_id: auth0Id,
          subjects: ['Mathematics'],
          grades: ['10'],
          department: 'Science',
          created_at: new Date().toISOString()
        } : undefined
      };
      
      // Store in memory for subsequent requests
      memoryUsers.set(memoryKey, userWithProfile);
      console.log('Stored user in memory store');
    }
    
    res.json(userWithProfile);
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Logout endpoint to clear memory store
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.decode(token) as any;
      
      if (decoded?.sub) {
        // Clear user from memory store for all roles
        const auth0Id = decoded.sub;
        memoryUsers.delete(`${auth0Id}_student`);
        memoryUsers.delete(`${auth0Id}_teacher`);
        console.log('Cleared user from memory store:', auth0Id);
      }
    }
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.json({ success: true }); // Still return success since logout should always work
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