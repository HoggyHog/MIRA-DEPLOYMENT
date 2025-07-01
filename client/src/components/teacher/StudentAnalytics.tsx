
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users,
  Award,
  AlertTriangle
} from 'lucide-react';

export const StudentAnalytics = () => {
  const [selectedClass, setSelectedClass] = useState('Grade 10-A');
  
  const classPerformance = {
    average: 78.5,
    trend: 'up',
    totalStudents: 25,
    attendanceRate: 94.2,
    topPerformers: ['Alice Johnson', 'Charlie Brown', 'Diana Ross'],
    needsAttention: ['Bob Smith', 'Mike Wilson']
  };

  const subjectAnalytics = [
    { subject: 'Mathematics', average: 82, trend: 'up', improvement: '+5%' },
    { subject: 'Physics', average: 75, trend: 'down', improvement: '-2%' },
    { subject: 'Chemistry', average: 80, trend: 'up', improvement: '+3%' }
  ];

  const studentDetails = [
    {
      name: 'Alice Johnson',
      overallGrade: 'A',
      average: 92,
      attendance: 98,
      assignments: '15/15',
      status: 'excellent'
    },
    {
      name: 'Bob Smith',
      overallGrade: 'C',
      average: 68,
      attendance: 85,
      assignments: '12/15',
      status: 'needs_attention'
    },
    {
      name: 'Charlie Brown',
      overallGrade: 'A-',
      average: 88,
      attendance: 95,
      assignments: '14/15',
      status: 'good'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'needs_attention': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Class Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Class Average</p>
                <p className="text-2xl font-bold flex items-center">
                  {classPerformance.average}%
                  {classPerformance.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-600 ml-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600 ml-1" />
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">{classPerformance.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold">{classPerformance.attendanceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Need Attention</p>
                <p className="text-2xl font-bold">{classPerformance.needsAttention.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subjectAnalytics.map((subject, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{subject.subject}</h4>
                  <Badge variant={subject.trend === 'up' ? 'default' : 'destructive'}>
                    {subject.improvement}
                  </Badge>
                </div>
                <p className="text-2xl font-bold mb-1">{subject.average}%</p>
                <div className="flex items-center text-sm">
                  {subject.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                  )}
                  <span className={subject.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                    {subject.trend === 'up' ? 'Improving' : 'Declining'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Individual Student Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Student Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {studentDetails.map((student, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg items-center">
                <div>
                  <p className="font-medium">{student.name}</p>
                  <Badge className={getStatusColor(student.status)}>
                    {student.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Overall Grade</p>
                  <p className="text-lg font-bold">{student.overallGrade}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Average</p>
                  <p className="text-lg font-bold">{student.average}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Attendance</p>
                  <p className="text-lg font-bold">{student.attendance}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Assignments</p>
                  <p className="text-lg font-bold">{student.assignments}</p>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">View Details</Button>
                  <Button size="sm" variant="outline">Contact Parent</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border-l-4 border-l-blue-500 rounded">
              <p className="font-medium text-blue-800">Class Performance Insight</p>
              <p className="text-blue-700">Mathematics scores have improved by 5% this month. Consider maintaining current teaching methodology.</p>
            </div>
            <div className="p-4 bg-yellow-50 border-l-4 border-l-yellow-500 rounded">
              <p className="font-medium text-yellow-800">Attention Required</p>
              <p className="text-yellow-700">Bob Smith and Mike Wilson need additional support in Physics. Consider one-on-one sessions.</p>
            </div>
            <div className="p-4 bg-green-50 border-l-4 border-l-green-500 rounded">
              <p className="font-medium text-green-800">Success Pattern</p>
              <p className="text-green-700">Students who attend extra help sessions show 15% better performance. Encourage more participation.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
