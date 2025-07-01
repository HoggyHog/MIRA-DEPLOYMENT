
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { MessageCircle, Upload, Send, Bot, User, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface DoubtResponse {
  success: boolean;
  answer?: string;
  quality_score?: number;
  iterations?: number;
  context_used?: number;
  todo_list?: string[];
  error?: string;
}

// Helper function to render text with math support
const renderMathContent = (text: string) => {
  // Split text by math delimiters and render accordingly
  const parts = [];
  let currentIndex = 0;
  
  // Look for inline math (single $ or \( \))
  const inlineMathRegex = /\$([^$]+)\$|\\\(([^)]+)\\\)/g;
  // Look for block math (double $$ or \[ \])
  const blockMathRegex = /\$\$([^$]+)\$\$|\\\[([^\]]+)\\\]/g;
  
  // First handle block math
  const blockMatches = Array.from(text.matchAll(blockMathRegex));
  if (blockMatches.length > 0) {
    blockMatches.forEach((match, index) => {
      const beforeMatch = text.slice(currentIndex, match.index);
      if (beforeMatch) {
        parts.push(<span key={`text-${index}`}>{beforeMatch}</span>);
      }
      
      const mathContent = match[1] || match[2];
      parts.push(
        <div key={`block-math-${index}`} className="my-4 text-center">
          <BlockMath math={mathContent} />
        </div>
      );
      
      currentIndex = match.index! + match[0].length;
    });
    
    const remainingText = text.slice(currentIndex);
    if (remainingText) {
      parts.push(<span key="text-end">{remainingText}</span>);
    }
    
    return <div>{parts}</div>;
  }
  
  // Handle inline math
  const inlineMatches = Array.from(text.matchAll(inlineMathRegex));
  if (inlineMatches.length > 0) {
    currentIndex = 0;
    inlineMatches.forEach((match, index) => {
      const beforeMatch = text.slice(currentIndex, match.index);
      if (beforeMatch) {
        parts.push(<span key={`text-${index}`}>{beforeMatch}</span>);
      }
      
      const mathContent = match[1] || match[2];
      parts.push(
        <InlineMath key={`inline-math-${index}`} math={mathContent} />
      );
      
      currentIndex = match.index! + match[0].length;
    });
    
    const remainingText = text.slice(currentIndex);
    if (remainingText) {
      parts.push(<span key="text-end">{remainingText}</span>);
    }
    
    return <span>{parts}</span>;
  }
  
  // No math found, return plain text
  return <span>{text}</span>;
};

