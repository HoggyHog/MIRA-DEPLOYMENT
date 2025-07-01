
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calendar, Clock, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';

const HomeworkSection = () => {
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const subjects = [
    { id: 'all', name: 'All Subjects' },
    { id: 'math', name: 'Mathematics' },
    { id: 'physics', name: 'Physics' },
    { id: 'chemistry', name: 'Chemistry' },
    { id: 'english', name: 'English' },
    { id: 'history', name: 'History' }
  ];

  const homework = [
    {
      id: 1,
      subject: 'Mathematics',
      title: 'Algebra Problem Set 3',
      description: 'Solve problems 1-15 from Chapter 4: Quadratic Equations. Show all work and include graphs where applicable.',
      assignedDate: '2024-01-10',
      dueDate: '2024-01-15',
      priority: 'high',
      status: 'pending',
      instructions: 'Use graph paper for plotting functions. Submit handwritten solutions.',
      attachments: ['problem_set_3.pdf']
    },
    {
      id: 2,
      subject: 'Physics',
      title: 'Newton\'s Laws Lab Report',
      description: 'Write a comprehensive lab report on the experiment conducted in class about Newton\'s Second Law.',
      assignedDate: '2024-01-08',
      dueDate: '2024-01-16',
      priority: 'medium',
      status: 'in_progress',
      instructions: 'Include hypothesis, procedure, observations, calculations, and conclusion. Minimum 3 pages.',
      attachments: ['lab_data.xlsx', 'report_template.docx']
    },
    {
      id: 3,
      subject: 'English',
      title: 'Essay: Climate Change Impact',
      description: 'Write a 500-word essay on the impact of climate change on global ecosystems.',
      assignedDate: '2024-01-05',
      dueDate: '2024-01-12',
      priority: 'medium',
      status: 'submitted',
      instructions: 'Use MLA format. Include at least 3 credible sources and proper citations.',
      attachments: []
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'secondary';
    }
  };

  const getDaysLeft = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredHomework = homework.filter(hw => {
    const subjectMatch = filterSubject === 'all' || hw.subject.toLowerCase() === filterSubject;
    const statusMatch = filterStatus === 'all' || hw.status === filterStatus;
    return subjectMatch && statusMatch;
  });

  const pendingHomework = homework.filter(hw => hw.status === 'pending');
  const submittedHomework = homework.filter(hw => hw.status === 'submitted');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Homework & Assignments</h2>
          <p className="text-gray-600">Track your assignments and submit work on time</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map(subject => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border border-purple-100">
          <TabsTrigger value="all">All Assignments</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingHomework.length})</TabsTrigger>
          <TabsTrigger value="submitted">Submitted ({submittedHomework.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredHomework.map((hw) => (
            <Card key={hw.id} className="bg-white/80 backdrop-blur-sm border border-purple-100 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{hw.title}</CardTitle>
                      <CardDescription className="flex items-center space-x-2">
                        <span>{hw.subject}</span>
                        <span>•</span>
                        <span>Assigned: {hw.assignedDate}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusColor(hw.status)}>
                      {hw.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant={getPriorityColor(hw.priority)}>
                      {hw.priority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">{hw.description}</p>
                
                {/* Due Date Info */}
                <div className="flex items-center justify-between bg-gray-50/80 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-600">Due: {hw.dueDate}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <span className={`text-sm font-medium ${
                      getDaysLeft(hw.dueDate) <= 1 ? 'text-red-600' : 
                      getDaysLeft(hw.dueDate) <= 3 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {getDaysLeft(hw.dueDate) > 0 ? `${getDaysLeft(hw.dueDate)} days left` : 'Overdue'}
                    </span>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50/80 rounded-lg p-3">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Instructions:
                  </h4>
                  <p className="text-blue-700 text-sm">{hw.instructions}</p>
                </div>

                {/* Attachments */}
                {hw.attachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-800 text-sm">Attachments:</h4>
                    <div className="flex flex-wrap gap-2">
                      {hw.attachments.map((attachment, index) => (
                        <Badge key={index} variant="outline" className="cursor-pointer hover:bg-gray-100">
                          <FileText className="w-3 h-3 mr-1" />
                          {attachment}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    {hw.status !== 'submitted' && (
                      <>
                        <Button size="sm" className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                          <Upload className="w-4 h-4 mr-2" />
                          Turn In
                        </Button>
                        <Button variant="outline" size="sm">
                          Save Draft
                        </Button>
                      </>
                    )}
                    {hw.status === 'submitted' && (
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Submitted</span>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingHomework.map((hw) => (
            <Card key={hw.id} className="bg-white/80 backdrop-blur-sm border border-red-200 hover:shadow-lg transition-shadow">
              {/* Similar structure as above but filtered for pending */}
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-red-700">{hw.title}</CardTitle>
                  <Badge variant="destructive">Urgent</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{hw.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Due: {hw.dueDate}</span>
                  <Button size="sm" className="bg-red-500 hover:bg-red-600">
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="submitted" className="space-y-4">
          {submittedHomework.map((hw) => (
            <Card key={hw.id} className="bg-white/80 backdrop-blur-sm border border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-green-700">{hw.title}</CardTitle>
                  <Badge variant="default">Completed</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{hw.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm">Submitted on time</span>
                  </div>
                  <Button variant="outline" size="sm">
                    View Submission
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HomeworkSection;
