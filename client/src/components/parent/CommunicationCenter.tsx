
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Bell, Calendar, User } from 'lucide-react';

interface CommunicationCenterProps {
  childName: string;
}

export const CommunicationCenter = ({ childName }: CommunicationCenterProps) => {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

  const messages = [
    {
      id: '1',
      from: 'Ms. Sarah Johnson (Math Teacher)',
      subject: 'Excellent progress in Algebra',
      preview: 'Emma has shown remarkable improvement in her algebra skills...',
      date: '2024-01-22',
      type: 'praise',
      unread: true
    },
    {
      id: '2',
      from: 'Mr. David Chen (Science Teacher)',
      subject: 'Science project reminder',
      preview: 'Just a reminder about the upcoming science project due next week...',
      date: '2024-01-20',
      type: 'reminder',
      unread: false
    },
    {
      id: '3',
      from: 'Mrs. Lisa Anderson (Principal)',
      subject: 'Parent-Teacher Conference',
      preview: 'We would like to schedule a meeting to discuss Emma\'s overall progress...',
      date: '2024-01-18',
      type: 'meeting',
      unread: true
    }
  ];

  const announcements = [
    {
      id: '1',
      title: 'School Sports Day - February 15th',
      content: 'Annual sports day event. All parents are invited to attend.',
      date: '2024-01-22',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Mid-term Examination Schedule',
      content: 'Mid-term exams will begin from March 1st. Detailed schedule attached.',
      date: '2024-01-20',
      priority: 'medium'
    }
  ];

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'praise': return 'bg-green-100 text-green-800';
      case 'reminder': return 'bg-blue-100 text-blue-800';
      case 'meeting': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700">5</p>
            <p className="text-sm text-blue-600">Unread Messages</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700">2</p>
            <p className="text-sm text-green-600">Upcoming Meetings</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <Bell className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-700">3</p>
            <p className="text-sm text-orange-600">New Announcements</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="compose">Compose</TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Messages from Teachers</CardTitle>
              <CardDescription>Communication regarding {childName}'s academic progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      message.unread ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                    } hover:bg-gray-100`}
                    onClick={() => setSelectedMessage(message.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-sm">{message.from}</span>
                          {message.unread && (
                            <Badge variant="destructive" className="text-xs">New</Badge>
                          )}
                        </div>
                        <h4 className="font-medium mb-1">{message.subject}</h4>
                        <p className="text-sm text-gray-600 mb-2">{message.preview}</p>
                        <div className="flex items-center justify-between">
                          <Badge className={getMessageTypeColor(message.type)}>
                            {message.type.charAt(0).toUpperCase() + message.type.slice(1)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(message.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" variant="outline">
                Load More Messages
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle>School Announcements</CardTitle>
              <CardDescription>Important updates and events from the school</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{announcement.title}</h4>
                      <Badge variant={announcement.priority === 'high' ? 'destructive' : 'secondary'}>
                        {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{announcement.content}</p>
                    <p className="text-xs text-gray-500">
                      Posted on {new Date(announcement.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compose">
          <Card>
            <CardHeader>
              <CardTitle>Send Message</CardTitle>
              <CardDescription>Contact your child's teachers or school administration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">To:</label>
                <select className="w-full p-2 border rounded-md">
                  <option>Select Teacher/Staff</option>
                  <option>Ms. Sarah Johnson (Math Teacher)</option>
                  <option>Mr. David Chen (Science Teacher)</option>
                  <option>Mrs. Lisa Anderson (Principal)</option>
                  <option>School Administration</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subject:</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter subject..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message:</label>
                <textarea
                  className="w-full p-2 border rounded-md h-32"
                  placeholder="Type your message here..."
                />
              </div>
              <Button className="w-full">Send Message</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
