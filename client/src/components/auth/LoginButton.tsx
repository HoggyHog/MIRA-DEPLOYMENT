import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, GraduationCap, Users } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

const LoginButton: React.FC = () => (
  <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white" size="lg">
    <div className="flex items-center">
      Sign In (Auth Bypassed)
    </div>
  </Button>
);

export default LoginButton;