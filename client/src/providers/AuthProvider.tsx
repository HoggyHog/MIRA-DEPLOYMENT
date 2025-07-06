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
  login: (role?: string) => void;
  logout: () => void;
  getAccessToken: () => Promise<string>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  getAccessToken: async () => "",
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Auth0 provider
const Auth0AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    user, 
    isAuthenticated, 
    isLoading: auth0Loading, 
    loginWithRedirect, 
    logout: auth0Logout,
    getAccessTokenSilently 
  } = useAuth0();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [, setLocation] = useLocation();

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
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const profile = await response.json();
        return profile;
      } else {
        console.error('Failed to fetch user profile:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Load user profile when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && !userProfile && !isLoadingProfile) {
      setIsLoadingProfile(true);
      fetchUserProfile(sessionStorage.getItem('requestedRole') || undefined)
        .then((profile) => {
          setUserProfile(profile);
          sessionStorage.removeItem('requestedRole');
          
          // Redirect based on role after successful login
          if (profile?.user?.role) {
            const role = profile.user.role;
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
        })
        .finally(() => {
          setIsLoadingProfile(false);
        });
    }
  }, [isAuthenticated, user, userProfile, isLoadingProfile, setLocation]);

  // Store chosen role so we can send it after redirect
  const login = (role?: string) => {
    if (role) {
      sessionStorage.setItem('requestedRole', role);
    }
    const appState = role ? { role } : undefined;
    loginWithRedirect({
      appState,
      authorizationParams: {
        redirect_uri: window.location.origin,
      },
    });
  };

  const logout = () => {
    auth0Logout({ 
      logoutParams: { 
        returnTo: window.location.origin 
      } 
    });
    setUserProfile(null);
  };

  const getAccessToken = async (): Promise<string> => {
    try {
      return await getAccessTokenSilently({
        authorizationParams: {
          audience: auth0Config.audience,
          scope: auth0Config.scope,
        },
      });
    } catch (error) {
      if ((error as any)?.error === 'login_required') {
        // Session has expired or user cleared cookies – force interactive login once
        try {
          await loginWithRedirect({
            authorizationParams: {
              audience: auth0Config.audience,
              scope: auth0Config.scope,
              redirect_uri: window.location.origin,
            },
          });
        } catch (e) {
          console.error('Redirect login also failed:', e);
        }
      } else {
        console.error('Error getting access token:', error);
      }
      return '';
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (isAuthenticated && user) {
      setIsLoadingProfile(true);
      try {
        const profile = await fetchUserProfile(sessionStorage.getItem('requestedRole') || undefined);
        setUserProfile(profile);
          sessionStorage.removeItem('requestedRole');
      } catch (error) {
        console.error('Error refreshing profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    }
  };

  const contextValue: AuthContextType = {
    user,
    userProfile,
    isAuthenticated,
    isLoading: auth0Loading || isLoadingProfile,
    login,
    logout,
    getAccessToken,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Main AuthProvider component using Auth0
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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