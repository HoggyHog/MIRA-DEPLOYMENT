import React, { createContext, useContext, useEffect, useState } from "react";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { useLocation } from "wouter";
import { auth0Config } from "@/config/auth0";

interface UserProfile {
  user: {
    id: string;
    auth0_id: string;
    email: string;
    name: string;
    role: 'student' | 'teacher' | 'admin' | 'parent';
    created_at: string;
    updated_at: string;
  };
  profile?: any;
}

interface AuthContextType {
  user: any;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (role?: string, forceAccountSelection?: boolean) => void;
  logout: () => void;
  forceLogout: () => void;
  getAccessToken: () => Promise<string>;
  refreshProfile: () => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  forceLogout: () => {},
  getAccessToken: async () => "",
  refreshProfile: async () => {},
  authError: null,
});

export const useAuth = () => useContext(AuthContext);

// Check if Auth0 is properly configured
const isAuth0Configured = () => {
  // Check if Auth0 is properly configured by verifying the values are not default placeholders
  // and are actually valid Auth0 domains/URLs
  const hasValidDomain = auth0Config.domain && 
                        auth0Config.domain !== "dev-example.us.auth0.com" &&
                        auth0Config.domain.includes(".auth0.com");
  
  const hasValidClientId = auth0Config.clientId && 
                          auth0Config.clientId !== "test-client-id" &&
                          auth0Config.clientId.length > 10;
  
  const hasValidAudience = auth0Config.audience && 
                          auth0Config.audience !== "https://mira-api.example.com" &&
                          auth0Config.audience.startsWith("https://");
  
  // Debug logging
  console.log('🔧 isAuth0Configured check:', {
    domain: auth0Config.domain,
    clientId: auth0Config.clientId,
    audience: auth0Config.audience,
    hasValidDomain,
    hasValidClientId,
    hasValidAudience,
    result: hasValidDomain && hasValidClientId && hasValidAudience
  });
  
  return hasValidDomain && hasValidClientId && hasValidAudience;
};

