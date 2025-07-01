
import React from 'react';
import { Button } from '@/components/ui/button';
import { GraduationCap, Bell, Search, Settings, LogOut } from 'lucide-react';
import { useLocation } from 'wouter';

export const ParentNavigation = () => {
  const [, setLocation] = useLocation();

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-green-100 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setLocation('/')}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Mira by Centum AI</h1>
              <p className="text-sm text-gray-500">Parent Portal</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
            
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
            </Button>
            
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-green-400 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">M</span>
              </div>
              <span className="text-gray-700 font-medium hidden md:inline">Maria Johnson</span>
            </div>
            
            <Button variant="ghost" size="icon" onClick={() => setLocation('/')}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
