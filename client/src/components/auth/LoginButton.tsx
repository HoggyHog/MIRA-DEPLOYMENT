import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, GraduationCap, UserCheck, BookOpen } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

const LoginButton: React.FC = () => {
  const { login, forceLogout, isLoading, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-md w-full space-y-6 p-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Mira</h1>
          <p className="text-gray-600">Powered by Centum AI</p>
        </div>

        <div className="space-y-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Student Login</CardTitle>
                  <CardDescription>
                    Access your personalized learning dashboard
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => login('student')}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In as Student
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-200">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Teacher Login</CardTitle>
                  <CardDescription>
                    Manage your classroom and students
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => login('teacher')}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In as Teacher
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-3">
          <p className="text-sm text-gray-500">
            Secure authentication powered by Auth0
          </p>
          {isAuthenticated && (
            <Button 
              onClick={forceLogout}
              variant="outline"
              className="text-sm"
            >
              Switch Account / Sign Out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginButton;