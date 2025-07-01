import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  PlayCircle, 
  Upload, 
  FileText, 
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

interface QuestionAnalysis {
  question_number: number;
  question_text: string;
  student_answer: string;
  ideal_answer: string;
  marks_awarded: number;
  total_marks: number;
  marking_scheme: string;
  misconceptions: string[];
  improvement_suggestions: string;
  strengths: string[];
}

interface PracticeAnalysis {
  success: boolean;
  overall_score?: number;
  total_marks?: number;
  question_analyses?: QuestionAnalysis[];
  general_feedback?: string;
  error?: string;
}

const PracticePlayground = () => {
  const [config, setConfig] = useState({
    subject: '',
    grade: '',
    topic: ''
  });
  const [idealContentFile, setIdealContentFile] = useState<File | null>(null);
  const [studentResponsesFile, setStudentResponsesFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<PracticeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const subjects = ["Mathematics", "Science", "English", "Social Studies", "Hindi", "Physics", "Chemistry", "Biology"];
  const grades = ["6", "7", "8", "9", "10", "11", "12"];

  const handleFileUpload = (file: File, type: 'ideal' | 'student') => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid File Type",
        description: "Please upload only PDF files.",
        variant: "destructive"
      });
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload files smaller than 10MB for better analysis.",
        variant: "destructive"
      });
      return;
    }

    if (type === 'ideal') {
      setIdealContentFile(file);
    } else {
      setStudentResponsesFile(file);
    }

    toast({
      title: "File Uploaded",
      description: `${file.name} uploaded successfully.`,
    });
  };

  const analyzeResponses = async () => {
    if (!idealContentFile || !studentResponsesFile) {
      toast({
        title: "Missing Files",
        description: "Please upload both ideal content and student responses PDFs.",
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
      const formData = new FormData();
      formData.append('ideal_content_pdf', idealContentFile);
      formData.append('student_responses_pdf', studentResponsesFile);
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

      const result: PracticeAnalysis = await response.json();
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
    
    analysis.question_analyses?.forEach((qa, index) => {
      reportContent += `QUESTION ${qa.question_number}:\n`;
      reportContent += `Question: ${qa.question_text}\n`;
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
            AI Practice Playground
          </CardTitle>
          <CardDescription>
            Upload your practice responses and ideal answers to get detailed feedback with marking schemes and improvement suggestions.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="setup">Setup & Upload</TabsTrigger>
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
                  <Input
                    id="topic"
                    placeholder="Enter topic name"
                    value={config.topic}
                    onChange={(e) => setConfig(prev => ({ ...prev, topic: e.target.value }))}
                  />
                </div>
              </div>

              {/* File Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Ideal Answers/Reference Content *</Label>
                    <p className="text-sm text-gray-600">Upload PDF containing ideal answers (Demo: text-based PDFs work best)</p>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('ideal-content-upload')?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Ideal Content PDF
                      </Button>
                      <input
                        id="ideal-content-upload"
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'ideal');
                        }}
                      />
                      {idealContentFile && (
                        <div className="text-sm text-green-600 font-medium">
                          ✓ {idealContentFile.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Student Responses *</Label>
                    <p className="text-sm text-gray-600">Upload PDF containing your practice responses (Demo: text-based PDFs work best)</p>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('student-responses-upload')?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Your Responses PDF
                      </Button>
                      <input
                        id="student-responses-upload"
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'student');
                        }}
                      />
                      {studentResponsesFile && (
                        <div className="text-sm text-green-600 font-medium">
                          ✓ {studentResponsesFile.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Analyze Button */}
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={analyzeResponses}
                  disabled={isAnalyzing || !idealContentFile || !studentResponsesFile || !config.subject || !config.grade || !config.topic}
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

              {/* Question-by-Question Analysis */}
              <div className="space-y-4">
                {analysis.question_analyses?.map((qa, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Question {qa.question_number}</span>
                        <Badge variant={qa.marks_awarded === qa.total_marks ? "default" : qa.marks_awarded > qa.total_marks / 2 ? "secondary" : "destructive"}>
                          {qa.marks_awarded}/{qa.total_marks} marks
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Question:</h4>
                        <p className="text-gray-600">{qa.question_text}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Your Answer:</h4>
                          <div className="p-3 bg-gray-50 rounded text-sm">{qa.student_answer}</div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Ideal Answer:</h4>
                          <div className="p-3 bg-green-50 rounded text-sm">{qa.ideal_answer}</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Marking Scheme:</h4>
                        <p className="text-sm text-gray-600">{qa.marking_scheme}</p>
                      </div>

                      {qa.strengths.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Strengths:
                          </h4>
                          <ul className="list-disc list-inside text-sm text-green-600 space-y-1">
                            {qa.strengths.map((strength, idx) => (
                              <li key={idx}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {qa.misconceptions.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Misconceptions:
                          </h4>
                          <ul className="list-disc list-inside text-sm text-orange-600 space-y-1">
                            {qa.misconceptions.map((misconception, idx) => (
                              <li key={idx}>{misconception}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div>
                        <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Improvement Suggestions:
                        </h4>
                        <p className="text-sm text-blue-600">{qa.improvement_suggestions}</p>
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
                  <p className="text-gray-500">Upload your practice materials and run an analysis to see detailed feedback here.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PracticePlayground;