const DoubtChat = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    grade: '',
    subject: '',
    topic: '',
    subtopic: '',
    doubt: '',
    resolution_type: 'explanation'
  });

  const [generatedSolution, setGeneratedSolution] = useState<DoubtResponse | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const grades = ["6", "7", "8", "9", "10", "11", "12"];
  const subjects = ["Mathematics", "Science", "Physics", "Chemistry", "Biology", "English", "Hindi", "Social Science", "History", "Geography", "Political Science", "Economics"];
  const resolutionTypes = [
    { value: "explanation", label: "Explanation" },
    { value: "definition", label: "Definition" },
    { value: "solved_example", label: "Solved Example" },
    { value: "step_by_step", label: "Step by Step" },
    { value: "concept_clarification", label: "Concept Clarification" }
  ];

  const doubtMutation = useMutation({
    mutationFn: async (data: any) => {
      // Start progress simulation
      setLoadingProgress(0);
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 600);

      try {
        const response = await apiRequest('/api/solve-doubt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        setLoadingProgress(100);
        clearInterval(progressInterval);
        return response;
      } catch (error) {
        clearInterval(progressInterval);
        setLoadingProgress(0);
        throw error;
      }
    },
    onSuccess: (data: DoubtResponse) => {
      if (data.success) {
        setGeneratedSolution(data);
        toast({
          title: "Success!",
          description: "Your doubt has been resolved successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to solve doubt",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to solve doubt. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSolveDoubt = () => {
    if (!formData.grade || !formData.subject || !formData.topic || !formData.doubt) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      grade: formData.grade,
      subject: formData.subject,
      topic: formData.topic,
      subtopic: formData.subtopic,
      doubt: formData.doubt,
      resolution_type: formData.resolution_type
    };

    doubtMutation.mutate(submitData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Doubt Input Form */}
      <div className="space-y-6">
        <Card className="bg-white/80 backdrop-blur-sm border border-purple-100">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800 flex items-center">
              <MessageCircle className="w-6 h-6 mr-2 text-purple-600" />
              Mira AI Doubt Solver
            </CardTitle>
            <CardDescription>
              Get comprehensive solutions to your academic doubts with Mira's AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade *</Label>
                <Select 
                  value={formData.grade} 
                  onValueChange={(value) => setFormData({...formData, grade: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map(grade => (
                      <SelectItem key={grade} value={grade}>
                        Grade {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Select 
                  value={formData.subject} 
                  onValueChange={(value) => setFormData({...formData, subject: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic *</Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                  placeholder="e.g., Quadratic Equations"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtopic">Subtopic</Label>
                <Input
                  id="subtopic"
                  value={formData.subtopic}
                  onChange={(e) => setFormData({...formData, subtopic: e.target.value})}
                  placeholder="e.g., Discriminant"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resolution_type">Resolution Type</Label>
              <Select 
                value={formData.resolution_type} 
                onValueChange={(value) => setFormData({...formData, resolution_type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select resolution type" />
                </SelectTrigger>
                <SelectContent>
                  {resolutionTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doubt">Your Doubt *</Label>
              <Textarea
                id="doubt"
                value={formData.doubt}
                onChange={(e) => setFormData({...formData, doubt: e.target.value})}
                placeholder="Describe your doubt in detail..."
                className="min-h-[100px]"
              />
            </div>

            {/* Information Note */}
            <div className="space-y-2 border-t pt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">AI Analysis Ready</p>
                    <p>The system uses pre-loaded CBSE curriculum and NCERT content to provide comprehensive doubt resolution aligned with educational standards.</p>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSolveDoubt} 
              disabled={doubtMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {doubtMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Solving Doubt...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Solve My Doubt
                </>
              )}
            </Button>

            {/* Loading Progress */}
            {doubtMutation.isPending && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Analyzing your doubt...</span>
                  <span className="text-purple-600">{Math.round(loadingProgress)}%</span>
                </div>
                <Progress value={loadingProgress} className="h-2" />
                <p className="text-xs text-gray-500 text-center">
                  {loadingProgress < 30 ? 'Processing curriculum context...' :
                   loadingProgress < 60 ? 'Analyzing with AI...' :
                   loadingProgress < 90 ? 'Generating comprehensive solution...' :
                   'Finalizing response...'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Solution Display */}
      <div className="space-y-6">
        {generatedSolution && generatedSolution.success ? (
          <>
            <Card className="bg-white border border-green-200">
              <CardHeader>
                <CardTitle className="text-xl text-green-800 flex items-center">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  Doubt Resolution
                </CardTitle>
                <div className="flex items-center space-x-4">
                  <Badge className="bg-green-100 text-green-800">
                    Quality Score: {generatedSolution.quality_score?.toFixed(1)}/10
                  </Badge>
                  <Badge variant="outline">
                    Iterations: {generatedSolution.iterations}
                  </Badge>
                  <Badge variant="outline">
                    Context: {generatedSolution.context_used} words
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] w-full border rounded-md p-6 bg-white">
                  <div className="space-y-6">
                    <div className="prose prose-lg max-w-none">
                      {generatedSolution.answer?.split('\n').map((line, index) => {
                        const trimmedLine = line.trim();
                        
                        // Main headings with **text**
                        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                          return (
                            <div key={index} className="mt-6 mb-4">
                              <h3 className="text-xl font-bold text-blue-900 bg-blue-50 px-4 py-3 rounded-lg border-l-4 border-blue-600">
                                {trimmedLine.slice(2, -2)}
                              </h3>
                            </div>
                          );
                        }
                        
                        // Section headers starting with ###
                        if (trimmedLine.startsWith('###')) {
                          return (
                            <div key={index} className="mt-5 mb-3">
                              <h4 className="text-lg font-semibold text-blue-800 border-l-3 border-blue-400 pl-3">
                                {trimmedLine.substring(3).trim()}
                              </h4>
                            </div>
                          );
                        }
                        
                        // Numbered lists with math support
                        if (trimmedLine.match(/^\d+\./)) {
                          return (
                            <div key={index} className="ml-6 mb-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-300">
                              <div className="font-medium text-blue-800">{renderMathContent(trimmedLine)}</div>
                            </div>
                          );
                        }
                        
                        // Bullet points with math support
                        if (trimmedLine.match(/^[-•*]/)) {
                          return (
                            <div key={index} className="ml-6 mb-2 flex items-start space-x-3">
                              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                              <div className="text-gray-700 leading-relaxed">{renderMathContent(trimmedLine.substring(1).trim())}</div>
                            </div>
                          );
                        }
                        
                        // Important notes or formulas - enhanced math rendering
                        if (trimmedLine.includes('=') || trimmedLine.includes('∝') || trimmedLine.includes('→') || 
                            trimmedLine.includes('$') || trimmedLine.includes('\\') || 
                            trimmedLine.match(/\b\d+\s*[+\-*/^]\s*\d+/) ||
                            trimmedLine.match(/[a-z]\s*=\s*[^,\s]+/) ||
                            trimmedLine.includes('²') || trimmedLine.includes('³') ||
                            trimmedLine.includes('√') || trimmedLine.includes('∫') ||
                            trimmedLine.includes('Σ') || trimmedLine.includes('π')) {
                          return (
                            <div key={index} className="my-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="text-gray-800 text-base">{renderMathContent(trimmedLine)}</div>
                            </div>
                          );
                        }
                        
                        // Questions or examples
                        if (trimmedLine.endsWith('?') || trimmedLine.toLowerCase().startsWith('example')) {
                          return (
                            <div key={index} className="my-3 p-3 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                              <span className="text-green-800 font-medium">{trimmedLine}</span>
                            </div>
                          );
                        }
                        
                        // Empty lines
                        if (!trimmedLine) {
                          return <div key={index} className="mb-3"></div>;
                        }
                        
                        // Regular paragraphs with math support
                        return (
                          <p key={index} className="mb-4 text-gray-800 leading-relaxed text-base">
                            {renderMathContent(trimmedLine)}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {generatedSolution.todo_list && generatedSolution.todo_list.length > 0 && (
              <Card className="bg-blue-50 border border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-800">Learning Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {generatedSolution.todo_list.map((item, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-blue-600 font-bold">{index + 1}.</span>
                        <span className="text-blue-800">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="bg-white/80 backdrop-blur-sm border border-purple-100">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <p>• Fill in all required fields (Grade, Subject, Topic, Doubt)</p>
                <p>• Be specific in your doubt description for better results</p>
                <p>• Choose appropriate resolution type based on your need</p>
                <p>• The AI uses CBSE curriculum standards for accurate answers</p>
                <p>• Solutions include quality scoring and learning steps</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DoubtChat;
