import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

interface LogoutButtonProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  variant = 'ghost', 
  size = 'sm', 
  className = '' 
}) => {
  const { logout } = useAuth();

  return (
    <Button
      onClick={logout}
      variant={variant}
      size={size}
      className={className}
    >
      <LogOut className="w-4 h-4 mr-2" />
      Sign Out
    </Button>
  );
};

export default LogoutButton;