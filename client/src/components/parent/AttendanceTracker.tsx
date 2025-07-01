
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Clock, AlertTriangle, CalendarDays } from 'lucide-react';

interface AttendanceTrackerProps {
  childName: string;
}

export const AttendanceTracker = ({ childName }: AttendanceTrackerProps) => {
  const [selectedMonth, setSelectedMonth] = useState('current');
  const [date, setDate] = useState<Date | undefined>(new Date());

  const attendanceStats = {
    totalDays: 22,
    present: 21,
    absent: 1,
    late: 2,
    percentage: 95.5
  };

  const recentAttendance = [
    { date: '2024-01-22', status: 'present', time: '8:15 AM', notes: '' },
    { date: '2024-01-21', status: 'late', time: '8:35 AM', notes: 'Traffic delay' },
    { date: '2024-01-20', status: 'present', time: '8:10 AM', notes: '' },
    { date: '2024-01-19', status: 'absent', time: '-', notes: 'Sick leave approved' },
    { date: '2024-01-18', status: 'present', time: '8:05 AM', notes: '' }
  ];

  const upcomingLeaves = [
    { date: '2024-01-25', reason: 'Doctor appointment', status: 'approved' },
    { date: '2024-01-30', reason: 'Family function', status: 'pending' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'late':
        return <Clock className="w-5 h-5 text-orange-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Attendance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700">{attendanceStats.present}</p>
            <p className="text-sm text-green-600">Days Present</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-700">{attendanceStats.absent}</p>
            <p className="text-sm text-red-600">Days Absent</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-700">{attendanceStats.late}</p>
            <p className="text-sm text-orange-600">Times Late</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <CalendarDays className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700">{attendanceStats.percentage}%</p>
            <p className="text-sm text-blue-600">Attendance Rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Attendance</CardTitle>
                <CardDescription>Last 5 school days</CardDescription>
              </div>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">This Month</SelectItem>
                  <SelectItem value="last">Last Month</SelectItem>
                  <SelectItem value="semester">This Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAttendance.map((record, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(record.status)}
                    <div>
                      <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">{record.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(record.status)}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </Badge>
                    {record.notes && (
                      <p className="text-xs text-gray-500 mt-1">{record.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
            <CardDescription>Click on dates to see attendance details</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
      </div>

      {/* Leave Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Planned Leaves</CardTitle>
            <CardDescription>Approved and pending leave requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingLeaves.map((leave, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{new Date(leave.date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">{leave.reason}</p>
                  </div>
                  <Badge variant={leave.status === 'approved' ? 'default' : 'secondary'}>
                    {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4" variant="outline">
              Request New Leave
            </Button>
          </CardContent>
        </Card>

        {/* Attendance Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Insights</CardTitle>
            <CardDescription>AI-powered analysis of attendance patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800">Excellent Attendance!</p>
                <p className="text-sm text-blue-600">{childName} has maintained 95%+ attendance this month.</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm font-medium text-orange-800">Late Arrivals Pattern</p>
                <p className="text-sm text-orange-600">Consider leaving 10 minutes earlier to avoid traffic delays.</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-800">Perfect Week!</p>
                <p className="text-sm text-green-600">No absences recorded in the last 7 days.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
