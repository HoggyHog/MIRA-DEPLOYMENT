import { Button } from '@/components/ui/button';
import React from 'react';
import { useAuth } from '@/providers/AuthProvider';

interface RoleBasedLoginButtonProps {
  role: 'student' | 'teacher';
  className?: string;
  children: React.ReactNode;
}

const RoleBasedLoginButton: React.FC<RoleBasedLoginButtonProps> = ({ role, className, children }) => {
  const { login, isLoading } = useAuth();

  const handleClick = () => {
    login(role);
  };

  return (
    <Button 
      className={className} 
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? 'Signing In...' : children}
    </Button>
  );
};

export default RoleBasedLoginButton;