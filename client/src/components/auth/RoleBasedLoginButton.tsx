import { Button } from '@/components/ui/button';
import React from 'react';

interface RoleBasedLoginButtonProps {
  role: 'student' | 'teacher';
  className?: string;
  children: React.ReactNode;
}

const RoleBasedLoginButton: React.FC<RoleBasedLoginButtonProps> = ({ className, children }) => (
  <Button className={className}>
    {children}
  </Button>
);

export default RoleBasedLoginButton;