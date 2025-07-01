
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ParentNavigation } from '@/components/ParentNavigation';
import { AcademicProgressOverview } from '@/components/parent/AcademicProgressOverview';
import { AttendanceTracker } from '@/components/parent/AttendanceTracker';
import { FeePaymentPortal } from '@/components/parent/FeePaymentPortal';
import { CommunicationCenter } from '@/components/parent/CommunicationCenter';
import { ExamScheduleResults } from '@/components/parent/ExamScheduleResults';
import { ExtracurricularTracker } from '@/components/parent/ExtracurricularTracker';
import { AIProgressAssistant } from '@/components/parent/AIProgressAssistant';
import { Bell, GraduationCap, TrendingUp, Calendar, CreditCard, MessageSquare, Trophy } from 'lucide-react';

const ParentDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock child data
  const childInfo = {
    name: 'Emma Johnson',
    class: 'Grade 7-A',
    rollNumber: '2024-007',
    photo: '/placeholder.svg'
  };

  const notifications = [
    { type: 'urgent', message: 'Fee payment due in 3 days' },
    { type: 'info', message: 'Parent-teacher meeting scheduled' },
    { type: 'success', message: 'Emma scored 95% in Math test' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <ParentNavigation />
      
      <div className="container mx-auto px-4 py-6">
        {/* Child Info Header */}
        <Card className="mb-6 bg-gradient-to-r from-blue-500 to-green-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{childInfo.name}</h1>
                <p className="opacity-90">{childInfo.class} • Roll No: {childInfo.rollNumber}</p>
              </div>
              <div className="ml-auto">
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <Badge variant="destructive">{notifications.length}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Notifications */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {notifications.map((notification, index) => (
            <Card key={index} className={`border-l-4 ${
              notification.type === 'urgent' ? 'border-l-red-500 bg-red-50' :
              notification.type === 'success' ? 'border-l-green-500 bg-green-50' :
              'border-l-blue-500 bg-blue-50'
            }`}>
              <CardContent className="p-4">
                <p className="text-sm font-medium">{notification.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="fees" className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Fees</span>
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger value="exams" className="flex items-center space-x-2">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">Exams</span>
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center space-x-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Activities</span>
            </TabsTrigger>
            <TabsTrigger value="ai-assistant" className="flex items-center space-x-2">
              <span className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded text-white text-xs font-bold flex items-center justify-center">AI</span>
              <span className="hidden sm:inline">AI Helper</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AcademicProgressOverview childName={childInfo.name} />
          </TabsContent>

          <TabsContent value="attendance">
            <AttendanceTracker childName={childInfo.name} />
          </TabsContent>

          <TabsContent value="fees">
            <FeePaymentPortal childName={childInfo.name} />
          </TabsContent>

          <TabsContent value="communication">
            <CommunicationCenter childName={childInfo.name} />
          </TabsContent>

          <TabsContent value="exams">
            <ExamScheduleResults childName={childInfo.name} />
          </TabsContent>

          <TabsContent value="activities">
            <ExtracurricularTracker childName={childInfo.name} />
          </TabsContent>

          <TabsContent value="ai-assistant">
            <AIProgressAssistant childName={childInfo.name} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ParentDashboard;
