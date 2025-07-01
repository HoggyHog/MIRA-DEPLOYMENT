
import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Home, 
  Users, 
  FileText, 
  BarChart3, 
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import LogoutButton from '@/components/auth/LogoutButton';

export const TeacherNavigation = () => {
  const [location] = useLocation();
  const { user, userProfile } = useAuth();

  const displayName = userProfile?.user?.name || user?.name || 'Teacher';
  
  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/teacher-dashboard', label: 'Dashboard', icon: BookOpen },
    { path: '/student-dashboard', label: 'Students', icon: Users },
    { path: '/parent-dashboard', label: 'Parents', icon: Users },
    { path: '/admin-dashboard', label: 'Admin', icon: Settings }
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">Mira by Centum AI</span>
          </div>
          <div className="flex items-center space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location === item.path
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 hidden md:inline">{displayName}</span>
              <LogoutButton variant="outline" size="sm" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