// Auth0 provider
const Auth0AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Don't call useAuth0() at all - prevent automatic authentication
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [auth0Loading, setAuth0Loading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  // Debug logging
  useEffect(() => {
    console.log('🔐 Auth0AuthProvider mounted with:', {
      isAuth0Configured: isAuth0Configured(),
      auth0Loading,
      isAuthenticated,
      user,
      userProfile,
      authError
    });
  }, []);

  // Check for Auth0 configuration issues
  useEffect(() => {
    if (!isAuth0Configured()) {
      setAuthError("Auth0 is not properly configured. Please set up your Auth0 credentials.");
    } else {
      setAuthError(null);
    }
  }, []);

  // Function to fetch user profile from backend
  const fetchUserProfile = async (roleParam?: string): Promise<UserProfile | null> => {
    if (!isAuthenticated || !user) return null;

    try {
      // Get token using the Auth0 instance only when needed
      const auth0Instance = await import('@auth0/auth0-react');
      const { getAccessTokenSilently } = auth0Instance.useAuth0();
      
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: auth0Config.audience,
          scope: auth0Config.scope,
        },
      });
      
      const url = roleParam ? `/api/auth/profile?role=${roleParam}` : '/api/auth/profile';
      
      console.log('Fetching profile from:', url, 'with token length:', token.length);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Profile response status:', response.status);

      if (response.ok) {
        const profile = await response.json();
        console.log('Profile fetched successfully:', profile);
        return profile;
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch user profile:', response.status, errorText);
        setAuthError(`Profile fetch failed: ${response.status} - ${errorText}`);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setAuthError(`Profile fetch error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  // Store chosen role so we can send it after redirect
  const login = async (role?: string, forceAccountSelection = true) => {
    if (!isAuth0Configured()) {
      // For demo purposes when Auth0 is not configured, create a mock user profile
      console.log('Auth0 not configured, creating demo profile for role:', role);
      const mockProfile: UserProfile = {
        user: {
          id: `demo_${role}_${Date.now()}`,
          auth0_id: `demo|${role}`,
          email: `demo.${role}@mira.local`,
          name: `Demo ${role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User'}`,
          role: role as any,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      };
      setUserProfile(mockProfile);
      setIsAuthenticated(true);
      
      // Redirect to appropriate dashboard
      if (role === 'student') {
        setLocation('/student-dashboard');
      } else if (role === 'teacher') {
        setLocation('/teacher-dashboard');
      }
      return;
    }

    if (role) {
      sessionStorage.setItem('requestedRole', role);
    }
    
    try {
      // Only now do we start the Auth0 authentication flow
      setAuth0Loading(true);
      
      // Wait a bit for the ConditionalAuth0Provider to enable Auth0
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Now try to use Auth0
      try {
        const { useAuth0 } = await import('@auth0/auth0-react');
        const { loginWithRedirect } = useAuth0();
        
        const appState = role ? { role } : undefined;
        const authParams: any = {
          redirect_uri: window.location.origin,
          audience: auth0Config.audience,
          scope: auth0Config.scope,
        };
        
        // Force account selection to allow choosing different Google accounts
        if (forceAccountSelection) {
          authParams.prompt = 'select_account';
        }
        
        await loginWithRedirect({
          appState,
          authorizationParams: authParams,
        });
      } catch (auth0Error) {
        console.error('Auth0 not ready yet, retrying...', auth0Error);
        // If Auth0 is not ready, wait a bit more and try again
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { useAuth0 } = await import('@auth0/auth0-react');
        const { loginWithRedirect } = useAuth0();
        
        const appState = role ? { role } : undefined;
        const authParams: any = {
          redirect_uri: window.location.origin,
          audience: auth0Config.audience,
          scope: auth0Config.scope,
        };
        
        if (forceAccountSelection) {
          authParams.prompt = 'select_account';
        }
        
        await loginWithRedirect({
          appState,
          authorizationParams: authParams,
        });
      }
    } catch (error) {
      console.error('Login redirect failed:', error);
      setAuthError(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAuth0Loading(false);
    }
  };

  const logout = async () => {
    if (!isAuth0Configured()) {
      // For demo mode, just clear the mock profile
      setUserProfile(null);
      setIsAuthenticated(false);
      setUser(null);
      setLocation('/');
      return;
    }

    try {
      // Call server logout to clear memory store
      const token = await getAccessToken();
      
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.log('Server logout call failed:', error);
      // Continue with logout anyway
    }

    // Clear local state
    setUserProfile(null);
    setIsAuthenticated(false);
    setUser(null);
    
    // Use Auth0 logout if available
    try {
      const { useAuth0 } = await import('@auth0/auth0-react');
      const { logout: auth0Logout } = useAuth0();
      auth0Logout({ 
        logoutParams: { 
          returnTo: window.location.origin 
        } 
      });
    } catch (error) {
      console.log('Auth0 logout failed:', error);
      setLocation('/');
    }
  };

  const forceLogout = async () => {
    if (!isAuth0Configured()) {
      setUserProfile(null);
      setIsAuthenticated(false);
      setUser(null);
      setLocation('/');
      return;
    }

    // Clear local state first
    setUserProfile(null);
    setIsAuthenticated(false);
    setUser(null);

    // Force logout with federated logout to clear Google session too
    try {
      const { useAuth0 } = await import('@auth0/auth0-react');
      const { logout: auth0Logout } = useAuth0();
      auth0Logout({ 
        logoutParams: { 
          returnTo: window.location.origin,
          federated: true // This clears the Google session too
        } 
      });
    } catch (error) {
      console.log('Auth0 logout failed:', error);
      setLocation('/');
    }
  };

  const getAccessToken = async (): Promise<string> => {
    if (!isAuth0Configured()) {
      return 'demo-token';
    }

    try {
      const { useAuth0 } = await import('@auth0/auth0-react');
      const { getAccessTokenSilently } = useAuth0();
      
      return await getAccessTokenSilently({
        authorizationParams: {
          audience: auth0Config.audience,
          scope: auth0Config.scope,
        },
      });
    } catch (error) {
      console.error('Error getting access token:', error);
      if ((error as any)?.error === 'login_required') {
        // Don't automatically redirect - just return empty string
        // User needs to explicitly click login button
        console.log('Login required - user needs to click login button');
        return '';
      } else {
        setAuthError(`Token error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      return '';
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (!isAuth0Configured()) {
      return;
    }

    // Only refresh profile if explicitly requested and user is authenticated
    if (isAuthenticated && user && sessionStorage.getItem('requestedRole')) {
      setIsLoadingProfile(true);
      try {
        const profile = await fetchUserProfile(sessionStorage.getItem('requestedRole') || undefined);
        setUserProfile(profile);
        sessionStorage.removeItem('requestedRole');
      } catch (error) {
        console.error('Error refreshing profile:', error);
        setAuthError(`Refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoadingProfile(false);
      }
    }
  };

  const contextValue: AuthContextType = {
    user,
    userProfile,
    // Only consider authenticated if we have a user profile (explicit login) or if in demo mode
    isAuthenticated: isAuth0Configured() ? !!userProfile : !!userProfile,
    isLoading: auth0Loading || isLoadingProfile,
    login,
    logout,
    forceLogout,
    getAccessToken,
    refreshProfile,
    authError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Main AuthProvider component using Auth0
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Debug logging
  console.log('🔧 AuthProvider: Auth0 configuration check:', {
    domain: auth0Config.domain,
    clientId: auth0Config.clientId,
    audience: auth0Config.audience,
    isConfigured: isAuth0Configured()
  });

  // If Auth0 is not configured, provide a simple context without Auth0
  if (!isAuth0Configured()) {
    console.log('Auth0 not configured, using demo mode');
    return (
      <Auth0AuthProvider>
        {children}
      </Auth0AuthProvider>
    );
  }

  console.log('Auth0 configured, using Auth0Provider with manual control');
  
  // Use Auth0Provider but with manual control to prevent automatic authentication
  return (
    <Auth0Provider
      cacheLocation="localstorage"
      useRefreshTokens={false}
      skipRedirectCallback={false}
      onRedirectCallback={(appState) => {
        // Handle redirect callback when user returns from authentication
        console.log('🔐 Auth0 redirect callback with appState:', appState);
        
        // Clear the URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // The ManualAuth0Provider will handle the rest of the authentication flow
      }}
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={{
        redirect_uri: auth0Config.redirectUri,
        audience: auth0Config.audience,
        scope: auth0Config.scope,
      }}
    >
      <ManualAuth0Provider>
        {children}
      </ManualAuth0Provider>
    </Auth0Provider>
  );
};

// Manual Auth0 provider that doesn't use useAuth0() until explicitly needed
const ManualAuth0Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    user, 
    isAuthenticated, 
    isLoading: auth0Loading, 
    loginWithRedirect, 
    logout: auth0Logout,
    getAccessTokenSilently,
    error: auth0Error
  } = useAuth0();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  // Debug logging
  useEffect(() => {
    console.log('🔐 ManualAuth0Provider mounted with:', {
      isAuth0Configured: isAuth0Configured(),
      auth0Loading,
      isAuthenticated,
      user,
      userProfile,
      authError
    });
  }, []);

  // Check for Auth0 configuration issues
  useEffect(() => {
    if (!isAuth0Configured()) {
      setAuthError("Auth0 is not properly configured. Please set up your Auth0 credentials.");
    } else if (auth0Error) {
      setAuthError(`Auth0 Error: ${auth0Error.message}`);
      console.error('Auth0 Error:', auth0Error);
    } else {
      setAuthError(null);
    }
  }, [auth0Error]);

  // Handle Auth0 redirect callback when user returns from authentication
  useEffect(() => {
    console.log('🔄 ManualAuth0Provider redirect handling effect:', {
      isAuthenticated,
      user,
      userProfile,
      hasRequestedRole: !!sessionStorage.getItem('requestedRole')
    });
    
    if (isAuthenticated && user && !userProfile) {
      console.log('✅ User authenticated, checking for requested role...');
      const requestedRole = sessionStorage.getItem('requestedRole');
      
      if (requestedRole) {
        console.log('🎯 Loading user profile for requested role:', requestedRole);
        setIsLoadingProfile(true);
        
        fetchUserProfile(requestedRole)
          .then((profile) => {
            console.log('📋 Profile loaded successfully:', profile);
            setUserProfile(profile);
            sessionStorage.removeItem('requestedRole');
            
            // Redirect based on role after successful login
            if (profile?.user?.role) {
              const role = profile.user.role;
              console.log('🚀 Redirecting to dashboard for role:', role);
              if (role === 'student') {
                setLocation('/student-dashboard');
              } else if (role === 'teacher') {
                setLocation('/teacher-dashboard');
              } else if (role === 'admin') {
                setLocation('/admin-dashboard');
              } else if (role === 'parent') {
                setLocation('/parent-dashboard');
              }
            }
          })
          .catch((error) => {
            console.error('❌ Failed to load user profile after redirect:', error);
            setAuthError(`Failed to load profile: ${error.message}`);
          })
          .finally(() => {
            setIsLoadingProfile(false);
          });
      } else {
        console.log('⚠️ No requested role found, user may have authenticated without role selection');
      }
    }
  }, [isAuthenticated, user, userProfile, setLocation]);

  // Handle case where user is already authenticated but we need to check profile
  useEffect(() => {
    if (isAuthenticated && user && !userProfile && !isLoadingProfile) {
      console.log('🔍 User already authenticated, checking if we need to load profile...');
      
      // Check if we have a stored role or if we should try to get the user's role
      const requestedRole = sessionStorage.getItem('requestedRole');
      
      if (requestedRole) {
        console.log('🔄 Found stored role, loading profile...');
        // Call refreshProfile directly instead of including it in dependencies
        refreshProfile();
      } else {
        console.log('ℹ️ No stored role, user may need to select role again');
        // Could redirect to role selection page here if needed
      }
    }
  }, [isAuthenticated, user, userProfile, isLoadingProfile]);

  // Function to fetch user profile from backend
  const fetchUserProfile = async (roleParam?: string): Promise<UserProfile | null> => {
    if (!isAuthenticated || !user) return null;

    try {
      // Get token using the Auth0 instance only when needed
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: auth0Config.audience,
          scope: auth0Config.scope,
        },
      });
      
      const url = roleParam ? `/api/auth/profile?role=${roleParam}` : '/api/auth/profile';
      
      console.log('Fetching profile from:', url, 'with token length:', token.length);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Profile response status:', response.status);

      if (response.ok) {
        const profile = await response.json();
        console.log('Profile fetched successfully:', profile);
        return profile;
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch user profile:', response.status, errorText);
        setAuthError(`Profile fetch failed: ${response.status} - ${errorText}`);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setAuthError(`Profile fetch error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  // Store chosen role so we can send it after redirect
  const login = async (role?: string, forceAccountSelection = true) => {
    if (!isAuth0Configured()) {
      // For demo purposes when Auth0 is not configured, create a mock user profile
      console.log('Auth0 not configured, creating demo profile for role:', role);
      const mockProfile: UserProfile = {
        user: {
          id: `demo_${role}_${Date.now()}`,
          auth0_id: `demo|${role}`,
          email: `demo.${role}@mira.local`,
          name: `Demo ${role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User'}`,
          role: role as any,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      };
      setUserProfile(mockProfile);
      
      // Redirect to appropriate dashboard
      if (role === 'student') {
        setLocation('/student-dashboard');
      } else if (role === 'teacher') {
        setLocation('/teacher-dashboard');
      }
      return;
    }

    if (role) {
      sessionStorage.setItem('requestedRole', role);
    }
    
    try {
      // Only now do we start the Auth0 authentication flow
      const appState = role ? { role } : undefined;
      const authParams: any = {
        redirect_uri: window.location.origin,
        audience: auth0Config.audience,
        scope: auth0Config.scope,
      };
      
      // Force account selection to allow choosing different Google accounts
      if (forceAccountSelection) {
        authParams.prompt = 'select_account';
      }
      
      await loginWithRedirect({
        appState,
        authorizationParams: authParams,
      });
    } catch (error) {
      console.error('Login redirect failed:', error);
      setAuthError(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const logout = async () => {
    if (!isAuth0Configured()) {
      // For demo mode, just clear the mock profile
      setUserProfile(null);
      setLocation('/');
      return;
    }

    try {
      // Call server logout to clear memory store
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: auth0Config.audience,
          scope: auth0Config.scope,
        },
      });
      
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.log('Server logout call failed:', error);
      // Continue with logout anyway
    }

    auth0Logout({ 
      logoutParams: { 
        returnTo: window.location.origin 
      } 
    });
    setUserProfile(null);
  };

  const forceLogout = () => {
    if (!isAuth0Configured()) {
      setUserProfile(null);
      setLocation('/');
      return;
    }

    // Force logout with federated logout to clear Google session too
    auth0Logout({ 
      logoutParams: { 
        returnTo: window.location.origin,
        federated: true // This clears the Google session too
      } 
    });
    setUserProfile(null);
  };

  const getAccessToken = async (): Promise<string> => {
    if (!isAuth0Configured()) {
      return 'demo-token';
    }

    try {
      return await getAccessTokenSilently({
        authorizationParams: {
          audience: auth0Config.audience,
          scope: auth0Config.scope,
        },
      });
    } catch (error) {
      console.error('Error getting access token:', error);
      if ((error as any)?.error === 'login_required') {
        // Don't automatically redirect - just return empty string
        // User needs to explicitly click login button
        console.log('Login required - user needs to click login button');
        return '';
      } else {
        setAuthError(`Token error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      return '';
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (!isAuth0Configured()) {
      return;
    }

    // Only refresh profile if explicitly requested and user is authenticated
    if (isAuthenticated && user && sessionStorage.getItem('requestedRole')) {
      setIsLoadingProfile(true);
      try {
        const profile = await fetchUserProfile(sessionStorage.getItem('requestedRole') || undefined);
        setUserProfile(profile);
        sessionStorage.removeItem('requestedRole');
      } catch (error) {
        console.error('Error refreshing profile:', error);
        setAuthError(`Refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoadingProfile(false);
      }
    }
  };

  const contextValue: AuthContextType = {
    user,
    userProfile,
    // Consider authenticated if Auth0 says so AND we have a user profile, or if in demo mode
    isAuthenticated: isAuth0Configured() ? (isAuthenticated && !!userProfile) : !!userProfile,
    isLoading: auth0Loading || isLoadingProfile,
    login,
    logout,
    forceLogout,
    getAccessToken,
    refreshProfile,
    authError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;