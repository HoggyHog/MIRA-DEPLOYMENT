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
  return auth0Config.domain !== "dev-example.us.auth0.com" && 
         auth0Config.clientId !== "test-client-id" &&
         auth0Config.audience !== "https://mira-api.example.com";
};

// Auth0 provider
const Auth0AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  // Function to fetch user profile from backend
  const fetchUserProfile = async (roleParam?: string): Promise<UserProfile | null> => {
    if (!isAuthenticated || !user) return null;

    try {
      // Always request a token for our API audience so that Auth0 issues a proper Access Token
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
      setAuthError(`Profile fetch error: ${error.message}`);
      return null;
    }
  };

  // Load user profile when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && !userProfile && !isLoadingProfile && !authError) {
      console.log('Loading user profile for:', user);
      setIsLoadingProfile(true);
      fetchUserProfile(sessionStorage.getItem('requestedRole') || undefined)
        .then((profile) => {
          setUserProfile(profile);
          sessionStorage.removeItem('requestedRole');
          
          // Redirect based on role after successful login
          if (profile?.user?.role) {
            const role = profile.user.role;
            console.log('Redirecting to dashboard for role:', role);
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
          console.error('Failed to load user profile:', error);
          setAuthError(`Failed to load profile: ${error.message}`);
        })
        .finally(() => {
          setIsLoadingProfile(false);
        });
    }
  }, [isAuthenticated, user, userProfile, isLoadingProfile, setLocation, authError]);

  // Store chosen role so we can send it after redirect
  const login = (role?: string, forceAccountSelection = true) => {
    if (!isAuth0Configured()) {
      // For demo purposes when Auth0 is not configured, create a mock user profile
      console.log('Auth0 not configured, creating demo profile for role:', role);
      const mockProfile: UserProfile = {
        user: {
          id: `demo_${role}_${Date.now()}`,
          auth0_id: `demo|${role}`,
          email: `demo.${role}@mira.local`,
          name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
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
    const appState = role ? { role } : undefined;
    
    try {
      const authParams: any = {
        redirect_uri: window.location.origin,
        audience: auth0Config.audience,
        scope: auth0Config.scope,
      };
      
      // Force account selection to allow choosing different Google accounts
      if (forceAccountSelection) {
        authParams.prompt = 'select_account';
      }
      
      loginWithRedirect({
        appState,
        authorizationParams: authParams,
      });
    } catch (error) {
      console.error('Login redirect failed:', error);
      setAuthError(`Login failed: ${error.message}`);
    }
  };

  const logout = async () => {
    if (!isAuth0Configured()) {
      // For demo mode, just clear the mock profile
      setUserProfile(null);
      setLocation('/');
      return;
    }

    // Call server logout to clear memory store
    try {
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
        federated: '' // This clears the Google session too
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
        // Session has expired or user cleared cookies – force interactive login once
        try {
          await loginWithRedirect({
            authorizationParams: {
              audience: auth0Config.audience,
              scope: auth0Config.scope,
              redirect_uri: window.location.origin,
              prompt: 'select_account', // Force account selection on re-login too
            },
          });
        } catch (e) {
          console.error('Redirect login also failed:', e);
          setAuthError(`Re-login failed: ${e.message}`);
        }
      } else {
        setAuthError(`Token error: ${error.message}`);
      }
      return '';
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (!isAuth0Configured()) {
      return;
    }

    if (isAuthenticated && user) {
      setIsLoadingProfile(true);
      try {
        const profile = await fetchUserProfile(sessionStorage.getItem('requestedRole') || undefined);
        setUserProfile(profile);
        sessionStorage.removeItem('requestedRole');
      } catch (error) {
        console.error('Error refreshing profile:', error);
        setAuthError(`Refresh failed: ${error.message}`);
      } finally {
        setIsLoadingProfile(false);
      }
    }
  };

  const contextValue: AuthContextType = {
    user,
    userProfile,
    isAuthenticated: isAuth0Configured() ? isAuthenticated : !!userProfile,
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
  // If Auth0 is not configured, provide a simple context without Auth0
  if (!isAuth0Configured()) {
    console.log('Auth0 not configured, using demo mode');
    return (
      <Auth0AuthProvider>
        {children}
      </Auth0AuthProvider>
    );
  }

  return (
    <Auth0Provider
      cacheLocation="localstorage"
      useRefreshTokens={true}
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={{
        redirect_uri: auth0Config.redirectUri,
        audience: auth0Config.audience,
        scope: auth0Config.scope,
      }}
    >
      <Auth0AuthProvider>
        {children}
      </Auth0AuthProvider>
    </Auth0Provider>
  );
};

export default AuthProvider;