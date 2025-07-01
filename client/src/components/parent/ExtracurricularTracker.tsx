
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calendar, Users, Clock } from 'lucide-react';

interface ExtracurricularTrackerProps {
  childName: string;
}

export const ExtracurricularTracker = ({ childName }: ExtracurricularTrackerProps) => {
  const currentActivities = [
    {
      id: '1',
      name: 'School Basketball Team',
      type: 'Sports',
      schedule: 'Mon, Wed, Fri - 4:00 PM',
      coach: 'Coach Michael Smith',
      status: 'active',
      progress: 'Regular player, improving dribbling skills'
    },
    {
      id: '2',
      name: 'Science Club',
      type: 'Academic',
      schedule: 'Thursday - 3:30 PM',
      coach: 'Ms. Rachel Green',
      status: 'active',
      progress: 'Working on robotics project'
    },
    {
      id: '3',
      name: 'Art & Craft Workshop',
      type: 'Creative',
      schedule: 'Saturday - 10:00 AM',
      coach: 'Mr. David Wilson',
      status: 'active',
      progress: 'Learning watercolor techniques'
    }
  ];

  const achievements = [
    {
      id: '1',
      title: '2nd Place - Inter-school Basketball',
      date: '2024-01-15',
      category: 'Sports',
      description: 'Excellent teamwork and sportsmanship'
    },
    {
      id: '2',
      title: 'Best Science Project',
      date: '2024-01-10',
      category: 'Academic',
      description: 'Solar energy model project'
    },
    {
      id: '3',
      title: 'Art Exhibition Participant',
      date: '2023-12-20',
      category: 'Creative',
      description: 'Watercolor painting displayed'
    }
  ];

  const upcomingEvents = [
    {
      id: '1',
      name: 'Regional Basketball Championship',
      date: '2024-02-25',
      time: '2:00 PM',
      location: 'City Sports Complex'
    },
    {
      id: '2',
      name: 'Science Fair 2024',
      date: '2024-03-05',
      time: '10:00 AM',
      location: 'School Auditorium'
    },
    {
      id: '3',
      name: 'Annual Art Exhibition',
      date: '2024-03-15',
      time: '11:00 AM',
      location: 'School Gallery'
    }
  ];

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'Sports': return 'bg-red-100 text-red-800';
      case 'Academic': return 'bg-blue-100 text-blue-800';
      case 'Creative': return 'bg-purple-100 text-purple-800';
      case 'Music': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Activity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700">3</p>
            <p className="text-sm text-blue-600">Active Activities</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <Trophy className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700">3</p>
            <p className="text-sm text-green-600">Achievements</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-700">3</p>
            <p className="text-sm text-purple-600">Upcoming Events</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-700">8</p>
            <p className="text-sm text-orange-600">Hours/Week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Current Activities</CardTitle>
            <CardDescription>{childName}'s active extracurricular participation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentActivities.map((activity) => (
                <div key={activity.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{activity.name}</h4>
                    <Badge className={getActivityTypeColor(activity.type)}>
                      {activity.type}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><Clock className="w-4 h-4 inline mr-2" />{activity.schedule}</p>
                    <p><Users className="w-4 h-4 inline mr-2" />{activity.coach}</p>
                    <p className="text-green-600 font-medium">{activity.progress}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Achievements</CardTitle>
            <CardDescription>Awards and recognitions earned by {childName}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-5 h-5 text-yellow-600" />
                      <h4 className="font-medium">{achievement.title}</h4>
                    </div>
                    <Badge className={getActivityTypeColor(achievement.category)}>
                      {achievement.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{achievement.description}</p>
                  <p className="text-xs text-gray-500">{new Date(achievement.date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events & Competitions</CardTitle>
          <CardDescription>Events {childName} is scheduled to participate in</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="p-4 border rounded-lg hover:bg-gray-50">
                <h4 className="font-medium mb-2">{event.name}</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><Calendar className="w-4 h-4 inline mr-2" />
                    {new Date(event.date).toLocaleDateString()}
                  </p>
                  <p><Clock className="w-4 h-4 inline mr-2" />{event.time}</p>
                  <p className="text-blue-600">{event.location}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="w-full">
              View Full Activity Calendar
            </Button>
            <Button className="w-full">
              Request New Activity Enrollment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
