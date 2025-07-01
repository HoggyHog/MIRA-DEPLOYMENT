import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/AuthProvider';

const DebugAuth: React.FC = () => {
  const { user, userProfile, isAuthenticated, isLoading } = useAuth();

  // Remove debug component entirely since we're not in development mode
  return null;
};

export default DebugAuth; 