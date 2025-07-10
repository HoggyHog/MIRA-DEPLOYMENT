import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Download, 
  FileText, 
  Lightbulb,
  Target,
  Loader2,
  CheckCircle,
  Upload,
  File,
  Copy,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { generateEnhancedPDF } from '@/lib/pdfGenerator';
import { useDocumentState } from '@/contexts/DocumentStateContext';

// Helper function to render content with line-by-line math processing
const renderLineByLineContent = (text: string) => {
  if (!text) return <div></div>;

  const lines = text.split('\n');
  const processedLines: React.ReactNode[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Check for block math patterns
    if (trimmedLine.match(/^\\\[/) || trimmedLine.match(/^\$\$/)) {
      let mathBlock = line;
      
      // Look for closing delimiter
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].includes('\\]') || lines[j].includes('$$')) {
          mathBlock += '\n' + lines[j];
          i = j; // Skip processed lines
          break;
        }
        mathBlock += '\n' + lines[j];
        i = j; // Skip processed lines
      }
      
      // Extract and clean math content
      let mathContent = mathBlock
        .replace(/^\\\[/, '')
        .replace(/\\\]$/, '')
        .replace(/^\$\$/, '')
        .replace(/\$\$$/, '')
        .trim();
      
      // Normalize Unicode characters and LaTeX formatting
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
        .replace(/₹/g, '\\text{₹}')
        .replace(/\\frac\s*\{\s*/g, '\\frac{')
        .replace(/\s*\}\s*\{\s*/g, '}{')
        .replace(/\s*\}\s*/g, '}')
        .replace(/\s*\\times\s*/g, ' \\times ')
        .replace(/\s*\\approx\s*/g, ' \\approx ')
        .replace(/\s+/g, ' ')
        .trim();
      
      try {
        processedLines.push(
          <div key={`math-${i}`} className="my-4 text-center">
            <BlockMath math={mathContent} />
          </div>
        );
      } catch (error) {
        processedLines.push(
          <div key={`math-error-${i}`} className="my-4 text-center bg-red-50 p-3 rounded border border-red-200">
            <code className="text-sm text-red-700">{mathContent}</code>
          </div>
        );
      }
    } else {
      // Process regular line with inline math and formatting
      processedLines.push(renderLine(line, i));
    }
  }

  return <div>{processedLines}</div>;
};

interface GeneratedLesson {
  success: boolean;
  lesson_content?: string;
  lesson_data?: {
    title: string;
    metadata: {
      subject: string;
      grade_level: string;
      topic: string;
      subtopics: string[];
      learning_objectives: string[];
      standards_alignment: string[];
      prerequisites: string[];
    };
    components: Array<{
      component_type: string;
      content: string;
      order: number;
    }>;
    version: string;
    created_at: number;
  };
  error?: string;
}

// Helper function to render text with math support and proper markdown formatting
const renderMathContent = (text: string) => {
  if (!text) return <span></span>;

  const parts: React.ReactNode[] = [];
  let currentIndex = 0;

  // Look for block math (double $$ or \[ \]) - more permissive pattern
  const blockMathRegex = /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]/g;
  const blockMatches = Array.from(text.matchAll(blockMathRegex));

  if (blockMatches.length > 0) {
    blockMatches.forEach((match, index) => {
      const beforeMatch = text.slice(currentIndex, match.index);
      if (beforeMatch) {
        parts.push(<span key={`text-${index}`}>{renderInlineContent(beforeMatch)}</span>);
      }

      let mathContent = match[1] || match[2];

      // Clean up Unicode characters and normalize LaTeX expressions
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
        // Fix common LaTeX formatting issues
        .replace(/\\frac\s*\{\s*/g, '\\frac{')
        .replace(/\s*\}\s*\{\s*/g, '}{')
        .replace(/\s*\}\s*/g, '}')
        .replace(/\s*\\approx\s*/g, ' \\approx ')
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

      currentIndex = match.index! + match[0].length;
    });

    const remainingText = text.slice(currentIndex);
    if (remainingText) {
      parts.push(<span key="text-end">{renderInlineContent(remainingText)}</span>);
    }

    return <div>{parts}</div>;
  }

  // If no block math, render as inline content
  return renderInlineContent(text);
};

// Helper function to render inline content with math and formatting
const renderInlineContent = (text: string) => {
  if (!text) return <span></span>;

  const parts: React.ReactNode[] = [];
  let currentIndex = 0;

  // Look for inline math (single $ or \( \))
  const inlineMathRegex = /\$([^$]+?)\$|\\\(([\s\S]+?)\\\)/g;
  const inlineMatches = Array.from(text.matchAll(inlineMathRegex));

  if (inlineMatches.length > 0) {
    inlineMatches.forEach((match, index) => {
      const beforeMatch = text.slice(currentIndex, match.index);
      if (beforeMatch) {
        parts.push(<span key={`text-${index}`}>{renderFormattedText(beforeMatch)}</span>);
      }

      let mathContent = match[1] || match[2];
      // Clean up Unicode characters and normalize LaTeX expressions for inline math
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
        // Fix common LaTeX formatting issues for inline math
        .replace(/\\frac\s*\{\s*/g, '\\frac{')
        .replace(/\s*\}\s*\{\s*/g, '}{')
        .replace(/\s*\}\s*/g, '}')
        .replace(/\s*\\approx\s*/g, ' \\approx ')
        .replace(/\s+/g, ' ')
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

      currentIndex = match.index! + match[0].length;
    });

    const remainingText = text.slice(currentIndex);
    if (remainingText) {
      parts.push(<span key="text-end">{renderFormattedText(remainingText)}</span>);
    }

    return <span>{parts}</span>;
  }

  // If no inline math, render as formatted text
  return renderFormattedText(text);
};

// Helper function to render formatted text (bold, etc.)
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



