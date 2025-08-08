import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  FileText, 
  Download, 
  Wand2, 
  Clock, 
  Target, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  Copy,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { generateEnhancedPDF } from '@/lib/pdfGenerator';
import { useDocumentState } from '@/contexts/DocumentStateContext';
import { useAuth0 } from '@auth0/auth0-react';

interface ExamConfig {
  grade: string;
  subject: string;
  sub_topic: string;
  difficulty: string;
  question_types: string[];
  duration: number;
  special_remarks: string;
  total_marks: number;
}

interface GeneratedExam {
  success: boolean;
  paper_content?: string;
  metadata?: {
    grade: string;
    subject: string;
    sub_topic: string;
    difficulty: string;
    duration: number;
    total_questions: number;
    total_marks: number;
    question_distribution: Record<string, number>;
    curriculum_aligned: boolean;
    generated_at: string;
  };
  questions?: Array<{
    type: string;
    content: string;
  }>;
  error?: string;
}

// Helper function to clean markdown headers from text
const cleanMarkdownHeaders = (text: string): string => {
  if (!text) return text;
  
  return text
    // Remove markdown headers (### Header, ## Header, # Header)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove horizontal rules (---, ___, ***)
    .replace(/^[-_*]{3,}\s*$/gm, '')
    // Remove extra whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
};

// Helper function to render text with math support - consistent with lesson generation
const renderMathContent = (text: string) => {
  if (!text) return <span></span>;
  
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  
  // Handle block math first ($$...$$)
  const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
  const blockMatches = Array.from(text.matchAll(blockMathRegex));
  
  if (blockMatches.length > 0) {
    blockMatches.forEach((match, index) => {
      const beforeMatch = text.slice(currentIndex, match.index);
      if (beforeMatch) {
        parts.push(<span key={`text-${index}`}>{beforeMatch}</span>);
      }
      
      let mathContent = match[1];
      // Clean up Unicode characters that cause LaTeX issues
      mathContent = mathContent
        .replace(/Ω/g, '\\Omega')
        .replace(/α/g, '\\alpha')
        .replace(/β/g, '\\beta')
        .replace(/γ/g, '\\gamma')
        .replace(/δ/g, '\\delta')
        .replace(/π/g, '\\pi')
        .replace(/μ/g, '\\mu')
        .replace(/σ/g, '\\sigma')
        .replace(/λ/g, '\\lambda')
        .replace(/°/g, '^\\circ')
        .replace(/\s+/g, ' ')
        .trim();
      
      try {
        parts.push(
          <div key={`block-math-${index}`} className="my-4 text-center">
            <BlockMath math={mathContent} />
          </div>
        );
      } catch (error) {
        // Fallback for problematic LaTeX
        parts.push(
          <div key={`block-math-${index}`} className="my-4 text-center bg-gray-100 p-3 rounded font-mono text-sm">
            {mathContent}
          </div>
        );
      }
      
      currentIndex = (match.index || 0) + match[0].length;
    });
    
    const remainingText = text.slice(currentIndex);
    if (remainingText) {
      parts.push(<span key="text-end">{remainingText}</span>);
    }
    
    return <div>{parts}</div>;
  }
  
  // Look for inline math (single $ or \( \)) - improved to handle potential multiline
  const inlineMathRegex = /\$([^$]+?)\$|\\\(([\s\S]+?)\\\)/g;
  const inlineMatches = Array.from(text.matchAll(inlineMathRegex));
  
  if (inlineMatches.length > 0) {
    currentIndex = 0;
    inlineMatches.forEach((match, index) => {
      const beforeMatch = text.slice(currentIndex, match.index);
      if (beforeMatch) {
        parts.push(<span key={`text-${index}`}>{beforeMatch}</span>);
      }
      
      let mathContent = match[1] || match[2];
      // Clean up Unicode characters for inline math too
      mathContent = mathContent
        .replace(/Ω/g, '\\Omega')
        .replace(/α/g, '\\alpha')
        .replace(/β/g, '\\beta')
        .replace(/γ/g, '\\gamma')
        .replace(/δ/g, '\\delta')
        .replace(/π/g, '\\pi')
        .replace(/μ/g, '\\mu')
        .replace(/σ/g, '\\sigma')
        .replace(/λ/g, '\\lambda')
        .replace(/°/g, '^\\circ')
        .trim();
      
      try {
        parts.push(
          <InlineMath key={`inline-math-${index}`} math={mathContent} />
        );
      } catch (error) {
        // Fallback for problematic LaTeX
        parts.push(
          <code key={`inline-math-${index}`} className="bg-gray-100 px-1 rounded font-mono text-sm">
            {mathContent}
          </code>
        );
      }
      
      currentIndex = (match.index || 0) + match[0].length;
    });
    
    const remainingText = text.slice(currentIndex);
    if (remainingText) {
      parts.push(<span key="text-end">{remainingText}</span>);
    }
    
    return <span>{parts}</span>;
  }
  
  // Check for bold patterns and render them properly
  if (text.includes('**')) {
    const boldParts = text.split(/(\*\*.*?\*\*)/);
    return (
      <span>
        {boldParts.map((part, i) => 
          part.startsWith('**') && part.endsWith('**') ? 
            <span key={i} className="font-bold text-blue-800 bg-blue-50 px-1 rounded">
              {part.slice(2, -2)}
            </span> : 
            <span key={i}>{part}</span>
        )}
      </span>
    );
  }
  
  return <span>{text}</span>;
};

