
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeacherNavigation } from '@/components/TeacherNavigation';
import { LecturePreparation } from '@/components/teacher/LecturePreparation';
import { ClassroomManagement } from '@/components/teacher/ClassroomManagement';
import { DoubtResolution } from '@/components/teacher/DoubtResolution';
import { AssignmentInterface } from '@/components/teacher/AssignmentInterface';
import { StudentAnalytics } from '@/components/teacher/StudentAnalytics';
import { ScheduleAttendance } from '@/components/teacher/ScheduleAttendance';
import { TeacherQuickActions } from '@/components/teacher/TeacherQuickActions';
import { AIExamGenerator } from '@/components/teacher/AIExamGenerator';
import { DocumentStateProvider } from '@/contexts/DocumentStateContext';
import PracticePlaygroundDemo from '@/components/student/PracticePlaygroundDemo';
import { SavedContent } from '@/components/teacher/SavedContent';
import { 
  BookOpen, 
  Users, 
  HelpCircle, 
  FileText, 
  BarChart3, 
  Calendar,
  Bell,
  Clock,
  CheckSquare,
  Wand2,
  Target,
  Save
} from 'lucide-react';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('practice');
  const [notifications] = useState([
    { id: 1, type: 'doubt', message: 'New doubt from Sarah in Math', time: '2 min ago' },
    { id: 2, type: 'assignment', message: 'Assignment submissions due today', time: '1 hour ago' },
    { id: 3, type: 'meeting', message: 'Parent meeting at 3 PM', time: '2 hours ago' }
  ]);

  const teacherInfo = {
    name: 'Dr. Maria Rodriguez',
    subject: 'Mathematics & Physics',
    classes: ['Grade 10-A', 'Grade 10-B', 'Grade 11-A'],
    experience: '8 years'
  };

  return (
    <DocumentStateProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <TeacherNavigation />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header Card */}
        <Card className="mb-6 bg-gradient-to-r from-blue-600 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Welcome to Mira by Centum AI</h1>
                  <p className="opacity-90">{teacherInfo.name} • {teacherInfo.subject} • {teacherInfo.experience}</p>
                  <p className="text-sm opacity-75">Classes: {teacherInfo.classes.join(', ')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm opacity-75">Today's Schedule</p>
                  <p className="font-semibold">6 Classes • 2 Meetings</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <Badge variant="destructive">{notifications.length}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Bar */}
        <TeacherQuickActions />

        {/* Split Screen Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-9 bg-white shadow-sm">
                <TabsTrigger value="lecture" className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden md:inline">Lecture</span>
                </TabsTrigger>
                <TabsTrigger value="classroom" className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span className="hidden md:inline">Classroom</span>
                </TabsTrigger>
                <TabsTrigger value="doubts" className="flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4" />
                  <span className="hidden md:inline">Doubts</span>
                </TabsTrigger>
                <TabsTrigger value="assignments" className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span className="hidden md:inline">Assignments</span>
                </TabsTrigger>
                <TabsTrigger value="ai-exam" className="flex items-center space-x-2">
                  <Wand2 className="w-4 h-4" />
                  <span className="hidden md:inline">AI Exam</span>
                </TabsTrigger>
                <TabsTrigger value="practice" className="flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span className="hidden md:inline">Practice</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden md:inline">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="schedule" className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span className="hidden md:inline">Schedule</span>
                </TabsTrigger>
                <TabsTrigger value="saved" className="flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span className="hidden md:inline">Saved</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="lecture">
                <LecturePreparation />
              </TabsContent>
              
              <TabsContent value="classroom">
                <ClassroomManagement />
              </TabsContent>
              
              <TabsContent value="doubts">
                <DoubtResolution />
              </TabsContent>
              
              <TabsContent value="assignments">
                <AssignmentInterface />
              </TabsContent>
              
              <TabsContent value="ai-exam">
                <AIExamGenerator />
              </TabsContent>
              
              <TabsContent value="practice">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="w-5 h-5" />
                        <span>Practice Playground</span>
                      </CardTitle>
                      <CardDescription>
                        Analyze student practice responses and provide detailed feedback. Upload ideal answers and student responses to get AI-powered analysis.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <PracticePlaygroundDemo />
                </div>
              </TabsContent>
              
              <TabsContent value="analytics">
                <StudentAnalytics />
              </TabsContent>
              
              <TabsContent value="schedule">
                <ScheduleAttendance />
              </TabsContent>
              
              <TabsContent value="saved">
                <SavedContent />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Notifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                      </div>
                      {notification.type === 'doubt' && (
                        <Badge variant="secondary">Doubt</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Today's Schedule</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-l-blue-500">
                    <p className="font-medium">Math - Grade 10A</p>
                    <p className="text-sm text-gray-600">9:00 AM - 10:00 AM</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border-l-4 border-l-green-500">
                    <p className="font-medium">Physics - Grade 11A</p>
                    <p className="text-sm text-gray-600">11:00 AM - 12:00 PM</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-l-yellow-500">
                    <p className="font-medium">Parent Meeting</p>
                    <p className="text-sm text-gray-600">3:00 PM - 4:00 PM</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Classes Today</span>
                  <span className="font-bold text-blue-600">6</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending Doubts</span>
                  <span className="font-bold text-red-600">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Assignments to Grade</span>
                  <span className="font-bold text-orange-600">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Attendance Rate</span>
                  <span className="font-bold text-green-600">94%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </DocumentStateProvider>
  );
};

export default TeacherDashboard;
