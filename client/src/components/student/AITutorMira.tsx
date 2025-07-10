import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  Video,
  Presentation,
  Brain,
  MessageCircle,
  BookOpen,
  Target,
  Lightbulb,
  Loader2,
  Send,
  User,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Star,
  Clock,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Content {
  id: string;
  title: string;
  type: 'pdf' | 'youtube' | 'slides' | 'text';
  uploadDate: Date;
  summary?: string;
  file?: File;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ExamQuestion {
  id: string;
  question: string;
  options?: string[];
  correct_answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const AITutorMira = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedContent, setUploadedContent] = useState<Content[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm Mira, your AI tutor. I'm here to help you understand any topic, create personalized tests, and guide you through your learning journey. What would you like to learn about today?",
      timestamp: new Date()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [examConfig, setExamConfig] = useState({
    topic: '',
    grade: '10',
    difficulty: 'medium',
    numQuestions: 5
  });
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const { toast } = useToast();
  const [summaries, setSummaries] = useState<{ [id: string]: string }>({});
  const [isSummarizing, setIsSummarizing] = useState<{ [id: string]: boolean }>({});
  const fileInputRefs = useRef<{ [id: string]: HTMLInputElement | null }>({});

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF file.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newContent: Content = {
        id: Date.now().toString(),
        title: file.name.replace('.pdf', ''),
        type: 'pdf',
        uploadDate: new Date(),
        summary: `Processed PDF content: ${file.name}. Ready for AI analysis and personalized learning.`
      };

      setUploadedContent(prev => [...prev, {
        id: Date.now().toString(),
        title: file.name.replace('.pdf', ''),
        type: 'pdf',
        uploadDate: new Date(),
        file: file, // <-- store the actual file!
        summary: `Processed PDF content: ${file.name}. Ready for AI analysis and personalized learning.`
      }]);
      
      toast({
        title: "Content Uploaded",
        description: "Your PDF has been processed and is ready for AI tutoring.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to process the PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleYouTubeUpload = async () => {
    if (!youtubeUrl.trim()) {
      toast({
        title: "Missing URL",
        description: "Please enter a YouTube URL.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate YouTube processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const videoTitle = `YouTube Video: ${youtubeUrl.split('v=')[1]?.substring(0, 8) || 'Video'}`;
      const newContent: Content = {
        id: Date.now().toString(),
        title: videoTitle,
        type: 'youtube',
        uploadDate: new Date(),
        summary: `Processed YouTube video content. Extracted key concepts and learning objectives for personalized tutoring.`
      };

      setUploadedContent(prev => [...prev, newContent]);
      setYoutubeUrl('');
      
      toast({
        title: "Video Processed",
        description: "YouTube video content has been analyzed and is ready for learning.",
      });
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: "Failed to process the YouTube video. Please check the URL and try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextContent = async () => {
    if (!textContent.trim()) {
      toast({
        title: "Missing Content",
        description: "Please enter some text content.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate text processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newContent: Content = {
        id: Date.now().toString(),
        title: `Text Content: ${textContent.substring(0, 30)}...`,
        type: 'text',
        uploadDate: new Date(),
        summary: `Processed text content. Identified key topics and learning objectives for AI tutoring.`
      };

      setUploadedContent(prev => [...prev, newContent]);
      setTextContent('');
      
      toast({
        title: "Content Processed",
        description: "Your text content has been analyzed and is ready for tutoring.",
      });
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: "Failed to process the text content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    const questionToSend = currentMessage;
    setCurrentMessage('');
    setIsChatting(true);

    try {
      const requestData = {
        content_sources: uploadedContent.map(content => ({
          source_type: content.type,
          content: content.summary || 'Educational content for tutoring',
          title: content.title,
          metadata: {}
        })),
        chat_history: chatMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        current_question: questionToSend,
        student_grade: '10',
        subject: 'General Studies'
      };

      const response = await fetch('/api/ai-tutor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const result = await response.json();

      if (result.success) {
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.response,
          timestamp: new Date()
        };

        setChatMessages(prev => [...prev, aiResponse]);
      } else {
        throw new Error(result.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Chat Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsChatting(false);
    }
  };

  const generatePersonalizedExam = async () => {
    if (!examConfig.topic.trim()) {
      toast({
        title: "Missing Topic",
        description: "Please enter a topic for the exam.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingExam(true);

    try {
      const requestData = {
        content_sources: uploadedContent.map(content => ({
          source_type: content.type,
          content: content.summary || `Content about ${examConfig.topic}`,
          title: content.title,
          metadata: {}
        })),
        student_grade: examConfig.grade || '10',
        subject: examConfig.topic,
        num_questions: examConfig.numQuestions,
        difficulty_level: examConfig.difficulty,
        question_types: ['mcq', 'short_answer']
      };

      const response = await fetch('/api/ai-tutor/generate-exam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Exam generation failed');
      }

      const result = await response.json();

      if (result.success) {
        const convertedQuestions: ExamQuestion[] = result.questions.map((q: any) => ({
          id: q.id.toString(),
          question: q.question,
          options: q.options || [],
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          difficulty: examConfig.difficulty as 'easy' | 'medium' | 'hard'
        }));

        setExamQuestions(convertedQuestions);
        
        toast({
          title: "Exam Generated",
          description: `Created ${result.questions.length} personalized questions.`,
        });
      } else {
        throw new Error(result.error || 'Failed to generate exam');
      }
    } catch (error) {
      console.error('Exam generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate the exam. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingExam(false);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5" />;
      case 'youtube': return <Video className="w-5 h-5" />;
      case 'slides': return <Presentation className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const renderMathContent = (content: string) => {
    // First, let's convert common math patterns to LaTeX if they aren't already
    let processedContent = content;
    
    // Convert multiplication symbols
    processedContent = processedContent.replace(/(\d+)\s*×\s*(\d+)/g, '\\($1 \\times $2\\)');
    processedContent = processedContent.replace(/(\d+)\s*\*\s*(\d+)/g, '\\($1 \\times $2\\)');
    
    // Convert equals in mathematical contexts
    processedContent = processedContent.replace(/(\d+(?:\.\d+)?)\s*=\s*(\d+(?:,\d{3})*(?:\.\d+)?)/g, '\\($1 = $2\\)');
    
    // Convert units (W, J, s, etc.)
    processedContent = processedContent.replace(/(\d+(?:,\d{3})*(?:\.\d+)?)\s*(W|J|s|hours?|minutes?|seconds?)\b/g, '\\($1 \\text{ $2}\\)');
    
    // Convert formulas like "Energy = Power × Time"
    processedContent = processedContent.replace(/Energy\s*=\s*Power\s*×\s*Time/g, '\\[\\text{Energy} = \\text{Power} \\times \\text{Time}\\]');
    
    // Split content by LaTeX math delimiters
    const parts = processedContent.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\\begin\{.*?\}[\s\S]*?\\end\{.*?\})/);
    
    return parts.map((part, index) => {
      try {
        // Block math: \[ ... \]
        if (part.startsWith('\\[') && part.endsWith('\\]')) {
          const math = part.slice(2, -2).trim();
          return <BlockMath key={index} math={math} renderError={() => <span className="text-red-500">{part}</span>} />;
        }
        
        // Inline math: \( ... \)
        if (part.startsWith('\\(') && part.endsWith('\\)')) {
          const math = part.slice(2, -2).trim();
          return <InlineMath key={index} math={math} renderError={() => <span className="text-red-500">{part}</span>} />;
        }
        
        // Block math: \begin{...} ... \end{...}
        if (part.includes('\\begin{') && part.includes('\\end{')) {
          return <BlockMath key={index} math={part} renderError={() => <span className="text-red-500">{part}</span>} />;
        }
        
        // Regular text - preserve line breaks
        return <span key={index} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
      } catch (error) {
        // Fallback to original text if rendering fails
        return <span key={index} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
      }
    });
  };

  const summarizeContent = async (content: Content) => {
    setIsSummarizing(prev => ({ ...prev, [content.id]: true }));
    try {
      let summary = '';
      if (content.type === 'pdf' && content.file) {
        // Fetch the file from the uploaded content (simulate, or use a real file if available)
        // For demo, just send the title as the file name
        const formData = new FormData();
        //formData.append('file', new Blob([content.title], { type: 'application/pdf' }), content.title + '.pdf');
        formData.append('file', content.file);
        const response = await fetch('/api/summarize-content', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        summary = result.summary;
      }
      else if (content.type === 'youtube') {
        const response = await fetch('/api/summarize-youtube', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: content.summary || content.title }),
        });
        const result = await response.json();
        summary = result.markdown || result.summary || '';
      }
       else if (content.type === 'text') {
        const response = await fetch('/api/summarize-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: content.summary || content.title }),
        });
        const result = await response.json();
        summary = result.summary;
      }
      setSummaries(prev => ({ ...prev, [content.id]: summary }));
    } catch (error: any) {
      setSummaries(prev => ({ ...prev, [content.id]: 'Failed to summarize content.' }));
    } finally {
      setIsSummarizing(prev => ({ ...prev, [content.id]: false }));
    }
  };

  const anySummarizing = Object.values(isSummarizing).some(Boolean);

  return (
    <div className="space-y-6">
      {anySummarizing && (
        <div className="w-full">
          <Progress value={60} className="h-2 bg-blue-100" />
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            AI Tutor Mira
          </CardTitle>
          <CardDescription>
            Upload any content, create personalized exams, and chat with your AI tutor for guided learning.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload Content</TabsTrigger>
          <TabsTrigger value="test">Test Knowledge</TabsTrigger>
          <TabsTrigger value="chat">AI Tutor Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload Methods */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload PDF
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="pdf-upload"
                      disabled={isProcessing}
                    />
                    <label htmlFor="pdf-upload" className="cursor-pointer">
                      <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-2">Click to upload PDF</p>
                      <p className="text-sm text-gray-500">PDF files up to 10MB</p>
                    </label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    YouTube Video
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>YouTube URL</Label>
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      disabled={isProcessing}
                    />
                  </div>
                  <Button 
                    onClick={handleYouTubeUpload} 
                    disabled={isProcessing || !youtubeUrl.trim()}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Process Video'
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Text Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Paste your content</Label>
                    <Textarea
                      placeholder="Paste slides, notes, or any text content here..."
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      rows={6}
                      disabled={isProcessing}
                    />
                  </div>
                  <Button 
                    onClick={handleTextContent} 
                    disabled={isProcessing || !textContent.trim()}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Process Content'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Uploaded Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Your Content Library</span>
                  <Badge variant="secondary">{uploadedContent.length} items</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {uploadedContent.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Content Yet</h3>
                    <p className="text-gray-500">Upload your first piece of content to get started with AI tutoring.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {uploadedContent.map((content) => (
                      <div key={content.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          {getContentIcon(content.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{content.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{content.summary}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {content.type.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {content.uploadDate.toLocaleDateString()}
                            </span>
                          </div>
                          {/* Summarize Button and Summary Display */}
                          <div className="mt-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => summarizeContent(content)}
                              disabled={isSummarizing[content.id]}
                            >
                              {isSummarizing[content.id] ? 'Summarizing...' : 'Summarize Content'}
                            </Button>
                            {summaries[content.id] && (

                              <ReactMarkdown
                              children={summaries[content.id]}
                              remarkPlugins={[remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              components={{
                                p: ({ children }) => (
                                  <p className="mb-2 text-sm leading-relaxed prose prose-sm max-w-none">
                                    {children}
                                  </p>
                                ),
                                h3: ({ children }) => <h3 className="text-lg font-bold mt-6 mb-2">{children}</h3>,
                                h4: ({ children }) => <h4 className="text-base font-semibold mt-4 mb-1">{children}</h4>,
                                ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
                                li: ({ children }) => <li className="mb-1">{children}</li>,
                                strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
                                code: ({ children }) => (
                                  <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono text-purple-600">
                                    {children}
                                  </code>
                                ),
                              }}
                              />
                            
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Exam Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Create Personalized Exam
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Topic</Label>
                  <Input
                    placeholder="Enter the topic you want to test"
                    value={examConfig.topic}
                    onChange={(e) => setExamConfig(prev => ({ ...prev, topic: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Grade Level</Label>
                  <Select value={examConfig.grade} onValueChange={(value) => setExamConfig(prev => ({ ...prev, grade: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">Grade 6</SelectItem>
                      <SelectItem value="7">Grade 7</SelectItem>
                      <SelectItem value="8">Grade 8</SelectItem>
                      <SelectItem value="9">Grade 9</SelectItem>
                      <SelectItem value="10">Grade 10</SelectItem>
                      <SelectItem value="11">Grade 11</SelectItem>
                      <SelectItem value="12">Grade 12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select value={examConfig.difficulty} onValueChange={(value) => setExamConfig(prev => ({ ...prev, difficulty: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Number of Questions</Label>
                  <Select value={examConfig.numQuestions.toString()} onValueChange={(value) => setExamConfig(prev => ({ ...prev, numQuestions: parseInt(value) }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Questions</SelectItem>
                      <SelectItem value="10">10 Questions</SelectItem>
                      <SelectItem value="15">15 Questions</SelectItem>
                      <SelectItem value="20">20 Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={generatePersonalizedExam}
                  disabled={isGeneratingExam || !examConfig.topic.trim()}
                  className="w-full"
                >
                  {isGeneratingExam ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Exam...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Generate Personalized Exam
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generated Exam */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Exam Questions</span>
                  {examQuestions.length > 0 && (
                    <Badge>{examQuestions.length} questions</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {examQuestions.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Exam Generated</h3>
                    <p className="text-gray-500">Configure and generate your personalized exam to test your knowledge.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {examQuestions.map((question, index) => (
                      <div key={question.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium">Question {index + 1}</span>
                          <Badge variant={question.difficulty === 'easy' ? 'default' : question.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                            {question.difficulty}
                          </Badge>
                        </div>
                        
                        <h4 className="font-medium mb-3">{question.question}</h4>
                        
                        {question.options && (
                          <div className="space-y-2 mb-4">
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center space-x-2">
                                <input type="radio" name={`question-${question.id}`} id={`${question.id}-${optIndex}`} />
                                <label htmlFor={`${question.id}-${optIndex}`} className="text-sm">{option}</label>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Answer & Explanation</span>
                          </div>
                          <p className="text-sm text-blue-700"><strong>Correct Answer:</strong> {question.correct_answer}</p>
                          <p className="text-sm text-blue-600 mt-1">{question.explanation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Chat with AI Tutor Mira
              </CardTitle>
              <CardDescription>
                Ask questions about your uploaded content or any topic you're studying.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                {chatMessages.map((message) => (
                  <div key={message.id} className={`flex items-start space-x-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border'
                    }`}>
                      <div className="text-sm">
                        {message.role === 'assistant' ? renderMathContent(message.content) : message.content}
                      </div>
                      <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {isChatting && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="bg-white border rounded-lg px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Message Input */}
              <div className="flex space-x-2">
                <Input
                  placeholder="Ask Mira anything about your studies..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={isChatting}
                />
                <Button 
                  onClick={sendMessage}
                  disabled={isChatting || !currentMessage.trim()}
                  size="icon"
                >
                  {isChatting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AITutorMira;