
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AttendanceManagement } from '@/components/admin/AttendanceManagement';
import { LeaveApprovalWorkflow } from '@/components/admin/LeaveApprovalWorkflow';
import { FeeCollectionReporting } from '@/components/admin/FeeCollectionReporting';
import { SchedulingTimetable } from '@/components/admin/SchedulingTimetable';
import { StaffStudentRecords } from '@/components/admin/StaffStudentRecords';
import { CommunicationNotificationCenter } from '@/components/admin/CommunicationNotificationCenter';
import { AIAnalyticsDashboard } from '@/components/admin/AIAnalyticsDashboard';
import { SystemMonitoring } from '@/components/admin/SystemMonitoring';
import { UserManagement } from '@/components/admin/UserManagement';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  FileText, 
  MessageSquare, 
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Mock data for dashboard widgets
  const dashboardStats = {
    totalStudents: 1247,
    totalStaff: 89,
    attendanceRate: 94.2,
    pendingLeaves: 12,
    overduePayments: 8,
    activeAlerts: 3
  };

  const recentAlerts = [
    {
      type: 'warning',
      message: 'Math teacher absent for 3 consecutive days',
      time: '2 hours ago'
    },
    {
      type: 'critical',
      message: 'Unusual spike in student absences in Grade 9-B',
      time: '4 hours ago'
    },
    {
      type: 'info',
      message: 'Fee collection deadline approaching',
      time: '1 day ago'
    }
  ];

  const renderMainContent = () => {
    switch (activeModule) {
      case 'attendance':
        return <AttendanceManagement />;
      case 'leaves':
        return <LeaveApprovalWorkflow />;
      case 'fees':
        return <FeeCollectionReporting />;
      case 'scheduling':
        return <SchedulingTimetable />;
      case 'records':
        return <StaffStudentRecords />;
      case 'communication':
        return <CommunicationNotificationCenter />;
      case 'ai-analytics':
        return <AIAnalyticsDashboard />;
      case 'monitoring':
        return <SystemMonitoring />;
      case 'users':
        return <UserManagement />;
      default:
        return (
          <div className="space-y-6">
            {/* Dashboard Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Students</p>
                      <p className="text-2xl font-bold">{dashboardStats.totalStudents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Staff</p>
                      <p className="text-2xl font-bold">{dashboardStats.totalStaff}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm text-gray-600">Attendance Rate</p>
                      <p className="text-2xl font-bold">{dashboardStats.attendanceRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Pending Leaves</p>
                      <p className="text-2xl font-bold">{dashboardStats.pendingLeaves}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm text-gray-600">Overdue Payments</p>
                      <p className="text-2xl font-bold">{dashboardStats.overduePayments}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm text-gray-600">Active Alerts</p>
                      <p className="text-2xl font-bold">{dashboardStats.activeAlerts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Alerts & AI Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span>AI Alert System</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentAlerts.map((alert, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          alert.type === 'critical' ? 'bg-red-500' :
                          alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alert.message}</p>
                          <p className="text-xs text-gray-500">{alert.time}</p>
                        </div>
                        <Badge variant={alert.type === 'critical' ? 'destructive' : 'secondary'}>
                          {alert.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={() => setActiveModule('ai-analytics')}
                  >
                    View AI Analytics Dashboard
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="h-16 flex flex-col space-y-1"
                      onClick={() => setActiveModule('attendance')}
                    >
                      <Users className="h-5 w-5" />
                      <span className="text-xs">Attendance</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-16 flex flex-col space-y-1"
                      onClick={() => setActiveModule('leaves')}
                    >
                      <Calendar className="h-5 w-5" />
                      <span className="text-xs">Leave Approval</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-16 flex flex-col space-y-1"
                      onClick={() => setActiveModule('fees')}
                    >
                      <CreditCard className="h-5 w-5" />
                      <span className="text-xs">Fee Collection</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-16 flex flex-col space-y-1"
                      onClick={() => setActiveModule('communication')}
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span className="text-xs">Communication</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar 
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <header className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Administrative Control Panel
            </h1>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-600">
                System Online
              </Badge>
              <Button variant="outline" size="sm">
                Export Reports
              </Button>
            </div>
          </div>
        </header>
        
        <main className="p-6">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
