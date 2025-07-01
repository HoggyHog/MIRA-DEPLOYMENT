
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

export const FeeCollectionReporting: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Fee Collection & Financial Reporting</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Collected</p>
                <p className="text-2xl font-bold">$125,450</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold">$8,230</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Collection Rate</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold">342</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fee Collection Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Comprehensive fee management system with automated tracking and reporting capabilities.</p>
          <Button className="mt-4">Generate Financial Report</Button>
        </CardContent>
      </Card>
    </div>
  );
};
