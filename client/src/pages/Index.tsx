import React from 'react';
import { Link } from 'wouter';
import { GraduationCap, Users, Heart, Settings, LogOut } from 'lucide-react';
import RoleBasedLoginButton from '@/components/auth/RoleBasedLoginButton';
import { useAuth } from '@/providers/AuthProvider';

const Index = () => {
  const { isAuthenticated, logout, userProfile } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Mira by Centum AI</span>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-gray-600">
                    Welcome, {userProfile?.user?.name || 'User'} ({userProfile?.user?.role})
                  </span>
                  <button
                    onClick={logout}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <RoleBasedLoginButton
                    role="student"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Student Login
                  </RoleBasedLoginButton>
                  <RoleBasedLoginButton
                    role="teacher"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Teacher Login
                  </RoleBasedLoginButton>
                  <Link 
                    href="/parent-dashboard"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Parent Login
                  </Link>
                  <Link 
                    href="/admin-dashboard"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Admin Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Welcome to <span className="text-blue-600">Mira by Centum AI</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Your comprehensive educational management system for students, teachers, parents, and administrators.
          </p>
          {isAuthenticated && (
            <div className="mt-6">
              <p className="text-sm text-gray-600">
                You are currently logged in. Use the logout button above to return to the demo.
              </p>
            </div>
          )}
        </div>

        {/* Feature Cards */}
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      For Students - Demo
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      Access your academic progress, homework, and more
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3">
              <div className="text-sm">
                <RoleBasedLoginButton
                  role="student"
                  className="font-medium text-blue-600 hover:text-blue-500 bg-transparent border-none p-0 h-auto"
                >
                  Go to Student Dashboard
                </RoleBasedLoginButton>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <GraduationCap className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      For Teachers - Demo
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      AI-powered lesson planning and classroom management
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3">
              <div className="text-sm">
                <RoleBasedLoginButton
                  role="teacher"
                  className="font-medium text-indigo-600 hover:text-indigo-500 bg-transparent border-none p-0 h-auto"
                >
                  Go to Teacher Dashboard
                </RoleBasedLoginButton>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Heart className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      For Parents - Demo
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      Monitor your child's progress and communicate with teachers
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3">
              <div className="text-sm">
                <Link href="/parent-dashboard" className="font-medium text-green-600 hover:text-green-500">
                  Go to Parent Dashboard
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Settings className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      For Administrators - Demo
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      Manage school operations with AI-powered insights
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3">
              <div className="text-sm">
                <Link href="/admin-dashboard" className="font-medium text-purple-600 hover:text-purple-500">
                  Go to Admin Dashboard
                </Link>
              </div>
            </div>
          </div>

          {/* Pilot Edition Cards */}
          <div className="bg-gradient-to-br from-blue-100 to-indigo-100 overflow-hidden shadow-lg rounded-lg border-2 border-blue-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <GraduationCap className="h-8 w-8 text-indigo-700" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-indigo-600 truncate flex items-center">
                      For Teachers - Pilot Edition
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded-full">NEW</span>
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      AI-powered exam generation and lesson planning
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-indigo-50 px-6 py-3">
              <div className="text-sm flex space-x-4">
                <RoleBasedLoginButton
                  role="teacher"
                  className="font-medium text-indigo-700 hover:text-indigo-600 bg-transparent border-none p-0 h-auto"
                >
                  Go to Teacher Dashboard
                </RoleBasedLoginButton>
                <span className="text-indigo-400">|</span>
                <Link 
                  href="/teacher-pilot" 
                  className="font-medium text-indigo-700 hover:text-indigo-600"
                >
                  Try Pilot Demo
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-100 to-cyan-100 overflow-hidden shadow-lg rounded-lg border-2 border-blue-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-cyan-700" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-cyan-600 truncate flex items-center">
                      For Students - Pilot Edition
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded-full">NEW</span>
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      AI-powered doubt solving and academic support
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-cyan-50 px-6 py-3">
              <div className="text-sm flex space-x-4">
                <RoleBasedLoginButton
                  role="student"
                  className="font-medium text-cyan-700 hover:text-cyan-600 bg-transparent border-none p-0 h-auto"
                >
                  Go to Student Dashboard
                </RoleBasedLoginButton>
                <span className="text-cyan-400">|</span>
                <Link 
                  href="/student-pilot" 
                  className="font-medium text-cyan-700 hover:text-cyan-600"
                >
                  Try Pilot Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
