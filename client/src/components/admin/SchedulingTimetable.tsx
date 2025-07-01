
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, BookOpen } from 'lucide-react';

export const SchedulingTimetable: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Scheduling & Timetable Management</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Classes Today</p>
                <p className="text-2xl font-bold">156</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Free Periods</p>
                <p className="text-2xl font-bold">24</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Teachers Active</p>
                <p className="text-2xl font-bold">84</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Subjects</p>
                <p className="text-2xl font-bold">18</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Automated Scheduling System</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Intelligent timetable management with conflict detection and optimization.</p>
          <div className="flex space-x-2 mt-4">
            <Button>Generate Timetable</Button>
            <Button variant="outline">View Schedule</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