// Helper function to render a complete line with proper formatting
const renderLine = (line: string, index: number) => {
  const trimmedLine = line.trim();

  // Main headers (# Lesson Title)
  if (trimmedLine.startsWith('# ')) {
    return (
      <div key={index} className="mb-6">
        <h1 className="text-3xl font-bold text-blue-900 border-b-3 border-blue-300 pb-3 mb-4">
          {renderMathContent(trimmedLine.substring(2))}
        </h1>
      </div>
    );
  }

  // Section headers (## Section Name)
  if (trimmedLine.startsWith('## ')) {
    return (
      <div key={index} className="mt-8 mb-4">
        <h2 className="text-2xl font-bold text-blue-800 bg-blue-50 px-4 py-2 rounded-lg border-l-4 border-blue-600">
          {renderMathContent(trimmedLine.substring(3))}
        </h2>
      </div>
    );
  }

  // Subsection headers (### Subsection)
  if (trimmedLine.startsWith('### ')) {
    return (
      <div key={index} className="mt-6 mb-3">
        <h3 className="text-xl font-semibold text-blue-700 border-l-3 border-blue-400 pl-3">
          {renderMathContent(trimmedLine.substring(4))}
        </h3>
      </div>
    );
  }

  // Sub-subsection headers (#### Sub-subsection)
  if (trimmedLine.startsWith('#### ')) {
    return (
      <div key={index} className="mt-5 mb-2">
        <h4 className="text-lg font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded border-l-2 border-purple-400">
          {renderMathContent(trimmedLine.substring(5))}
        </h4>
      </div>
    );
  }

  // Minor headers (##### Minor)
  if (trimmedLine.startsWith('##### ')) {
    return (
      <div key={index} className="mt-4 mb-2">
        <h5 className="text-base font-medium text-gray-700 border-l-2 border-gray-300 pl-2">
          {renderMathContent(trimmedLine.substring(6))}
        </h5>
      </div>
    );
  }

  // Special formatting for time indicators (5-10 minutes)
  if (trimmedLine.match(/\(\d+-?\d*\s*minutes?\)/)) {
    return (
      <div key={index} className="mt-4 mb-3">
        <h3 className="text-lg font-semibold text-green-700 bg-green-50 px-3 py-2 rounded-md border border-green-200">
          {renderMathContent(trimmedLine)}
        </h3>
      </div>
    );
  }

  // Lists with bullets or numbers
  if (trimmedLine.match(/^[-*•]\s/) || trimmedLine.match(/^\d+\.\s/)) {
    const content = trimmedLine.replace(/^[-*•]\s/, '').replace(/^\d+\.\s/, '');
    return (
      <div key={index} className="ml-6 mb-2 text-gray-700 leading-relaxed">
        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2"></span>
        {renderMathContent(content)}
      </div>
    );
  }

  // Special formatting for Subject, Grade Level, etc.
  if (trimmedLine.match(/^-\s\*\*(Subject|Grade Level|Topic|Duration):\*\*/)) {
    return (
      <div key={index} className="mb-2 p-2 bg-gray-50 rounded border-l-4 border-gray-400">
        <span className="text-gray-800 leading-relaxed font-medium">
          {renderMathContent(trimmedLine)}
        </span>
      </div>
    );
  }

  // Content in square brackets [descriptions]
  if (trimmedLine.includes('[') && trimmedLine.includes(']')) {
    return (
      <div key={index} className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <span className="text-gray-700 italic">
          {renderMathContent(trimmedLine)}
        </span>
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



export const LecturePreparation = () => {
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    subtopics: '',
    grade_level: '10',
    special_requirements: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('form');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const { toast } = useToast();
  
  // Use persistent document state
  const { documentState, saveGeneratedLesson, clearGeneratedLesson, setActiveDocument } = useDocumentState();
  
  // Get generated lesson from persistent state
  const generatedLesson = documentState.generatedLesson ? {
    success: true,
    lesson_content: documentState.generatedLesson.content,
    lesson_data: documentState.generatedLesson.metadata
  } : null;
  
  // Check if we have a previously generated lesson on component mount
  useEffect(() => {
    if (documentState.generatedLesson && documentState.activeDocument === 'lesson') {
      setActiveTab('preview');
    }
  }, [documentState.generatedLesson, documentState.activeDocument]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateLesson = async () => {
    if (!formData.subject || !formData.topic || !formData.subtopics) {
      toast({
        title: "Missing Information",
        description: "Please fill in subject, topic, and subtopics before generating the lesson.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    clearGeneratedLesson(); // Clear previous lesson from persistent state
    setLoadingProgress(0);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 12;
      });
    }, 600);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('grade_level', formData.grade_level);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('topic', formData.topic);
      formDataToSend.append('subtopics', formData.subtopics);
      formDataToSend.append('special_requirements', formData.special_requirements || '');

      const response = await fetch('/api/generate-lesson', {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          // Save to persistent state
          saveGeneratedLesson(result.lesson_content || '', {
            title: `${formData.subject} - ${formData.topic}`,
            formData: formData,
            generated_at: new Date().toISOString()
          });
          
          setLoadingProgress(100);
          setActiveDocument('lesson');
          setTimeout(() => {
            setActiveTab('preview');
            toast({
              title: "Lesson Generated Successfully",
              description: "Your comprehensive lesson plan is ready for review."
            });
          }, 100);
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
      console.error('Lesson generation error:', error);

      toast({
        title: "Generation Error",
        description: error instanceof Error ? error.message : "Could not generate lesson. Please try again.",
        variant: "destructive"
      });
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
      setLoadingProgress(0);
    }
  };

  const downloadLesson = () => {
    if (!generatedLesson?.lesson_content) return;

    const blob = new Blob([generatedLesson.lesson_content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.subject}_${formData.topic}_lesson_plan.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Complete",
      description: "Lesson plan downloaded successfully."
    });
  };

  const downloadLessonAsPDF = async () => {
    if (!generatedLesson?.lesson_content) return;

    setIsGeneratingPDF(true);
    
    try {
      const pdfOptions = {
        title: `${formData.subject} - ${formData.topic}`,
        subject: formData.subject,
        grade: formData.grade_level,
        topic: formData.topic,
        type: 'lesson' as const
      };

      // Use the enhanced PDF generator with KaTeX support and lesson formatting
      await generateEnhancedPDF(generatedLesson.lesson_content, pdfOptions);
      
      toast({
        title: "PDF Download Complete",
        description: "Lesson plan PDF downloaded with proper mathematical formatting."
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "PDF Generation Failed",
        description: "Failed to generate PDF. Please try downloading as markdown instead.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedLesson?.lesson_content) return;

    navigator.clipboard.writeText(generatedLesson.lesson_content).then(() => {
      toast({
        title: "Copied to Clipboard",
        description: "Lesson plan copied to clipboard successfully."
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BookOpen className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold">AI-Powered Comprehensive Lesson Preparation</h2>
          <p className="text-gray-600">Generate detailed, curriculum-aligned lesson plans with AI assistance</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form" className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Lesson Configuration</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Generated Lesson</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5" />
                <span>Lesson Parameters</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="e.g., Mathematics, Science, English"
                  />
                </div>
                <div>
                  <Label htmlFor="grade_level">Grade Level *</Label>
                  <Input
                    id="grade_level"
                    value={formData.grade_level}
                    onChange={(e) => handleInputChange('grade_level', e.target.value)}
                    placeholder="e.g., 10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="topic">Main Topic *</Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => handleInputChange('topic', e.target.value)}
                  placeholder="e.g., Quadratic Equations, Photosynthesis, Shakespeare's Sonnets"
                />
              </div>

              <div>
                <Label htmlFor="subtopics">Subtopics *</Label>
                <Textarea
                  id="subtopics"
                  value={formData.subtopics}
                  onChange={(e) => handleInputChange('subtopics', e.target.value)}
                  placeholder="Enter comma-separated subtopics, e.g., Solving by factoring, Quadratic formula, Graphing parabolas"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="special_requirements">Special Requirements</Label>
                <Textarea
                  id="special_requirements"
                  value={formData.special_requirements}
                  onChange={(e) => handleInputChange('special_requirements', e.target.value)}
                  placeholder="Any specific requirements, teaching methods, or considerations for this lesson..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={generateLesson} 
                disabled={isGenerating || !formData.subject || !formData.topic || !formData.subtopics}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Comprehensive Lesson Plan...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5 mr-2" />
                    Generate Lesson Plan
                  </>
                )}
              </Button>

              {/* Loading Progress */}
              {isGenerating && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Creating lesson plan...</span>
                    <span className="text-green-600">{Math.round(loadingProgress)}%</span>
                  </div>
                  <Progress value={loadingProgress} className="h-2" />
                  <p className="text-xs text-gray-500 text-center">
                    {loadingProgress < 25 ? 'Analyzing curriculum objectives...' :
                     loadingProgress < 50 ? 'Structuring learning activities...' :
                     loadingProgress < 75 ? 'Creating assessment materials...' :
                     'Finalizing lesson plan...'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {generatedLesson && generatedLesson.success && (
            <>
              {/* Lesson Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      Lesson Generated Successfully
                    </span>
                    <div className="flex gap-2">
                      <Button onClick={copyToClipboard} variant="outline" size="sm">
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      <Button onClick={downloadLesson} variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        Markdown
                      </Button>
                      <Button 
                        onClick={downloadLessonAsPDF} 
                        size="sm"
                        disabled={isGeneratingPDF}
                      >
                        {isGeneratingPDF ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        {isGeneratingPDF ? 'Generating...' : 'PDF'}
                      </Button>
                      <Button onClick={clearGeneratedLesson} variant="outline" size="sm">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Clear Previous
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{formData.subject}</div>
                        <div className="text-sm text-blue-700">Subject</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">Grade {formData.grade_level}</div>
                        <div className="text-sm text-green-700">Level</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">{formData.topic}</div>
                        <div className="text-sm text-purple-700">Topic</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-lg font-bold text-orange-600">{formData.subtopics}</div>
                        <div className="text-sm text-orange-700">Subtopics</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lesson Content Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    Comprehensive Lesson Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] w-full border rounded-md p-6 bg-white">
                    <div id="lesson-content-container" className="lesson-content prose prose-lg max-w-none">
                      {renderLineByLineContent(generatedLesson.lesson_content || '')}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}

          {generatedLesson && !generatedLesson.success && (
            <Card>
              <CardContent className="pt-6">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Generation Failed:</strong> {(generatedLesson as any).error || 'Unknown error occurred'}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {!generatedLesson && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Lesson Generated Yet</h3>
                  <p className="text-gray-500">Configure your lesson parameters and generate a comprehensive lesson plan to see the preview here.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};