
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Switch to Ant Design components for UI enhancements
import { Tabs as AntTabs, Badge as AntBadge, Tag } from 'antd';
import { TeacherNavigation } from '@/components/TeacherNavigation';
import { LecturePreparation } from '@/components/teacher/LecturePreparation';
import { ClassroomManagement } from '@/components/teacher/ClassroomManagement';
import { DoubtResolution } from '@/components/teacher/DoubtResolution';
import { AssignmentInterface } from '@/components/teacher/AssignmentInterface';
import { StudentAnalytics } from '@/components/teacher/StudentAnalytics';
import { ScheduleAttendance } from '@/components/teacher/ScheduleAttendance';
import { AIExamGenerator } from '@/components/teacher/AIExamGenerator';
import { DocumentStateProvider } from '@/contexts/DocumentStateContext';
import PracticePlaygroundDemo from '@/components/student/PracticePlaygroundDemo';
import { SavedContent } from '@/components/teacher/SavedContent';
import { useAuth } from '@/providers/AuthProvider';
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
  Save,
  Brain,
  Settings
} from 'lucide-react';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('ai-features');
  const { userProfile } = useAuth();
  const [notifications] = useState([
    { id: 1, type: 'doubt', message: 'New doubt from Sarah in Math', time: '2 min ago' },
    { id: 2, type: 'assignment', message: 'Assignment submissions due today', time: '1 hour ago' },
    { id: 3, type: 'meeting', message: 'Parent meeting at 3 PM', time: '2 hours ago' }
  ]);

  // Get user info from auth context
  const teacherName = userProfile?.user?.name || userProfile?.user?.first_name || 'Teacher';
  const teacherSubject = userProfile?.profile?.subjects?.[0] || 'Subject';
  const teacherDepartment = userProfile?.profile?.department || 'Department';

  return (
    <DocumentStateProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <TeacherNavigation />
      
      <div className="container mx-auto px-4 py-6">
        {/* Clean Header Card */}
        <Card className="mb-6 bg-gradient-to-r from-blue-600 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
                  <p className="opacity-90">{teacherName} • {teacherSubject} • {teacherDepartment}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Toggle Tabs */}
        <div className="mb-6">
          <AntTabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as string)}
            type="card"
            size="large"
            className="w-full"
          >
            <AntTabs.TabPane
              tab={
                <span className="flex items-center space-x-2 px-4">
                  <Brain className="w-5 h-5" />
                  <span>AI Features</span>
                </span>
              }
              key="ai-features"
            >
              {/* AI Features Content */}
              <div className="mt-6">
                <AntTabs
                  type="line"
                  className="space-y-4"
                >
                  <AntTabs.TabPane
                    tab={
                      <span className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4" />
                        <span className="hidden md:inline">Lecture</span>
                      </span>
                    }
                    key="lecture"
                  >
                    <LecturePreparation />
                  </AntTabs.TabPane>

                  <AntTabs.TabPane
                    tab={
                      <span className="flex items-center space-x-2">
                        <Wand2 className="w-4 h-4" />
                        <span className="hidden md:inline">AI Exam</span>
                      </span>
                    }
                    key="ai-exam"
                  >
                    <AIExamGenerator />
                  </AntTabs.TabPane>

                  <AntTabs.TabPane
                    tab={
                      <span className="flex items-center space-x-2">
                        <Target className="w-4 h-4" />
                        <span className="hidden md:inline">Practice</span>
                      </span>
                    }
                    key="practice"
                  >
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
                  </AntTabs.TabPane>

                  <AntTabs.TabPane
                    tab={
                      <span className="flex items-center space-x-2">
                        <Save className="w-4 h-4" />
                        <span className="hidden md:inline">Saved</span>
                      </span>
                    }
                    key="saved"
                  >
                    <SavedContent />
                  </AntTabs.TabPane>
                </AntTabs>
              </div>
            </AntTabs.TabPane>

            <AntTabs.TabPane
              tab={
                <span className="flex items-center space-x-2 px-4">
                  <Settings className="w-5 h-5" />
                  <span>Logistics</span>
                </span>
              }
              key="logistics"
            >
              {/* Logistics Content */}
              <div className="mt-6">
                <AntTabs
                  type="line"
                  className="space-y-4"
                >
                  <AntTabs.TabPane
                    tab={
                      <span className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span className="hidden md:inline">Classroom</span>
                      </span>
                    }
                    key="classroom"
                  >
                    <ClassroomManagement />
                  </AntTabs.TabPane>

                  <AntTabs.TabPane
                    tab={
                      <span className="flex items-center space-x-2">
                        <HelpCircle className="w-4 h-4" />
                        <span className="hidden md:inline">Doubts</span>
                      </span>
                    }
                    key="doubts"
                  >
                    <DoubtResolution />
                  </AntTabs.TabPane>

                  <AntTabs.TabPane
                    tab={
                      <span className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span className="hidden md:inline">Assignments</span>
                      </span>
                    }
                    key="assignments"
                  >
                    <AssignmentInterface />
                  </AntTabs.TabPane>

                  <AntTabs.TabPane
                    tab={
                      <span className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span className="hidden md:inline">Schedule</span>
                      </span>
                    }
                    key="schedule"
                  >
                    <ScheduleAttendance />
                  </AntTabs.TabPane>

                  <AntTabs.TabPane
                    tab={
                      <span className="flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4" />
                        <span className="hidden md:inline">Analytics</span>
                      </span>
                    }
                    key="analytics"
                  >
                    <StudentAnalytics />
                  </AntTabs.TabPane>
                </AntTabs>
              </div>
            </AntTabs.TabPane>
          </AntTabs>
        </div>

        {/* Right Sidebar - Only show when on Logistics tab */}
        {activeTab === 'logistics' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {/* Content will be handled by the logistics tabs above */}
            </div>
            
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
                          <Tag color="blue">Doubt</Tag>
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
        )}

        {/* Full Width Layout for AI Features */}
        {activeTab === 'ai-features' && (
          <div className="w-full">
            {/* Content will be handled by the AI features tabs above */}
          </div>
        )}
      </div>
    </div>
    </DocumentStateProvider>
  );
};

export default TeacherDashboard;
