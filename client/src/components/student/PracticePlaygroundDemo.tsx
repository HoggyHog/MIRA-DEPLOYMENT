import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  PlayCircle, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Brain,
  Target,
  BookOpen,
  Lightbulb,
  Loader2,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PracticePlaygroundDemo = () => {
  const [config, setConfig] = useState({
    subject: '',
    grade: '',
    topic: ''
  });
  const [idealContent, setIdealContent] = useState('');
  const [studentResponses, setStudentResponses] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const subjects = ["Mathematics", "Science", "English", "Social Studies", "Hindi", "Physics", "Chemistry", "Biology"];
  const grades = ["6", "7", "8", "9", "10", "11", "12"];

  const analyzeResponses = async () => {
    if (!idealContent.trim() || !studentResponses.trim()) {
      toast({
        title: "Missing Content",
        description: "Please provide both ideal content and student responses.",
        variant: "destructive"
      });
      return;
    }

    if (!config.subject || !config.grade || !config.topic) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      // Create FormData for the API call
      const formData = new FormData();
      
      // Create text-based "PDF" files from the text areas
      const idealBlob = new Blob([idealContent], { type: 'application/pdf' });
      const studentBlob = new Blob([studentResponses], { type: 'application/pdf' });
      
      formData.append('ideal_content_pdf', idealBlob, 'ideal_content.pdf');
      formData.append('student_responses_pdf', studentBlob, 'student_responses.pdf');
      formData.append('subject', config.subject);
      formData.append('grade', config.grade);
      formData.append('topic', config.topic);

      const response = await fetch('/api/analyze-practice', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis request failed');
      }

      const result = await response.json();
      setAnalysis(result);

      if (result.success) {
        toast({
          title: "Analysis Complete",
          description: "Your practice session has been analyzed successfully.",
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: result.error || "Failed to analyze responses.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze practice session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadReport = () => {
    if (!analysis?.success) return;
    
    let reportContent = `AI Practice Playground Report\n`;
    reportContent += `Subject: ${config.subject} | Grade: ${config.grade} | Topic: ${config.topic}\n`;
    reportContent += `Overall Score: ${analysis.overall_score}% (${Math.round((analysis.overall_score! / 100) * analysis.total_marks!)}/${analysis.total_marks})\n\n`;
    
    reportContent += `GENERAL FEEDBACK:\n${analysis.general_feedback}\n\n`;
    
    analysis.question_analyses?.forEach((qa: any, index: number) => {
      reportContent += `SECTION ${qa.question_number}:\n`;
      reportContent += `Content: ${qa.question_text}\n`;
      reportContent += `Marks: ${qa.marks_awarded}/${qa.total_marks}\n`;
      reportContent += `Marking Scheme: ${qa.marking_scheme}\n`;
      reportContent += `Strengths: ${qa.strengths.join(', ')}\n`;
      reportContent += `Misconceptions: ${qa.misconceptions.join(', ')}\n`;
      reportContent += `Improvement Suggestions: ${qa.improvement_suggestions}\n\n`;
    });

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Practice_Report_${config.subject}_${config.grade}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="w-6 h-6 text-blue-600" />
            AI Practice Playground - Demo Mode
          </CardTitle>
          <CardDescription>
            Demo version: Enter your content directly instead of uploading PDFs. Get detailed feedback with marking schemes and improvement suggestions.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="setup">Setup & Analysis</TabsTrigger>
          <TabsTrigger value="results">Analysis Results</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Practice Session Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Select value={config.subject} onValueChange={(value) => setConfig(prev => ({ ...prev, subject: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade">Grade *</Label>
                  <Select value={config.grade} onValueChange={(value) => setConfig(prev => ({ ...prev, grade: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map(grade => (
                        <SelectItem key={grade} value={grade}>Grade {grade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic">Topic *</Label>
                  <input
                    id="topic"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter topic name"
                    value={config.topic}
                    onChange={(e) => setConfig(prev => ({ ...prev, topic: e.target.value }))}
                  />
                </div>
              </div>

              {/* Content Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Ideal Answers/Reference Content *</Label>
                    <p className="text-sm text-gray-600">Enter the ideal answers or reference material</p>
                  </div>
                  <Textarea
                    placeholder="Paste your ideal answers or reference content here..."
                    value={idealContent}
                    onChange={(e) => setIdealContent(e.target.value)}
                    rows={10}
                    className="min-h-[200px]"
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Student Responses *</Label>
                    <p className="text-sm text-gray-600">Enter your practice responses</p>
                  </div>
                  <Textarea
                    placeholder="Paste your student responses here..."
                    value={studentResponses}
                    onChange={(e) => setStudentResponses(e.target.value)}
                    rows={10}
                    className="min-h-[200px]"
                  />
                </div>
              </div>

              {/* Analyze Button */}
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={analyzeResponses}
                  disabled={isAnalyzing || !idealContent.trim() || !studentResponses.trim() || !config.subject || !config.grade || !config.topic}
                  className="min-w-[200px]"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Analyze Practice Session
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {analysis?.success && (
            <>
              {/* Overall Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                      Overall Performance
                    </span>
                    <Button onClick={downloadReport} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download Report
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">{analysis.overall_score}%</div>
                      <div className="text-sm text-blue-700">Overall Score</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">
                        {Math.round((analysis.overall_score! / 100) * analysis.total_marks!)}
                      </div>
                      <div className="text-sm text-green-700">Marks Scored</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600">{analysis.total_marks}</div>
                      <div className="text-sm text-purple-700">Total Marks</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{analysis.overall_score}%</span>
                    </div>
                    <Progress value={analysis.overall_score} className="w-full" />
                  </div>

                  {analysis.general_feedback && (
                    <Alert className="mt-4">
                      <Lightbulb className="h-4 w-4" />
                      <AlertDescription>
                        <strong>General Feedback:</strong> {analysis.general_feedback}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Section Analysis */}
              <div className="space-y-4">
                {analysis.question_analyses?.map((qa: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Section {qa.question_number}</span>
                        <Badge variant={qa.marks_awarded === qa.total_marks ? "default" : qa.marks_awarded > qa.total_marks / 2 ? "secondary" : "destructive"}>
                          {qa.marks_awarded}/{qa.total_marks} marks
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Marking Scheme:</h4>
                        <p className="text-sm text-gray-600">
                          {typeof qa.marking_scheme === 'string' 
                            ? qa.marking_scheme 
                            : JSON.stringify(qa.marking_scheme, null, 2)
                          }
                        </p>
                      </div>

                      {qa.strengths && qa.strengths.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Strengths:
                          </h4>
                          <ul className="list-disc list-inside text-sm text-green-600 space-y-1">
                            {Array.isArray(qa.strengths) 
                              ? qa.strengths.map((strength: string, idx: number) => (
                                  <li key={idx}>{typeof strength === 'string' ? strength : JSON.stringify(strength)}</li>
                                ))
                              : <li>{typeof qa.strengths === 'string' ? qa.strengths : JSON.stringify(qa.strengths)}</li>
                            }
                          </ul>
                        </div>
                      )}

                      {qa.misconceptions && qa.misconceptions.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Misconceptions:
                          </h4>
                          <ul className="list-disc list-inside text-sm text-orange-600 space-y-1">
                            {Array.isArray(qa.misconceptions)
                              ? qa.misconceptions.map((misconception: string, idx: number) => (
                                  <li key={idx}>{typeof misconception === 'string' ? misconception : JSON.stringify(misconception)}</li>
                                ))
                              : <li>{typeof qa.misconceptions === 'string' ? qa.misconceptions : JSON.stringify(qa.misconceptions)}</li>
                            }
                          </ul>
                        </div>
                      )}

                      <div>
                        <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Improvement Suggestions:
                        </h4>
                        <p className="text-sm text-blue-600">
                          {typeof qa.improvement_suggestions === 'string' 
                            ? qa.improvement_suggestions 
                            : JSON.stringify(qa.improvement_suggestions, null, 2)
                          }
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {analysis && !analysis.success && (
            <Card>
              <CardContent className="pt-6">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Analysis Failed:</strong> {analysis.error}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {!analysis && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Analysis Yet</h3>
                  <p className="text-gray-500">Enter your practice content and run an analysis to see detailed feedback here.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PracticePlaygroundDemo;