
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Send, 
  CheckSquare,
  Clock
} from 'lucide-react';

export const ClassroomManagement = () => {
  const [selectedClass, setSelectedClass] = useState('Grade 10-A');
  const [students] = useState([
    { id: 1, name: 'Alice Johnson', status: 'present', rollNo: '001' },
    { id: 2, name: 'Bob Smith', status: 'absent', rollNo: '002' },
    { id: 3, name: 'Charlie Brown', status: 'present', rollNo: '003' },
    { id: 4, name: 'Diana Ross', status: 'late', rollNo: '004' },
    { id: 5, name: 'Emma Wilson', status: 'present', rollNo: '005' }
  ]);
  
  const [leaveRequests] = useState([
    { id: 1, student: 'Bob Smith', reason: 'Medical appointment', date: '2024-01-15', status: 'pending' },
    { id: 2, student: 'Emma Wilson', reason: 'Family emergency', date: '2024-01-16', status: 'pending' }
  ]);

  const [feedback, setFeedback] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const sendFeedbackToParents = () => {
    // Mock function to send feedback
    console.log('Sending feedback to parents:', feedback);
    setFeedback('');
  };

  return (
    <div className="space-y-6">
      {/* Attendance Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5" />
            <span>Real-time Attendance - {selectedClass}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-gray-500">Roll: {student.rollNo}</p>
                </div>
                <Badge className={getStatusColor(student.status)}>
                  {student.status}
                </Badge>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div className="flex space-x-4 text-sm">
              <span className="text-green-600">Present: 3</span>
              <span className="text-red-600">Absent: 1</span>
              <span className="text-yellow-600">Late: 1</span>
            </div>
            <Button>
              <CheckSquare className="w-4 h-4 mr-2" />
              Mark Attendance Complete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leave Approval */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Leave Approval Requests</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaveRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{request.student}</p>
                  <p className="text-sm text-gray-600">{request.reason}</p>
                  <p className="text-xs text-gray-500">Date: {request.date}</p>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="text-green-600 border-green-600">
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 border-red-600">
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Parent Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="w-5 h-5" />
            <span>Send Feedback to Parents</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Write feedback about student performance, behavior, or any important updates..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
          />
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">Individual Student</Button>
              <Button variant="outline" size="sm">Entire Class</Button>
              <Button variant="outline" size="sm">Selected Students</Button>
            </div>
            <Button onClick={sendFeedbackToParents} disabled={!feedback.trim()}>
              <Send className="w-4 h-4 mr-2" />
              Send Feedback
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
