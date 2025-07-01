
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface AIProgressAssistantProps {
  childName: string;
}

export const AIProgressAssistant = ({ childName }: AIProgressAssistantProps) => {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');

  const quickInsights = [
    {
      id: '1',
      type: 'strength',
      title: 'Mathematics Excellence',
      description: `${childName} is performing exceptionally well in Mathematics with a 95% average. Strong grasp of algebraic concepts.`,
      actionable: 'Consider advanced math enrichment programs'
    },
    {
      id: '2',
      type: 'improvement',
      title: 'English Writing Skills',
      description: 'Analysis shows room for improvement in creative writing and essay structure.',
      actionable: 'Recommend additional reading and writing practice'
    },
    {
      id: '3',
      type: 'behavior',
      title: 'Class Participation',
      description: 'Teachers note excellent participation in Science and Math, but could be more active in English discussions.',
      actionable: 'Encourage confidence in language subjects'
    }
  ];

  const suggestedQuestions = [
    'How is my child performing compared to class average?',
    'What subjects need the most attention?',
    'Are there any behavioral concerns I should know about?',
    'What extracurricular activities would benefit my child?',
    'How can I support my child\'s learning at home?',
    'What are the upcoming important dates and deadlines?'
  ];

  const progressSummary = {
    overall: 'Excellent',
    academicGrade: 'A',
    attendanceRate: 96,
    behaviorRating: 'Outstanding',
    keyStrengths: ['Mathematics', 'Science', 'Class Participation'],
    areasToImprove: ['English Writing', 'Time Management']
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'strength': return 'bg-green-50 border-green-200';
      case 'improvement': return 'bg-yellow-50 border-yellow-200';
      case 'behavior': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'improvement': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'behavior': return <TrendingUp className="w-5 h-5 text-blue-500" />;
      default: return <MessageSquare className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Progress Summary */}
      <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold">AI</span>
            </span>
            <span>AI Progress Summary for {childName}</span>
          </CardTitle>
          <CardDescription className="text-purple-100">
            Comprehensive analysis based on academic performance, attendance, and teacher feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{progressSummary.overall}</p>
              <p className="text-purple-100 text-sm">Overall Performance</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{progressSummary.academicGrade}</p>
              <p className="text-purple-100 text-sm">Academic Grade</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{progressSummary.attendanceRate}%</p>
              <p className="text-purple-100 text-sm">Attendance</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{progressSummary.behaviorRating}</p>
              <p className="text-purple-100 text-sm">Behavior Rating</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle>AI-Generated Insights</CardTitle>
            <CardDescription>Personalized analysis of {childName}'s progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quickInsights.map((insight) => (
                <div key={insight.id} className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}>
                  <div className="flex items-start space-x-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{insight.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                      <p className="text-xs font-medium text-blue-600">{insight.actionable}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ask AI Assistant */}
        <Card>
          <CardHeader>
            <CardTitle>Ask AI Assistant</CardTitle>
            <CardDescription>Get instant answers about {childName}'s progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Quick Questions:</h4>
              <div className="space-y-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start text-xs h-auto py-2 px-3"
                    onClick={() => setSelectedQuestion(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Custom Question:</h4>
              <div className="space-y-3">
                <textarea
                  className="w-full p-3 border rounded-lg text-sm"
                  rows={3}
                  placeholder="Ask anything about your child's progress..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                />
                <Button className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Ask AI Assistant
                </Button>
              </div>
            </div>

            {selectedQuestion && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm font-medium text-blue-800 mb-2">You asked:</p>
                <p className="text-sm text-blue-700 mb-3">"{selectedQuestion}"</p>
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm">
                    Based on {childName}'s current data, here's a personalized response... 
                    [This would be generated by AI based on the actual question and student data]
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setSelectedQuestion(null)}
                >
                  Clear
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Strengths and Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">Key Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {progressSummary.keyStrengths.map((strength, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">{strength}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-orange-700">Areas to Improve</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {progressSummary.areasToImprove.map((area, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">{area}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
