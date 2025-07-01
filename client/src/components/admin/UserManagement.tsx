
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCog, Users, Shield, Settings } from 'lucide-react';

export const UserManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">User Management</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">1,336</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserCog className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Teachers</p>
                <p className="text-2xl font-bold">89</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Students</p>
                <p className="text-2xl font-bold">1,247</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Access Control</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Manage user roles, permissions, and access levels across the system.</p>
          <div className="flex space-x-2 mt-4">
            <Button>Add New User</Button>
            <Button variant="outline">Manage Roles</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
