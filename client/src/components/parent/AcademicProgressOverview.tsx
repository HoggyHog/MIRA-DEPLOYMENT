
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Target, Award, AlertCircle } from 'lucide-react';

interface AcademicProgressOverviewProps {
  childName: string;
}

export const AcademicProgressOverview = ({ childName }: AcademicProgressOverviewProps) => {
  const subjectGrades = [
    { subject: 'Mathematics', current: 92, target: 95, trend: 'up' },
    { subject: 'English', current: 88, target: 90, trend: 'up' },
    { subject: 'Science', current: 85, target: 88, trend: 'stable' },
    { subject: 'History', current: 82, target: 85, trend: 'down' },
    { subject: 'Geography', current: 90, target: 92, trend: 'up' }
  ];

  const monthlyProgress = [
    { month: 'Jan', score: 78 },
    { month: 'Feb', score: 82 },
    { month: 'Mar', score: 85 },
    { month: 'Apr', score: 88 },
    { month: 'May', score: 87 }
  ];

  const recentTests = [
    { subject: 'Mathematics', score: 95, maxScore: 100, date: '2024-01-20', grade: 'A+' },
    { subject: 'English', score: 88, maxScore: 100, date: '2024-01-18', grade: 'A' },
    { subject: 'Science', score: 85, maxScore: 100, date: '2024-01-15', grade: 'A' }
  ];

  const overallGPA = 3.8;
  const classRank = 5;
  const totalStudents = 45;

  return (
    <div className="space-y-6">
      {/* Overall Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Overall GPA</p>
                <p className="text-2xl font-bold">{overallGPA}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Class Rank</p>
                <p className="text-2xl font-bold">{classRank} / {totalStudents}</p>
              </div>
              <Target className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Attendance</p>
                <p className="text-2xl font-bold">96%</p>
              </div>
              <Award className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Improvement Areas</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <CardDescription>Current scores vs target goals</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectGrades}>
                  <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="current" fill="#3b82f6" name="Current Score" />
                  <Bar dataKey="target" fill="#10b981" name="Target Score" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Progress Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Progress Trend</CardTitle>
            <CardDescription>Average score over the last 5 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyProgress}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Subject Details */}
      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Performance</CardTitle>
          <CardDescription>Detailed breakdown of {childName}'s academic performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subjectGrades.map((subject, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{subject.subject}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold">{subject.current}%</span>
                      <Badge variant={subject.trend === 'up' ? 'default' : subject.trend === 'down' ? 'destructive' : 'secondary'}>
                        {subject.trend === 'up' ? '↗' : subject.trend === 'down' ? '↘' : '→'}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={subject.current} className="mb-1" />
                  <p className="text-sm text-gray-600">Target: {subject.target}%</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Test Results</CardTitle>
          <CardDescription>Latest test performances across subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTests.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{test.subject}</h4>
                  <p className="text-sm text-gray-600">{test.date}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold">{test.score}/{test.maxScore}</span>
                    <Badge variant={test.score >= 90 ? 'default' : test.score >= 80 ? 'secondary' : 'destructive'}>
                      {test.grade}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{((test.score / test.maxScore) * 100).toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
