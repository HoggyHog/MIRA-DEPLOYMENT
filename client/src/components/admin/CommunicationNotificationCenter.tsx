
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Bell, Send, Users } from 'lucide-react';

export const CommunicationNotificationCenter: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Communication & Notification Center</h2>
        <Button>
          <Send className="w-4 h-4 mr-2" />
          Send Notification
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Messages Sent</p>
                <p className="text-2xl font-bold">1,234</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Notifications</p>
                <p className="text-2xl font-bold">456</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Recipients</p>
                <p className="text-2xl font-bold">1,336</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Send className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Delivery Rate</p>
                <p className="text-2xl font-bold">99.2%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Communications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Fee payment reminder</p>
                <p className="text-sm text-gray-600">Sent to 245 parents</p>
              </div>
              <Badge variant="default">Delivered</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Parent-teacher meeting notice</p>
                <p className="text-sm text-gray-600">Sent to all parents</p>
              </div>
              <Badge variant="default">Delivered</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