// Helper function to render formatted text (bold, etc.) - consistent with lesson generation
const renderFormattedText = (text: string) => {
  if (!text) return <span></span>;

  // Handle bold text patterns with **text**
  if (text.includes('**')) {
    const parts: React.ReactNode[] = [];
    const segments = text.split(/(\*\*.*?\*\*)/);

    segments.forEach((segment, index) => {
      if (segment.startsWith('**') && segment.endsWith('**')) {
        parts.push(
          <strong key={index} className="font-bold text-blue-800 bg-blue-50 px-1 rounded">
            {segment.slice(2, -2)}
          </strong>
        );
      } else if (segment) {
        parts.push(<span key={index}>{segment}</span>);
      }
    });

    return <span>{parts}</span>;
  }

  return <span>{text}</span>;
};

// Helper function to render a complete line with proper formatting - consistent with lesson generation
const renderLine = (line: string, index: number) => {
  const trimmedLine = line.trim();

  // Major headers (CBSE, School names, etc.)
  if (trimmedLine.includes('CENTRAL BOARD') || trimmedLine.includes('CBSE') || 
      trimmedLine.includes('EXAMINATION') || trimmedLine.includes('CLASS') ||
      trimmedLine.match(/^[A-Z\s]+$/)) {
    return (
      <div key={index} className="text-center font-bold text-xl mb-4 text-gray-900 border-b-2 pb-2">
        {renderMathContent(trimmedLine)}
      </div>
    );
  }

  // Subject, Time, Marks information
  if (trimmedLine.includes('Subject:') || trimmedLine.includes('Time:') || 
      trimmedLine.includes('Maximum Marks:') || trimmedLine.includes('M.M:')) {
    return (
      <div key={index} className="text-center font-semibold text-lg mb-3 text-gray-800">
        {renderMathContent(trimmedLine)}
      </div>
    );
  }

  // Section headers (SECTION A, SECTION B, etc.)
  if (trimmedLine.match(/^SECTION [A-Z]/i) || trimmedLine.includes('SECTION')) {
    return (
      <div key={index} className="text-xl font-bold mt-8 mb-4 text-blue-800 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-800">
        {renderMathContent(trimmedLine)}
      </div>
    );
  }

  // General Instructions
  if (trimmedLine.includes('GENERAL INSTRUCTIONS') || trimmedLine.includes('Instructions:')) {
    return (
      <div key={index} className="text-lg font-bold mt-6 mb-4 text-green-700 bg-green-50 p-3 rounded-lg">
        {renderMathContent(trimmedLine)}
      </div>
    );
  }

  // Question numbers (Q1, Q2, 1., 2., etc.)
  if (trimmedLine.match(/^(Q\d+|Question \d+|\d+\.)/i)) {
    return (
      <div key={index} className="mt-6 mb-3 p-3 bg-gray-50 rounded-lg border-l-4 border-gray-400">
        <span className="font-semibold text-gray-800 bg-white px-3 py-1 rounded shadow-sm">
          {renderMathContent(trimmedLine)}
        </span>
      </div>
    );
  }

  // Sub-parts (a), (b), (c), etc.
  if (trimmedLine.match(/^\([a-z]\)/i)) {
    return (
      <div key={index} className="ml-6 mt-3 mb-2 text-gray-700">
        <span className="font-medium bg-yellow-50 px-2 py-1 rounded">
          {renderMathContent(trimmedLine)}
        </span>
      </div>
    );
  }

  // Bullet points or numbered lists
  if (trimmedLine.match(/^[-•]\s/) || trimmedLine.match(/^\d+\.\s/)) {
    return (
      <div key={index} className="ml-4 mb-2 text-gray-700 flex items-start gap-2">
        <span className="text-blue-600 font-bold mt-1">•</span>
        <span className="flex-1">{renderMathContent(trimmedLine.replace(/^[-•]\s/, '').replace(/^\d+\.\s/, ''))}</span>
      </div>
    );
  }

  // Empty lines
  if (!trimmedLine) {
    return <div key={index} className="mb-3"></div>;
  }

  // Regular content lines
  return (
    <div key={index} className="mb-3 text-gray-800 leading-relaxed text-base">
      {renderMathContent(trimmedLine)}
    </div>
  );
};

