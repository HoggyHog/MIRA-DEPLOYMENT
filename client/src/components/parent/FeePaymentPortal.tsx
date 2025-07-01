
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface FeePaymentPortalProps {
  childName: string;
}

export const FeePaymentPortal = ({ childName }: FeePaymentPortalProps) => {
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  const pendingFees = [
    { id: '1', description: 'Tuition Fee - Q2 2024', amount: 2500, dueDate: '2024-02-15', status: 'pending' },
    { id: '2', description: 'Transport Fee - February', amount: 150, dueDate: '2024-02-10', status: 'overdue' },
    { id: '3', description: 'Activity Fee - Annual', amount: 300, dueDate: '2024-02-20', status: 'pending' }
  ];

  const paymentHistory = [
    { id: '1', description: 'Tuition Fee - Q1 2024', amount: 2500, paidDate: '2024-01-15', method: 'Credit Card', status: 'paid' },
    { id: '2', description: 'Transport Fee - January', amount: 150, paidDate: '2024-01-10', method: 'Bank Transfer', status: 'paid' },
    { id: '3', description: 'Book Fee - Annual', amount: 200, paidDate: '2024-01-05', method: 'UPI', status: 'paid' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'overdue': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Fee Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-700">$2,950</p>
            <p className="text-sm text-red-600">Total Outstanding</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-700">2</p>
            <p className="text-sm text-yellow-600">Pending Payments</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700">Feb 10</p>
            <p className="text-sm text-blue-600">Next Due Date</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending Payments</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Fees for {childName}</CardTitle>
              <CardDescription>Click on any fee to proceed with payment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingFees.map((fee) => (
                  <div
                    key={fee.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPayment === fee.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedPayment(fee.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(fee.status)}
                        <div>
                          <h4 className="font-medium">{fee.description}</h4>
                          <p className="text-sm text-gray-600">Due: {new Date(fee.dueDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">${fee.amount}</p>
                        <Badge className={getStatusColor(fee.status)}>
                          {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedPayment && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Payment Options</h4>
                    <Button onClick={() => setSelectedPayment(null)} variant="ghost" size="sm">
                      Cancel
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4" />
                      <span>Credit/Debit Card</span>
                    </Button>
                    <Button variant="outline" className="flex items-center space-x-2">
                      <span>🏦</span>
                      <span>Bank Transfer</span>
                    </Button>
                    <Button variant="outline" className="flex items-center space-x-2">
                      <span>📱</span>
                      <span>UPI Payment</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All completed payments for {childName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paymentHistory.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(payment.status)}
                      <div>
                        <h4 className="font-medium">{payment.description}</h4>
                        <p className="text-sm text-gray-600">
                          Paid on {new Date(payment.paidDate).toLocaleDateString()} via {payment.method}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${payment.amount}</p>
                      <Badge className={getStatusColor(payment.status)}>Paid</Badge>
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
