import React, { createContext, useContext } from "react";

const AuthContext = createContext({
  user: { name: "Demo User", email: "demo@example.com", role: "student" },
  userProfile: null,
  isAuthenticated: true,
  isLoading: false,
  login: () => {},
  logout: () => {},
  getAccessToken: async () => "mock-token",
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthContext.Provider value={{
    user: { name: "Demo User", email: "demo@example.com", role: "student" },
    userProfile: null,
    isAuthenticated: true,
    isLoading: false,
    login: () => {},
    logout: () => {},
    getAccessToken: async () => "mock-token",
    refreshProfile: async () => {},
  }}>
    {children}
  </AuthContext.Provider>
);

export default AuthProvider;