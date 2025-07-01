
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  HelpCircle, 
  Bot, 
  Send, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const DoubtResolution = () => {
  const [doubts] = useState([
    {
      id: 1,
      student: 'Sarah Wilson',
      class: 'Grade 10-A',
      subject: 'Mathematics',
      question: 'I am having trouble understanding quadratic equations. Can you explain the discriminant?',
      priority: 'high',
      timestamp: '2 hours ago',
      status: 'pending'
    },
    {
      id: 2,
      student: 'Mike Johnson',
      class: 'Grade 10-B',
      subject: 'Physics',
      question: 'What is the difference between velocity and acceleration?',
      priority: 'medium',
      timestamp: '4 hours ago',
      status: 'pending'
    },
    {
      id: 3,
      student: 'Emma Davis',
      class: 'Grade 11-A',
      subject: 'Mathematics',
      question: 'How do I solve trigonometric identities?',
      priority: 'low',
      timestamp: '1 day ago',
      status: 'resolved'
    }
  ]);

  const [selectedDoubt, setSelectedDoubt] = useState(null);
  const [response, setResponse] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAISuggestion = (question: string) => {
    // Mock AI suggestion
    const suggestions = {
      'quadratic': 'The discriminant (b²-4ac) determines the nature of roots. If positive, two real roots; if zero, one real root; if negative, complex roots.',
      'velocity': 'Velocity is the rate of change of displacement, while acceleration is the rate of change of velocity. Velocity is a vector quantity with both magnitude and direction.',
      'trigonometric': 'Start with basic identities like sin²θ + cos²θ = 1, then use algebraic manipulation and substitution methods.'
    };
    
    const key = Object.keys(suggestions).find(k => question.toLowerCase().includes(k));
    return suggestions[key] || 'AI suggestion will be generated based on the question context.';
  };

  const handleDoubtSelect = (doubt: any) => {
    setSelectedDoubt(doubt);
    setAiSuggestion(getAISuggestion(doubt.question));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Doubt Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5" />
            <span>Student Doubt Queue</span>
            <Badge variant="secondary">{doubts.filter(d => d.status === 'pending').length} pending</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {doubts.map((doubt) => (
            <div 
              key={doubt.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedDoubt?.id === doubt.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleDoubtSelect(doubt)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium">{doubt.student}</p>
                  <p className="text-sm text-gray-600">{doubt.class} • {doubt.subject}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getPriorityColor(doubt.priority)}>
                    {doubt.priority}
                  </Badge>
                  {doubt.status === 'resolved' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-2">{doubt.question}</p>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                {doubt.timestamp}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Response Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="w-5 h-5" />
            <span>Doubt Resolution</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedDoubt ? (
            <>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Question from {selectedDoubt.student}</h4>
                <p className="text-sm text-gray-700">{selectedDoubt.question}</p>
              </div>

              {/* AI Assistance */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Bot className="w-4 h-4" />
                    <span>AI Teaching Assistant Suggestion</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-blue-800">{aiSuggestion}</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Bot className="w-3 h-3 mr-1" />
                    Get More AI Help
                  </Button>
                </CardContent>
              </Card>

              {/* Response Form */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Type your detailed explanation here..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={6}
                />
                <div className="flex justify-between">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Add Image
                    </Button>
                    <Button variant="outline" size="sm">
                      Add Video
                    </Button>
                    <Button variant="outline" size="sm">
                      Schedule Call
                    </Button>
                  </div>
                  <Button disabled={!response.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    Send Response
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a doubt from the queue to start resolving</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
