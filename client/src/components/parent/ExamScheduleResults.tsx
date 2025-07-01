
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, GraduationCap, TrendingUp, Award } from 'lucide-react';

interface ExamScheduleResultsProps {
  childName: string;
}

export const ExamScheduleResults = ({ childName }: ExamScheduleResultsProps) => {
  const [selectedExam, setSelectedExam] = useState<string | null>(null);

  const upcomingExams = [
    {
      id: '1',
      subject: 'Mathematics',
      date: '2024-02-15',
      time: '10:00 AM - 12:00 PM',
      type: 'Mid-term',
      syllabus: 'Chapters 1-5: Algebra, Geometry basics',
      status: 'scheduled'
    },
    {
      id: '2',
      subject: 'English Literature',
      date: '2024-02-17',
      time: '9:00 AM - 11:00 AM',
      type: 'Mid-term',
      syllabus: 'Poems, Short stories, Grammar',
      status: 'scheduled'
    },
    {
      id: '3',
      subject: 'Science',
      date: '2024-02-20',
      time: '2:00 PM - 4:00 PM',
      type: 'Mid-term',
      syllabus: 'Physics: Motion, Chemistry: Atoms',
      status: 'scheduled'
    }
  ];

  const recentResults = [
    {
      id: '1',
      subject: 'Mathematics',
      examType: 'Unit Test 3',
      score: 95,
      maxScore: 100,
      grade: 'A+',
      date: '2024-01-20',
      rank: 2,
      classAverage: 78
    },
    {
      id: '2',
      subject: 'English',
      examType: 'Monthly Test',
      score: 88,
      maxScore: 100,
      grade: 'A',
      date: '2024-01-18',
      rank: 5,
      classAverage: 82
    },
    {
      id: '3',
      subject: 'Science',
      examType: 'Unit Test 3',
      score: 92,
      maxScore: 100,
      grade: 'A+',
      date: '2024-01-15',
      rank: 3,
      classAverage: 85
    }
  ];

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'bg-green-100 text-green-800';
      case 'A': return 'bg-blue-100 text-blue-800';
      case 'B+': return 'bg-yellow-100 text-yellow-800';
      case 'B': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700">3</p>
            <p className="text-sm text-blue-600">Upcoming Exams</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700">91.7%</p>
            <p className="text-sm text-green-600">Average Score</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-700">3</p>
            <p className="text-sm text-purple-600">Class Rank</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <GraduationCap className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-700">A</p>
            <p className="text-sm text-orange-600">Overall Grade</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming Exams</TabsTrigger>
          <TabsTrigger value="results">Recent Results</TabsTrigger>
          <TabsTrigger value="analysis">Performance Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Examinations</CardTitle>
              <CardDescription>Exam schedule for {childName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingExams.map((exam) => (
                  <div key={exam.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-lg">{exam.subject}</h4>
                          <Badge variant="outline">{exam.type}</Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><Calendar className="w-4 h-4 inline mr-2" />
                            {new Date(exam.date).toLocaleDateString()} at {exam.time}
                          </p>
                          <p><strong>Syllabus:</strong> {exam.syllabus}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-blue-100 text-blue-800">
                          {Math.ceil((new Date(exam.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" variant="outline">
                Download Exam Schedule PDF
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Recent Exam Results</CardTitle>
              <CardDescription>Latest examination performance for {childName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentResults.map((result) => (
                  <div key={result.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{result.subject}</h4>
                        <p className="text-sm text-gray-600">{result.examType} • {new Date(result.date).toLocaleDateString()}</p>
                      </div>
                      <Badge className={getGradeColor(result.grade)}>
                        {result.grade}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <p className="font-bold text-lg text-blue-700">{result.score}/{result.maxScore}</p>
                        <p className="text-blue-600">Score</p>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <p className="font-bold text-lg text-green-700">#{result.rank}</p>
                        <p className="text-green-600">Class Rank</p>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <p className="font-bold text-lg text-purple-700">{((result.score / result.maxScore) * 100).toFixed(1)}%</p>
                        <p className="text-purple-600">Percentage</p>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <p className="font-bold text-lg text-orange-700">{result.classAverage}%</p>
                        <p className="text-orange-600">Class Avg</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analysis</CardTitle>
              <CardDescription>AI-powered insights into {childName}'s exam performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">Strengths</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Consistently high performance in Mathematics (95% average)</li>
                  <li>• Strong improvement trend in Science subjects</li>
                  <li>• Above class average in all subjects</li>
                </ul>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-2">Areas for Improvement</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Focus on English literature analysis skills</li>
                  <li>• Practice more physics numerical problems</li>
                  <li>• Time management during exams</li>
                </ul>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Recommendations</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Schedule extra practice sessions for upcoming Math exam</li>
                  <li>• Join peer study groups for English literature</li>
                  <li>• Use practice papers for time management improvement</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
