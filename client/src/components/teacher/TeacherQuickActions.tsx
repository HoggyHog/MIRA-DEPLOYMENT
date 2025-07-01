
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Users, 
  FileText, 
  Download,
  Send,
  Clock
} from 'lucide-react';

export const TeacherQuickActions = () => {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-3">
          <Button className="flex items-center space-x-2" size="sm">
            <Plus className="w-4 h-4" />
            <span>New Lesson Plan</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2" size="sm">
            <Users className="w-4 h-4" />
            <span>Take Attendance</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2" size="sm">
            <FileText className="w-4 h-4" />
            <span>Create Assignment</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2" size="sm">
            <Send className="w-4 h-4" />
            <span>Send Notice</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2" size="sm">
            <Download className="w-4 h-4" />
            <span>Export Reports</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2" size="sm">
            <Clock className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
