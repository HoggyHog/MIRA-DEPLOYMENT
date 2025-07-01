
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const LeaveApprovalWorkflow: React.FC = () => {
  const [selectedLeave, setSelectedLeave] = useState<any>(null);

  const pendingLeaves = [
    {
      id: 1,
      name: 'Sarah Johnson',
      type: 'staff',
      department: 'Mathematics',
      leaveType: 'Medical Leave',
      startDate: '2024-01-15',
      endDate: '2024-01-17',
      days: 3,
      reason: 'Doctor appointment and recovery',
      status: 'pending',
      priority: 'high',
      submittedDate: '2024-01-10'
    },
    {
      id: 2,
      name: 'Emma Watson',
      type: 'student',
      class: 'Grade 10-A',
      leaveType: 'Family Emergency',
      startDate: '2024-01-16',
      endDate: '2024-01-16',
      days: 1,
      reason: 'Family emergency - grandmother hospitalized',
      status: 'pending',
      priority: 'medium',
      submittedDate: '2024-01-15'
    }
  ];

  const approvedLeaves = [
    {
      id: 3,
      name: 'David Chen',
      type: 'staff',
      department: 'Science',
      leaveType: 'Annual Leave',
      startDate: '2024-01-12',
      endDate: '2024-01-14',
      days: 3,
      status: 'approved',
      approvedBy: 'Principal',
      approvedDate: '2024-01-10'
    }
  ];

  const handleApproveLeave = (leaveId: number) => {
    console.log('Approving leave:', leaveId);
  };

  const handleRejectLeave = (leaveId: number) => {
    console.log('Rejecting leave:', leaveId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Leave Approval Workflow</h2>
        <div className="flex space-x-2">
          <Badge variant="secondary">12 Pending</Badge>
          <Badge variant="outline">45 This Month</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Approved Today</p>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold">2</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Urgent</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <div className="space-y-4">
            {pendingLeaves.map((leave) => (
              <Card key={leave.id} className={`border-l-4 ${
                leave.priority === 'high' ? 'border-l-red-500' :
                leave.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-600" />
                      <div>
                        <CardTitle className="text-lg">{leave.name}</CardTitle>
                        <p className="text-sm text-gray-600">
                          {leave.type === 'staff' ? leave.department : leave.class}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        leave.priority === 'high' ? 'destructive' :
                        leave.priority === 'medium' ? 'secondary' : 'outline'
                      }>
                        {leave.priority} priority
                      </Badge>
                      <Badge variant="outline">{leave.leaveType}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Duration</p>
                      <p className="text-sm text-gray-600">
                        {leave.startDate} to {leave.endDate} ({leave.days} days)
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Submitted</p>
                      <p className="text-sm text-gray-600">{leave.submittedDate}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700">Reason</p>
                    <p className="text-sm text-gray-600">{leave.reason}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLeave(leave)}
                    >
                      View Details
                    </Button>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectLeave(leave.id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproveLeave(leave.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <div className="space-y-4">
            {approvedLeaves.map((leave) => (
              <Card key={leave.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <h3 className="font-medium">{leave.name}</h3>
                        <p className="text-sm text-gray-600">
                          {leave.type === 'staff' ? leave.department : 'Student'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Approved by {leave.approvedBy}</p>
                      <p className="text-sm text-gray-600">on {leave.approvedDate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No rejected leaves</h3>
            <p className="text-gray-600">All recent leave requests have been approved</p>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Leave Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Medical Leave</span>
                    <Badge variant="secondary">45%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Annual Leave</span>
                    <Badge variant="secondary">30%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Emergency Leave</span>
                    <Badge variant="secondary">25%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Approval Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Average Approval Time</span>
                    <span className="font-medium">2.3 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Approval Rate</span>
                    <span className="font-medium">94%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peak Request Period</span>
                    <span className="font-medium">Monday mornings</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
