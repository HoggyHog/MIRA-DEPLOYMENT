
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, BookOpen, Users, Trophy, Plus } from 'lucide-react';

const StudySchedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const scheduleData = {
    '2024-01-15': [
      {
        id: 1,
        type: 'study',
        title: 'Mathematics Review',
        subject: 'Mathematics',
        time: '09:00 - 10:30',
        description: 'Review quadratic equations and practice problems',
        priority: 'high'
      },
      {
        id: 2,
        type: 'exam',
        title: 'Physics Midterm',
        subject: 'Physics',
        time: '14:00 - 16:00',
        description: 'Chapters 1-5: Mechanics and Motion',
        priority: 'high'
      }
    ],
    '2024-01-16': [
      {
        id: 3,
        type: 'activity',
        title: 'Science Club Meeting',
        subject: 'Extracurricular',
        time: '15:30 - 16:30',
        description: 'Weekly meeting and project discussion',
        priority: 'medium'
      }
    ]
  };

  const upcomingExams = [
    {
      subject: 'Mathematics',
      title: 'Final Exam',
      date: '2024-01-25',
      chapters: 'Chapters 1-8',
      preparation: 65
    },
    {
      subject: 'Physics',
      title: 'Unit Test',
      date: '2024-01-22',
      chapters: 'Newton\'s Laws',
      preparation: 40
    },
    {
      subject: 'Chemistry',
      title: 'Lab Practical',
      date: '2024-01-28',
      chapters: 'Chemical Reactions',
      preparation: 25
    }
  ];

  const studyGoals = [
    {
      subject: 'Mathematics',
      target: '2 hours daily',
      completed: 8,
      total: 14,
      streak: 5
    },
    {
      subject: 'Physics',
      target: '1.5 hours daily',
      completed: 6,
      total: 10,
      streak: 3
    }
  ];

  const todaySchedule = scheduleData[selectedDate] || [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'study': return <BookOpen className="w-5 h-5" />;
      case 'exam': return <Trophy className="w-5 h-5" />;
      case 'activity': return <Users className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'study': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'exam': return 'bg-red-100 text-red-600 border-red-200';
      case 'activity': return 'bg-green-100 text-green-600 border-green-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Schedule */}
      <div className="lg:col-span-2 space-y-6">
        {/* Date Selector and Today's Schedule */}
        <Card className="bg-white/80 backdrop-blur-sm border border-purple-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-gray-800 flex items-center">
                  <Calendar className="w-6 h-6 mr-2 text-purple-600" />
                  Study Schedule
                </CardTitle>
                <CardDescription>Plan your study sessions and track activities</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <Button size="sm" className="bg-gradient-to-r from-purple-500 to-blue-500">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {todaySchedule.length > 0 ? (
              todaySchedule.map((event) => (
                <div key={event.id} className={`p-4 rounded-lg border-2 ${getTypeColor(event.type)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getTypeColor(event.type)}`}>
                        {getTypeIcon(event.type)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{event.title}</h4>
                        <p className="text-sm text-gray-600">{event.subject}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">{event.time}</span>
                      </div>
                      <Badge variant={event.priority === 'high' ? 'destructive' : 'secondary'} className="mt-1">
                        {event.priority}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{event.description}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No events scheduled for this date</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Add Study Session
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Study Goals */}
        <Card className="bg-white/80 backdrop-blur-sm border border-purple-100">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">Weekly Study Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {studyGoals.map((goal, index) => (
              <div key={index} className="p-4 bg-gray-50/80 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-800">{goal.subject}</h4>
                    <p className="text-sm text-gray-600">Target: {goal.target}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      {goal.completed}/{goal.total} sessions
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Trophy className="w-3 h-3 text-orange-500" />
                      <span className="text-xs text-orange-600">{goal.streak} day streak</span>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(goal.completed / goal.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Upcoming Exams */}
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-800 flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              Upcoming Exams
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingExams.map((exam, index) => (
              <div key={index} className="p-3 bg-white/80 rounded-lg border border-red-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800 text-sm">{exam.title}</h4>
                  <Badge variant="destructive" className="text-xs">
                    {Math.ceil((new Date(exam.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mb-2">{exam.subject} • {exam.chapters}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Preparation</span>
                    <span className="font-medium">{exam.preparation}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${
                        exam.preparation >= 70 ? 'bg-green-500' :
                        exam.preparation >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${exam.preparation}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Study Tips */}
        <Card className="bg-white/80 backdrop-blur-sm border border-purple-100">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">Study Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="text-purple-500">📅</span>
                <p>Schedule regular breaks every 45-60 minutes</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-500">🎯</span>
                <p>Set specific goals for each study session</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-500">💡</span>
                <p>Use the AI assistant for difficult concepts</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-orange-500">📊</span>
                <p>Review progress weekly and adjust plans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-br from-purple-500 to-blue-500 text-white border-0">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30" variant="outline">
              Start Study Session
            </Button>
            <Button className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30" variant="outline">
              Take a Break
            </Button>
            <Button className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30" variant="outline">
              Mark Complete
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudySchedule;
