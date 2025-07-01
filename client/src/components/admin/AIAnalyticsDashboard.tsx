
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  MessageSquare,
  Users,
  Calendar,
  Target
} from 'lucide-react';

export const AIAnalyticsDashboard: React.FC = () => {
  const [aiQuestion, setAiQuestion] = useState('');

  const systemAlerts = [
    {
      severity: 'high',
      title: 'Unusual Absence Pattern Detected',
      description: 'Grade 9-B shows 25% higher absence rate than normal. Possible flu outbreak.',
      timestamp: '2 hours ago',
      recommendations: [
        'Contact parents of absent students',
        'Implement health screening',
        'Consider temporary online classes'
      ]
    },
    {
      severity: 'medium',
      title: 'Staff Attendance Irregularity',
      description: 'Math department has 3 teachers absent simultaneously.',
      timestamp: '4 hours ago',
      recommendations: [
        'Arrange substitute teachers',
        'Reschedule important lessons',
        'Monitor department workload'
      ]
    },
    {
      severity: 'low',
      title: 'Fee Payment Trend',
      description: 'Payment delays increased by 15% this month.',
      timestamp: '1 day ago',
      recommendations: [
        'Send reminder notifications',
        'Review payment policies',
        'Offer flexible payment options'
      ]
    }
  ];

  const performanceInsights = [
    {
      metric: 'Student Engagement',
      score: 87,
      trend: 'up',
      insight: 'Engagement improved after implementing interactive learning modules'
    },
    {
      metric: 'Teacher Efficiency',
      score: 92,
      trend: 'stable',
      insight: 'Consistent performance across all departments'
    },
    {
      metric: 'Resource Utilization',
      score: 78,
      trend: 'down',
      insight: 'Library and lab usage decreased by 12% this week'
    }
  ];

  const aiResponses = [
    {
      question: "Why is Grade 9-B having attendance issues?",
      answer: "Analysis shows a correlation with recent schedule changes and seasonal flu patterns. Recommend implementing flexible attendance policies and health monitoring."
    },
    {
      question: "Which subjects need more teaching resources?",
      answer: "Mathematics and Science departments show highest student-teacher ratios. Consider hiring additional staff or implementing peer tutoring programs."
    }
  ];

  const handleAiQuestion = () => {
    if (aiQuestion.trim()) {
      console.log('Processing AI question:', aiQuestion);
      // Here you would typically call an AI service
      setAiQuestion('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold flex items-center space-x-2">
          <Brain className="h-8 w-8 text-purple-600" />
          <span>AI Analytics Dashboard</span>
        </h2>
        <Badge variant="outline" className="text-purple-600">
          AI System Active
        </Badge>
      </div>

      {/* AI Question Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <span>Ask AI About School Operations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Ask me anything about attendance, performance, or school operations..."
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAiQuestion()}
              className="flex-1"
            />
            <Button onClick={handleAiQuestion}>
              Ask AI
            </Button>
          </div>
          
          {aiResponses.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className="font-medium text-gray-700">Recent AI Insights:</h4>
              {aiResponses.map((response, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">{response.question}</p>
                  <p className="text-sm text-blue-700 mt-1">{response.answer}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">System Alerts</TabsTrigger>
          <TabsTrigger value="insights">Performance Insights</TabsTrigger>
          <TabsTrigger value="predictions">Predictive Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {systemAlerts.map((alert, index) => (
              <Card key={index} className={`border-l-4 ${
                alert.severity === 'high' ? 'border-l-red-500 bg-red-50' :
                alert.severity === 'medium' ? 'border-l-yellow-500 bg-yellow-50' :
                'border-l-blue-500 bg-blue-50'
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className={`h-5 w-5 ${
                        alert.severity === 'high' ? 'text-red-600' :
                        alert.severity === 'medium' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                      <span>{alert.title}</span>
                    </CardTitle>
                    <Badge variant={
                      alert.severity === 'high' ? 'destructive' :
                      alert.severity === 'medium' ? 'secondary' : 'outline'
                    }>
                      {alert.severity} priority
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{alert.description}</p>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">AI Recommendations:</h4>
                    <ul className="space-y-1">
                      {alert.recommendations.map((rec, recIndex) => (
                        <li key={recIndex} className="flex items-center space-x-2">
                          <Target className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-gray-500">{alert.timestamp}</span>
                    <div className="space-x-2">
                      <Button size="sm" variant="outline">
                        Acknowledge
                      </Button>
                      <Button size="sm">
                        Take Action
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {performanceInsights.map((insight, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{insight.metric}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl font-bold">{insight.score}</span>
                    <TrendingUp className={`h-6 w-6 ${
                      insight.trend === 'up' ? 'text-green-600' :
                      insight.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <p className="text-sm text-gray-600">{insight.insight}</p>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${insight.score}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-900">Positive Predictions</h3>
                  <ul className="mt-2 space-y-1 text-sm text-green-700">
                    <li>• Student performance likely to improve by 8% next quarter</li>
                    <li>• Attendance rates expected to stabilize at 95%</li>
                    <li>• Fee collection efficiency may increase by 12%</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-medium text-yellow-900">Areas of Concern</h3>
                  <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                    <li>• Potential teacher shortage in Mathematics department</li>
                    <li>• Increased absenteeism predicted during flu season</li>
                    <li>• Resource utilization may decline without intervention</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
