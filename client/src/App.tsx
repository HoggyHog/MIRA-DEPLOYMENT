import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { Router, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import AuthProvider, { useAuth } from "./providers/AuthProvider";
import LoginButton from "./components/auth/LoginButton";
import DebugAuth from "./components/DebugAuth";
import Index from "./pages/Index";
import StudentDashboard from "./pages/StudentDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherPilot from "./pages/TeacherPilot";
import StudentPilot from "./pages/StudentPilot";

// Component to handle protected routes that require authentication
const ProtectedRoute = ({ component: Component, ...props }: { component: React.ComponentType<any>; [key: string]: any }) => {
  const { isAuthenticated, isLoading, userProfile, authError } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth error if there is one
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{authError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginButton />;
  }

  // Show profile completion if user is authenticated but profile is not complete
  if (isAuthenticated && !userProfile?.user?.role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Complete Your Profile</h2>
          <p className="text-gray-600 mb-4">
            Please complete your profile setup to access the platform.
          </p>
          <p className="text-sm text-gray-500">
            You may need to refresh the page after completing your profile.
          </p>
        </div>
      </div>
    );
  }

  return <Component {...props} />;
};

const AppContent = () => {
  return (
    <>
      <Router>
        <Route path="/" component={Index} />
        {/* Public pilot routes - no authentication required */}
        <Route path="/teacher-pilot" component={TeacherPilot} />
        <Route path="/student-pilot" component={StudentPilot} />
        {/* Protected routes - authentication required */}
        <Route path="/student-dashboard" component={(props) => <ProtectedRoute component={StudentDashboard} {...props} />} />
        <Route path="/teacher-dashboard" component={(props) => <ProtectedRoute component={TeacherDashboard} {...props} />} />
        {/* Direct access routes - no authentication required */}
        <Route path="/parent-dashboard" component={ParentDashboard} />
        <Route path="/admin-dashboard" component={AdminDashboard} />
      </Router>
      <DebugAuth />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
