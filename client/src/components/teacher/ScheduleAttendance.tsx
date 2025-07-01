import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users,
  Plus,
  CheckSquare
} from 'lucide-react';

export const ScheduleAttendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const todaySchedule = [
    {
      id: 1,
      subject: 'Mathematics',
      class: 'Grade 10-A',
      time: '9:00 AM - 10:00 AM',
      room: 'Room 101',
      type: 'lecture',
      status: 'upcoming'
    },
    {
      id: 2,
      subject: 'Physics',
      class: 'Grade 11-A',
      time: '11:00 AM - 12:00 PM',
      room: 'Lab 2',
      type: 'practical',
      status: 'completed'
    },
    {
      id: 3,
      subject: 'Mathematics',
      class: 'Grade 10-B',
      time: '2:00 PM - 3:00 PM',
      room: 'Room 103',
      type: 'lecture',
      status: 'in_progress'
    }
  ];

  const attendanceStats = {
    todayTotal: 75,
    todayPresent: 68,
    weeklyAverage: 94.2,
    monthlyTrend: '+2.1%'
  };

  const upcomingEvents = [
    {
      title: 'Parent-Teacher Meeting',
      date: '2024-01-20',
      time: '3:00 PM',
      type: 'meeting'
    },
    {
      title: 'Staff Development Workshop',
      date: '2024-01-22',
      time: '10:00 AM',
      type: 'training'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'upcoming': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Schedule and Calendar */}
      <div className="lg:col-span-2 space-y-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Today's Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {todaySchedule.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-12 bg-blue-500 rounded"></div>
                  <div>
                    <h4 className="font-medium">{item.subject}</h4>
                    <p className="text-sm text-gray-600">{item.class}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {item.time}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {item.room}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(item.status)}>
                    {item.status.replace('_', ' ')}
                  </Badge>
                  {item.status === 'upcoming' && (
                    <Button size="sm">
                      <CheckSquare className="w-4 h-4 mr-1" />
                      Start Class
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Attendance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Attendance Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{attendanceStats.todayPresent}</p>
                <p className="text-sm text-gray-600">Present Today</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">{attendanceStats.todayTotal}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{attendanceStats.weeklyAverage}%</p>
                <p className="text-sm text-gray-600">Weekly Average</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{attendanceStats.monthlyTrend}</p>
                <p className="text-sm text-gray-600">Monthly Trend</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button>
                <CheckSquare className="w-4 h-4 mr-2" />
                Take Attendance
              </Button>
              <Button variant="outline">View Reports</Button>
              <Button variant="outline">Export Data</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Sidebar */}
      <div className="space-y-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5" />
              <span>Calendar</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <p className="font-medium text-sm">{event.title}</p>
                <p className="text-xs text-gray-600">{event.date} at {event.time}</p>
                <Badge variant="outline" className="mt-1 text-xs">
                  {event.type}
                </Badge>
              </div>
            ))}
            <Button size="sm" variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-1" />
              Add Event
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button size="sm" variant="outline" className="w-full justify-start">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Makeup Class
            </Button>
            <Button size="sm" variant="outline" className="w-full justify-start">
              <Clock className="w-4 h-4 mr-2" />
              Request Time Off
            </Button>
            <Button size="sm" variant="outline" className="w-full justify-start">
              <Users className="w-4 h-4 mr-2" />
              Book Meeting Room
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
