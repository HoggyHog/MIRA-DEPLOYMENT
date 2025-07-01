
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Server, Database, Wifi } from 'lucide-react';

export const SystemMonitoring: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">System Monitoring</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Monitor className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">System Status</p>
                <Badge variant="default">Online</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Server className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Server Load</p>
                <p className="text-2xl font-bold">23%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Database</p>
                <Badge variant="default">Healthy</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Wifi className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Network</p>
                <p className="text-2xl font-bold">99.9%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Real-time System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Monitor system performance, uptime, and security status in real-time.</p>
        </CardContent>
      </Card>
    </div>
  );
};
