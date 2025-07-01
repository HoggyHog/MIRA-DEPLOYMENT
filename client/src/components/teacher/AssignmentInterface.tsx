
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Plus, 
  Clock, 
  Users,
  CheckCircle,
  Download,
  Upload
} from 'lucide-react';

export const AssignmentInterface = () => {
  const [assignments] = useState([
    {
      id: 1,
      title: 'Quadratic Equations Worksheet',
      subject: 'Mathematics',
      class: 'Grade 10-A',
      dueDate: '2024-01-20',
      submissions: 15,
      totalStudents: 25,
      status: 'active'
    },
    {
      id: 2,
      title: 'Physics Lab Report',
      subject: 'Physics',
      class: 'Grade 11-A',
      dueDate: '2024-01-18',
      submissions: 20,
      totalStudents: 22,
      status: 'grading'
    }
  ]);

  const [submissions] = useState([
    {
      id: 1,
      student: 'Alice Johnson',
      assignment: 'Quadratic Equations Worksheet',
      submittedAt: '2024-01-15 10:30 AM',
      status: 'submitted',
      grade: null
    },
    {
      id: 2,
      student: 'Bob Smith',
      assignment: 'Physics Lab Report',
      submittedAt: '2024-01-16 2:15 PM',
      status: 'graded',
      grade: 'A-'
    }
  ]);

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    subject: '',
    class: '',
    description: '',
    dueDate: '',
    totalMarks: ''
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
          <TabsTrigger value="grading">Grading</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Active Assignments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{assignment.title}</h4>
                        <p className="text-sm text-gray-600">{assignment.subject} • {assignment.class}</p>
                      </div>
                      <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                        {assignment.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Due: {assignment.dueDate}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{assignment.submissions}/{assignment.totalStudents} submitted</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{Math.round((assignment.submissions/assignment.totalStudents)*100)}% completion</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">View Details</Button>
                      <Button size="sm" variant="outline">Send Reminder</Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Create New Assignment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Assignment Title</Label>
                  <Input
                    id="title"
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Chapter 5 Practice Problems"
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={newAssignment.subject}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div>
                  <Label htmlFor="class">Class</Label>
                  <Input
                    id="class"
                    value={newAssignment.class}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, class: e.target.value }))}
                    placeholder="e.g., Grade 10-A"
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="totalMarks">Total Marks</Label>
                  <Input
                    id="totalMarks"
                    type="number"
                    value={newAssignment.totalMarks}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, totalMarks: e.target.value }))}
                    placeholder="e.g., 100"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Assignment Description</Label>
                <Textarea
                  id="description"
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed instructions for the assignment..."
                  rows={4}
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Attach Files
                </Button>
                <Button variant="outline">Add Rubric</Button>
                <Button variant="outline">Set Reminder</Button>
              </div>
              
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grading">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Grading Interface</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div key={submission.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{submission.student}</h4>
                        <p className="text-sm text-gray-600">{submission.assignment}</p>
                        <p className="text-xs text-gray-500">Submitted: {submission.submittedAt}</p>
                      </div>
                      <div className="text-right">
                        {submission.grade ? (
                          <Badge variant="default">{submission.grade}</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline">View Submission</Button>
                      {!submission.grade && (
                        <Button size="sm">Grade Now</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