export const AIExamGenerator = () => {
  const [config, setConfig] = useState<ExamConfig>({
    grade: '',
    subject: '',
    sub_topic: '',
    difficulty: 'medium',
    question_types: ['mcq'],
    duration: 60,
    special_remarks: '',
    total_marks: 100
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [configOptions, setConfigOptions] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('setup');
  const { toast } = useToast();
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  
  // Use persistent document state
  const { documentState, saveGeneratedExam, clearGeneratedExam, setActiveDocument } = useDocumentState();
  
  // Get generated exam from persistent state
  const generatedExam = documentState.generatedExam ? {
    success: true,
    paper_content: documentState.generatedExam.content,
    metadata: documentState.generatedExam.metadata
  } : null;
  
  // Check if we have a previously generated exam on component mount
  useEffect(() => {
    if (documentState.generatedExam && documentState.activeDocument === 'exam') {
      setActiveTab('preview');
    }
  }, [documentState.generatedExam, documentState.activeDocument]);

  // Fetch configuration options from backend
  React.useEffect(() => {
    fetchConfigOptions();
  }, []);

  const fetchConfigOptions = async () => {
    try {
      const response = await fetch('/api/config-options');
      if (response.ok) {
        const options = await response.json();
        setConfigOptions(options);
      }
    } catch (error) {
      // Fallback options if API call fails
      setConfigOptions({
        grades: ['6', '7', '8', '9', '10', '11', '12'],
        subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'],
        difficulty_levels: ['easy', 'medium', 'hard', 'mixed'],
        question_types: ['mcq', 'short_answer', 'long_answer', 'numerical', 'diagram', 'mixed'],
        exam_durations: ['30', '60', '90', '120', '180']
      });
    }
  };

  const validateTopic = async () => {
    if (!config.grade || !config.subject || !config.sub_topic) {
      toast({
        title: "Validation Error",
        description: "Please fill in grade, subject, and topic before validating.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/validate-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grade: config.grade,
          subject: config.subject,
          sub_topic: config.sub_topic
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Validation successful
        
        if (result.valid) {
          toast({
            title: "Topic Validated",
            description: result.curriculum_aligned ? 
              "Topic is aligned with CBSE curriculum" : 
              "Topic validation completed with warnings",
            variant: result.curriculum_aligned ? "default" : "destructive"
          });
        } else {
          toast({
            title: "Validation Failed",
            description: result.error,
            variant: "destructive"
          });
        }
      } else {
        throw new Error('Validation failed');
      }
    } catch (error) {
      toast({
        title: "Validation Error",
        description: "Could not validate topic. Please check your connection.",
        variant: "destructive"
      });
    }
  };

  const saveExamToDatabase = async (examContent: string, examMetadata: any) => {
    if (!isAuthenticated) return;
    
    try {
      const token = await getAccessTokenSilently();
      
      const response = await fetch('/api/protected/teacher-content/save-exam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: `${config.subject} Exam - ${config.sub_topic}`,
          description: `Grade ${config.grade} ${config.difficulty} difficulty exam`,
          input_parameters: config,
          generated_content: examContent,
          metadata: examMetadata,
          exam_config: config,
          questions: examMetadata.questions || [],
          total_marks: examMetadata.total_marks || config.total_marks,
          estimated_time: config.duration,
          question_distribution: examMetadata.question_distribution || {},
          marking_scheme: examMetadata.marking_scheme || ''
        })
      });

      if (response.ok) {
        console.log('Exam saved to database successfully');
      } else {
        console.error('Failed to save exam to database');
      }
    } catch (error) {
      console.error('Error saving exam to database:', error);
    }
  };

  const generateExam = async () => {
    if (!config.grade || !config.subject || !config.sub_topic) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before generating the exam.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    clearGeneratedExam(); // Clear previous exam from persistent state
    setLoadingProgress(0);
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const response = await fetch('/api/generate-exam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          // Save to persistent state
          saveGeneratedExam(result.paper_content || '', {
            ...result.metadata,
            config: config,
            generated_at: new Date().toISOString()
          });
          
          // Save to database if authenticated
          if (isAuthenticated) {
            await saveExamToDatabase(result.paper_content || '', result.metadata || {});
          }
          
          setLoadingProgress(100);
          setActiveDocument('exam');
          // Automatically switch to preview tab when exam is generated
          setActiveTab('preview');
          setTimeout(() => {
            toast({
              title: "Exam Generated Successfully",
              description: `Created ${result.metadata?.total_questions} questions worth ${result.metadata?.total_marks} marks`,
            });
          }, 300);
        } else {
          toast({
            title: "Generation Failed",
            description: result.error,
            variant: "destructive"
          });
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Exam generation error:', error);

      toast({
        title: "Generation Error",
        description: error instanceof Error ? error.message : "Could not generate exam. Please try again.",
        variant: "destructive"
      });
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
      setLoadingProgress(0);
    }
  };

  const downloadExamAsPDF = async () => {
    if (!generatedExam?.paper_content) return;

    try {
      const options = {
        title: `${config.subject} Examination`,
        subject: config.subject,
        grade: config.grade,
        topic: config.sub_topic,
        type: 'exam' as const
      };
      
      // Use the enhanced PDF generator with KaTeX support
      await generateEnhancedPDF(generatedExam.paper_content, options);
      
      toast({
        title: "PDF Downloaded",
        description: "Exam paper has been downloaded as PDF with proper mathematical formatting.",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Download Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const downloadExamAsText = () => {
    if (!generatedExam?.paper_content) return;

    const blob = new Blob([generatedExam.paper_content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CBSE_Exam_${config.subject}_Grade${config.grade}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Text File Downloaded",
      description: "Exam paper has been downloaded as text file.",
    });
  };

  const copyToClipboard = () => {
    if (!generatedExam?.paper_content) return;

    navigator.clipboard.writeText(generatedExam.paper_content);
    toast({
      title: "Copied to Clipboard",
      description: "Exam paper content has been copied to clipboard.",
    });
  };

  const handleQuestionTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setConfig(prev => ({
        ...prev,
        question_types: [...prev.question_types, type]
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        question_types: prev.question_types.filter(t => t !== type)
      }));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-purple-600" />
            AI Exam Generator
          </CardTitle>
          <CardDescription>
            Generate CBSE-aligned examination papers using AI. Configure your requirements and create professional test papers instantly.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="setup">Configure Exam</TabsTrigger>
          <TabsTrigger value="preview">Preview & Download</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exam Configuration</CardTitle>
              <CardDescription>Set up the parameters for your examination paper</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade/Class *</Label>
                  <Select value={config.grade} onValueChange={(value) => setConfig(prev => ({ ...prev, grade: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {configOptions?.grades?.map((grade: string) => (
                        <SelectItem key={grade} value={grade}>Class {grade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Select value={config.subject} onValueChange={(value) => setConfig(prev => ({ ...prev, subject: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {configOptions?.subjects?.map((subject: string) => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select value={config.difficulty} onValueChange={(value) => setConfig(prev => ({ ...prev, difficulty: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {configOptions?.difficulty_levels?.map((level: string) => (
                        <SelectItem key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Topic and Validation */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Chapter/Topic *</Label>
                  <Input
                    id="topic"
                    placeholder="Enter chapter or topic name"
                    value={config.sub_topic}
                    onChange={(e) => setConfig(prev => ({ ...prev, sub_topic: e.target.value }))}
                  />
                </div>
              </div>

              {/* Question Types */}
              <div className="space-y-4">
                <Label>Question Types *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {configOptions?.question_types?.filter((type: string) => type !== 'mixed').map((type: string) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={config.question_types.includes(type)}
                        onCheckedChange={(checked) => handleQuestionTypeChange(type, checked as boolean)}
                      />
                      <Label htmlFor={type} className="text-sm font-normal cursor-pointer">
                        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Duration and Marks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select value={config.duration.toString()} onValueChange={(value) => setConfig(prev => ({ ...prev, duration: parseInt(value) }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {configOptions?.exam_durations?.map((duration: string) => (
                        <SelectItem key={duration} value={duration}>{duration} minutes</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marks">Total Marks</Label>
                  <Input
                    id="marks"
                    type="number"
                    placeholder="100"
                    value={config.total_marks}
                    onChange={(e) => setConfig(prev => ({ ...prev, total_marks: parseInt(e.target.value) || 100 }))}
                  />
                </div>
              </div>

              {/* Special Instructions */}
              <div className="space-y-2">
                <Label htmlFor="remarks">Special Instructions/Remarks</Label>
                <Textarea
                  id="remarks"
                  placeholder="Any specific instructions for the exam (e.g., focus on application-based problems, include diagrams, etc.)"
                  value={config.special_remarks}
                  onChange={(e) => setConfig(prev => ({ ...prev, special_remarks: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Generate Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={generateExam} 
                  disabled={isGenerating || !config.grade || !config.subject || !config.sub_topic}
                  className="min-w-[200px]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Exam...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Exam Paper
                    </>
                  )}
                </Button>
                
                {/* Loading Progress */}
                {isGenerating && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Generating exam paper...</span>
                      <span className="text-purple-600">{Math.round(loadingProgress)}%</span>
                    </div>
                    <Progress value={loadingProgress} className="h-2" />
                    <p className="text-xs text-gray-500 text-center">
                      {loadingProgress < 30 ? 'Analyzing curriculum standards...' :
                       loadingProgress < 60 ? 'Creating questions...' :
                       loadingProgress < 90 ? 'Preparing marking scheme...' :
                       'Finalizing exam paper...'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {generatedExam?.success && (
            <>
              {/* Exam Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      Exam Generated Successfully
                    </span>
                    <div className="flex gap-2">
                      <Button onClick={copyToClipboard} variant="outline" size="sm">
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      <Button onClick={downloadExamAsPDF} size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                      <Button onClick={clearGeneratedExam} variant="outline" size="sm">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Clear Previous
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{generatedExam.metadata?.total_questions}</div>
                      <div className="text-sm text-blue-700">Total Questions</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{generatedExam.metadata?.total_marks}</div>
                      <div className="text-sm text-green-700">Total Marks</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{generatedExam.metadata?.duration}</div>
                      <div className="text-sm text-purple-700">Minutes</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {generatedExam.metadata?.curriculum_aligned ? 'Yes' : 'No'}
                      </div>
                      <div className="text-sm text-orange-700">CBSE Aligned</div>
                    </div>
                  </div>

                  {generatedExam.metadata?.question_distribution && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Question Distribution:</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(generatedExam.metadata.question_distribution).map(([type, count]) => (
                          <Badge key={type} variant="secondary">
                            {type.replace('_', ' ')}: {String(count)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Download Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-6 h-6" />
                    Download Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    <Button onClick={downloadExamAsPDF} className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Download as PDF
                    </Button>
                    <Button variant="outline" onClick={downloadExamAsText} className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Download as Text
                    </Button>
                    <Button variant="outline" onClick={copyToClipboard} className="flex items-center gap-2">
                      <Copy className="w-4 h-4" />
                      Copy to Clipboard
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Exam Content Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    Exam Paper Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] w-full border rounded-md p-6 bg-white">
                    <div className="exam-paper-content prose prose-sm max-w-none">
                      {cleanMarkdownHeaders(generatedExam.paper_content || '').split('\n').map((line, index) => renderLine(line, index))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}

          {generatedExam && !generatedExam.success && (
            <Card>
              <CardContent className="pt-6">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Generation Failed:</strong> {generatedExam.error}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {!generatedExam && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Exam Generated Yet</h3>
                  <p className="text-gray-500">Configure your exam parameters and generate a paper to see the preview here.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};