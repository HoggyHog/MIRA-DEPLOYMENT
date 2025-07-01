
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  MessageCircle, 
  Calendar, 
  Clock, 
  FileText, 
  TrendingUp,
  Bell,
  Search,
  Upload,
  ChevronRight,
  Play,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import StudentNavigation from '@/components/StudentNavigation';
import NotesViewer from '@/components/NotesViewer';
import DoubtChat from '@/components/DoubtChat';
import PracticePlaygroundDemo from '@/components/student/PracticePlaygroundDemo';
import AITutorMira from '@/components/student/AITutorMira';
import HomeworkSection from '@/components/HomeworkSection';
import StudySchedule from '@/components/StudySchedule';
import ProgressAnalytics from '@/components/ProgressAnalytics';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const recentActivities = [
    { type: 'homework', subject: 'Mathematics', title: 'Algebra Problem Set 3', dueDate: '2024-01-15', status: 'pending' },
    { type: 'lecture', subject: 'Physics', title: 'Newton\'s Laws of Motion', date: '2024-01-12', status: 'completed' },
    { type: 'exam', subject: 'Chemistry', title: 'Midterm Exam', date: '2024-01-20', status: 'upcoming' }
  ];

  const upcomingDeadlines = [
    { subject: 'English', task: 'Essay: Climate Change', dueDate: '2024-01-16', priority: 'high' },
    { subject: 'History', task: 'Chapter 5 Questions', dueDate: '2024-01-18', priority: 'medium' },
    { subject: 'Biology', task: 'Lab Report', dueDate: '2024-01-22', priority: 'low' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <StudentNavigation />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Mira by Centum AI</h1>
          <p className="text-gray-600">Ready to continue your learning journey today, Alex?</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 bg-white/80 backdrop-blur-sm border border-purple-100">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Notes</TabsTrigger>
            <TabsTrigger value="doubts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Doubt Chat</TabsTrigger>
            <TabsTrigger value="practice-playground" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Practice</TabsTrigger>
            <TabsTrigger value="ai-tutor" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">AI Tutor</TabsTrigger>
            <TabsTrigger value="homework" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Homework</TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Schedule</TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <BookOpen className="w-5 h-5 mr-2" />
                        Today's Classes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">4</p>
                      <p className="text-blue-100 text-sm">2 completed, 2 remaining</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Assignments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">3</p>
                      <p className="text-green-100 text-sm">Due this week</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        Study Streak
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">12</p>
                      <p className="text-orange-100 text-sm">Days in a row!</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activities */}
                <Card className="bg-white/80 backdrop-blur-sm border border-purple-100">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-800">Recent Activities</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50/80 rounded-lg hover:bg-gray-100/80 transition-colors cursor-pointer">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            activity.type === 'homework' ? 'bg-blue-100 text-blue-600' :
                            activity.type === 'lecture' ? 'bg-green-100 text-green-600' :
                            'bg-orange-100 text-orange-600'
                          }`}>
                            {activity.type === 'homework' ? <FileText className="w-5 h-5" /> :
                             activity.type === 'lecture' ? <Play className="w-5 h-5" /> :
                             <Calendar className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{activity.title}</p>
                            <p className="text-sm text-gray-600">{activity.subject}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={activity.status === 'completed' ? 'default' : activity.status === 'pending' ? 'secondary' : 'destructive'}>
                            {activity.status}
                          </Badge>
                          <p className="text-sm text-gray-500 mt-1">
                            {activity.dueDate || activity.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* AI Chat Widget */}
                <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      AI Study Assistant
                    </CardTitle>
                    <CardDescription className="text-purple-100">
                      Ask me anything about your studies!
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30">
                      Start Chatting
                    </Button>
                  </CardContent>
                </Card>

                {/* Upcoming Deadlines */}
                <Card className="bg-white/80 backdrop-blur-sm border border-purple-100">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800 flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Upcoming Deadlines
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {upcomingDeadlines.map((deadline, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{deadline.task}</p>
                          <p className="text-xs text-gray-600">{deadline.subject}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={deadline.priority === 'high' ? 'destructive' : deadline.priority === 'medium' ? 'secondary' : 'default'} className="text-xs">
                            {deadline.priority}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{deadline.dueDate}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Weekly Progress */}
                <Card className="bg-white/80 backdrop-blur-sm border border-purple-100">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Weekly Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Mathematics</span>
                        <span className="font-medium">85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Physics</span>
                        <span className="font-medium">72%</span>
                      </div>
                      <Progress value={72} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">English</span>
                        <span className="font-medium">91%</span>
                      </div>
                      <Progress value={91} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes">
            <NotesViewer />
          </TabsContent>

          <TabsContent value="doubts">
            <DoubtChat />
          </TabsContent>

          <TabsContent value="practice-playground">
            <PracticePlaygroundDemo />
          </TabsContent>

          <TabsContent value="ai-tutor">
            <AITutorMira />
          </TabsContent>

          <TabsContent value="homework">
            <HomeworkSection />
          </TabsContent>

          <TabsContent value="schedule">
            <StudySchedule />
          </TabsContent>

          <TabsContent value="progress">
            <ProgressAnalytics />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard;
