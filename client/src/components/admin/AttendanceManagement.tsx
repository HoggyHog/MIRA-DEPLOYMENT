
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export const AttendanceManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const attendanceStats = {
    totalPresent: 1176,
    totalAbsent: 71,
    attendanceRate: 94.3,
    staffPresent: 84,
    staffAbsent: 5
  };

  const aiInsights = [
    {
      type: 'warning',
      message: 'Grade 9-B has unusual absence pattern - 15% higher than average',
      action: 'Investigate'
    },
    {
      type: 'alert',
      message: 'Math teacher Mrs. Johnson absent for 3 consecutive days',
      action: 'Arrange substitute'
    },
    {
      type: 'info',
      message: 'Perfect attendance streak: Grade 6-A (7 days)',
      action: 'Recognize'
    }
  ];

  const recentAttendance = [
    {
      id: 1,
      name: 'Grade 10-A',
      present: 28,
      absent: 2,
      rate: 93.3,
      status: 'normal'
    },
    {
      id: 2,
      name: 'Grade 9-B',
      present: 22,
      absent: 8,
      rate: 73.3,
      status: 'low'
    },
    {
      id: 3,
      name: 'Grade 8-C',
      present: 30,
      absent: 0,
      rate: 100,
      status: 'excellent'
    }
  ];

  const staffAttendance = [
    {
      id: 1,
      name: 'Mrs. Sarah Johnson',
      department: 'Mathematics',
      status: 'absent',
      days: 3,
      reason: 'Medical leave'
    },
    {
      id: 2,
      name: 'Mr. David Chen',
      department: 'Science',
      status: 'present',
      days: 0,
      reason: ''
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Attendance Management</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Students Present</p>
                <p className="text-2xl font-bold">{attendanceStats.totalPresent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Students Absent</p>
                <p className="text-2xl font-bold">{attendanceStats.totalAbsent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold">{attendanceStats.attendanceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Staff Present</p>
                <p className="text-2xl font-bold">{attendanceStats.staffPresent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Staff Absent</p>
                <p className="text-2xl font-bold">{attendanceStats.staffAbsent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span>AI Attendance Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {aiInsights.map((insight, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    insight.type === 'alert' ? 'bg-red-500' :
                    insight.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <p className="text-sm font-medium">{insight.message}</p>
                </div>
                <Button size="sm" variant="outline">
                  {insight.action}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">Student Attendance</TabsTrigger>
          <TabsTrigger value="staff">Staff Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search classes, students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Today
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Class-wise Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAttendance.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-600">
                        Present: {item.present} | Absent: {item.absent}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold">{item.rate}%</span>
                      <Badge variant={
                        item.status === 'excellent' ? 'default' :
                        item.status === 'low' ? 'destructive' : 'secondary'
                      }>
                        {item.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Attendance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staffAttendance.map((staff) => (
                  <div key={staff.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{staff.name}</h3>
                      <p className="text-sm text-gray-600">{staff.department}</p>
                      {staff.reason && (
                        <p className="text-sm text-gray-500">Reason: {staff.reason}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      {staff.status === 'absent' && staff.days > 0 && (
                        <span className="text-sm text-red-600 font-medium">
                          {staff.days} days absent
                        </span>
                      )}
                      <Badge variant={staff.status === 'present' ? 'default' : 'destructive'}>
                        {staff.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        Contact
                      </Button>
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
