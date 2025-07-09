import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  Download,
  Camera,
  Image,
  Eye,
  X,
  Plus
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

interface OCRResult {
  text: string;
  confidence?: number;
  processing_time?: number;
  file_type: string;
  file_name: string;
}

interface PracticeAnalysis {
  success: boolean;
  overall_score?: number;
  total_marks?: number;
  question_analyses?: QuestionAnalysis[];
  general_feedback?: string;
  error?: string;
  ocr_results?: { [key: string]: OCRResult };
}

const PracticePlaygroundDemo = () => {
  const [config, setConfig] = useState({
    subject: '',
    grade: '',
    topic: ''
  });
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [idealContent, setIdealContent] = useState('');
  const [studentResponses, setStudentResponses] = useState('');
  const [idealContentFile, setIdealContentFile] = useState<File | null>(null);
  const [studentResponsesFile, setStudentResponsesFile] = useState<File | null>(null);
  const [studentResponsesImages, setStudentResponsesImages] = useState<File[]>([]);
  const [uploadMode, setUploadMode] = useState<'single' | 'multi'>('single');
  const [ocrPreview, setOcrPreview] = useState<{ [key: string]: string }>({});
  const [isPreviewingOCR, setIsPreviewingOCR] = useState(false);
  const [analysis, setAnalysis] = useState<PracticeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentTab, setCurrentTab] = useState<'setup' | 'results'>('setup');
  const { toast } = useToast();

  const subjects = ["Mathematics", "Science", "English", "Social Studies", "Hindi", "Physics", "Chemistry", "Biology"];
  const grades = ["6", "7", "8", "9", "10", "11", "12"];

  const SUPPORTED_FILE_TYPES = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    bmp: 'image/bmp',
    tiff: 'image/tiff',
    webp: 'image/webp'
  };

  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
  };

  const isValidFileType = (file: File): boolean => {
    return Object.values(SUPPORTED_FILE_TYPES).includes(file.type);
  };

  const previewOCR = async (file: File) => {
    if (!isImageFile(file)) return;

    setIsPreviewingOCR(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8001/api/ocr-preview', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('OCR preview failed');
      }

      const result = await response.json();
      if (result.success) {
        setOcrPreview(prev => ({ ...prev, [file.name]: result.extracted_text }));
        toast({
          title: "OCR Preview Ready",
          description: `Extracted ${result.character_count} characters from ${file.name}`,
        });
      } else {
        throw new Error(result.error || 'OCR preview failed');
      }
    } catch (error) {
      console.error('OCR preview error:', error);
      toast({
        title: "OCR Preview Failed",
        description: "Failed to extract text from image. The file will still be processed during analysis.",
        variant: "destructive"
      });
    } finally {
      setIsPreviewingOCR(false);
    }
  };

  const handleFileUpload = (file: File, type: 'ideal' | 'student') => {
    if (!isValidFileType(file)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF or image files (JPEG, PNG, BMP, TIFF, WebP).",
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

    // Preview OCR for images
    if (isImageFile(file)) {
      previewOCR(file);
    }

    toast({
      title: "File Uploaded",
      description: `${file.name} uploaded successfully.`,
    });
  };

  const handleMultiImageUpload = (files: FileList) => {
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach(file => {
      if (!isImageFile(file)) {
        invalidFiles.push(file.name);
      } else if (file.size > 10 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (too large)`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      toast({
        title: "Some files skipped",
        description: `Invalid files: ${invalidFiles.join(', ')}`,
        variant: "destructive"
      });
    }

    if (validFiles.length > 0) {
      setStudentResponsesImages(prev => [...prev, ...validFiles]);
      
      // Preview OCR for all images
      validFiles.forEach(file => previewOCR(file));

      toast({
        title: "Images Uploaded",
        description: `${validFiles.length} image(s) uploaded successfully.`,
      });
    }
  };

  const removeImage = (index: number) => {
    setStudentResponsesImages(prev => prev.filter((_, i) => i !== index));
  };

  const analyzeResponses = async () => {
    if (inputMode === 'text') {
      // Text mode validation
    if (!idealContent.trim() || !studentResponses.trim()) {
      toast({
        title: "Missing Content",
        description: "Please provide both ideal content and student responses.",
        variant: "destructive"
      });
      return;
      }
    } else {
      // File mode validation
      if (!idealContentFile) {
        toast({
          title: "Missing Files",
          description: "Please upload ideal content file.",
          variant: "destructive"
        });
        return;
      }

      if (uploadMode === 'single' && !studentResponsesFile) {
        toast({
          title: "Missing Files",
          description: "Please upload student responses file.",
          variant: "destructive"
        });
        return;
      }

      if (uploadMode === 'multi' && studentResponsesImages.length === 0) {
        toast({
          title: "Missing Files",
          description: "Please upload student response images.",
          variant: "destructive"
        });
        return;
      }
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
      formData.append('subject', config.subject);
      formData.append('grade', config.grade);
      formData.append('topic', config.topic);

      let endpoint = 'http://localhost:8001/api/analyze-practice';

      if (inputMode === 'text') {
        // Create text-based "files" from the text areas for compatibility
        const idealBlob = new Blob([idealContent], { type: 'text/plain' });
        const studentBlob = new Blob([studentResponses], { type: 'text/plain' });
        
        // Create proper File objects with names and extensions
        const idealFile = new File([idealBlob], 'ideal_content.txt', { type: 'text/plain' });
        const studentFile = new File([studentBlob], 'student_responses.txt', { type: 'text/plain' });
        
        formData.append('ideal_content_file', idealFile);
        formData.append('student_responses_file', studentFile);
      } else {
        // File mode
        formData.append('ideal_content_file', idealContentFile!);

        if (uploadMode === 'single') {
          formData.append('student_responses_file', studentResponsesFile!);
        } else {
          // Multi-image mode
          studentResponsesImages.forEach(image => {
            formData.append('student_responses_images', image);
          });
          endpoint = 'http://localhost:8001/api/analyze-practice-multi-image';
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis request failed');
      }

      const result: PracticeAnalysis = await response.json();
      console.log('Analysis result:', result); // Debug log
      console.log('Setting analysis state with:', result);
      setAnalysis(result);

      if (result.success) {
        console.log('Analysis successful, switching to results tab');
        toast({
          title: "Analysis Complete",
          description: "Your practice session has been analyzed successfully.",
        });
        // Switch to results tab after successful analysis
        setCurrentTab('results');
        console.log('Switched to results tab');
      } else {
        console.log('Analysis failed:', result.error);
        toast({
          title: "Analysis Failed",
          description: result.error || "Failed to analyze responses.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      // Try to get response text if JSON parsing failed
      try {
        let errorText = '';
        if (error instanceof Response && typeof error.text === 'function') {
          errorText = await error.text();
        } else {
          errorText = String(error);
        }
        console.error('Response text:', errorText);
        toast({
          title: "Analysis Error",
          description: `Failed to parse analysis response. Check console for details.`,
          variant: "destructive"
        });
      } catch (textError) {
      toast({
        title: "Analysis Error",
        description: "Failed to analyze practice session. Please try again.",
        variant: "destructive"
      });
      }
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
            AI Practice Playground
            <Badge variant="secondary" className="ml-2">
              <Camera className="w-3 h-3 mr-1" />
              OCR Enabled
            </Badge>
          </CardTitle>
          <CardDescription>
            Enter your content directly or upload files (including handwritten images) to get detailed CBSE-style feedback with marking schemes and improvement suggestions.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as 'setup' | 'results')} className="space-y-6">
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
                  <Input
                    id="topic"
                    placeholder="Enter topic name"
                    value={config.topic}
                    onChange={(e) => setConfig(prev => ({ ...prev, topic: e.target.value }))}
                  />
                </div>
              </div>

              {/* Input Mode Selection */}
              <div className="space-y-3">
                <Label>Input Mode</Label>
                <div className="flex gap-4">
                  <Button
                    variant={inputMode === 'text' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInputMode('text')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Text Input
                  </Button>
                  <Button
                    variant={inputMode === 'file' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInputMode('file')}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    File Upload
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  {inputMode === 'text' 
                    ? 'Enter your content directly in text areas below'
                    : 'Upload PDF or image files (supports handwriting recognition)'
                  }
                </p>
              </div>

              {/* Content Input */}
              {inputMode === 'text' ? (
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
              ) : (
                <div className="space-y-6">
                  {/* Upload Mode Selection for Files */}
                  <div className="space-y-3">
                    <Label>Upload Mode</Label>
                    <div className="flex gap-4">
                      <Button
                        variant={uploadMode === 'single' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setUploadMode('single')}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Single File
                      </Button>
                      <Button
                        variant={uploadMode === 'multi' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setUploadMode('multi')}
                      >
                        <Image className="w-4 h-4 mr-2" />
                        Multiple Images
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">
                      {uploadMode === 'single' 
                        ? 'Upload a single PDF or image file for student responses'
                        : 'Upload multiple images for multi-page handwritten responses'
                      }
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Ideal Content Upload */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Ideal Answers/Reference Content *</Label>
                        <p className="text-sm text-gray-600">
                          Upload PDF or image file containing ideal answers/reference content
                        </p>
                      </div>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <div className="flex justify-center mb-4">
                          {idealContentFile && isImageFile(idealContentFile) ? (
                            <Camera className="h-12 w-12 text-blue-400" />
                          ) : (
                            <FileText className="h-12 w-12 text-gray-400" />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('ideal-content-upload')?.click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Ideal Content
                          </Button>
                          <input
                            id="ideal-content-upload"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.bmp,.tiff,.webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file, 'ideal');
                            }}
                          />
                          {idealContentFile && (
                            <div className="space-y-2">
                              <div className="text-sm text-green-600 font-medium">
                                ✓ {idealContentFile.name}
                              </div>
                              {isImageFile(idealContentFile) && ocrPreview[idealContentFile.name] && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const preview = ocrPreview[idealContentFile.name];
                                    toast({
                                      title: "OCR Preview",
                                      description: preview.slice(0, 200) + (preview.length > 200 ? '...' : ''),
                                    });
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Preview OCR
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Student Responses Upload */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Student Responses *</Label>
                        <p className="text-sm text-gray-600">
                          {uploadMode === 'single' 
                            ? 'Upload PDF or image file containing your practice responses'
                            : 'Upload multiple images of your handwritten responses'
                          }
                        </p>
                      </div>
                      
                      {uploadMode === 'single' ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <div className="flex justify-center mb-4">
                            {studentResponsesFile && isImageFile(studentResponsesFile) ? (
                              <Camera className="h-12 w-12 text-blue-400" />
                            ) : (
                              <FileText className="h-12 w-12 text-gray-400" />
                            )}
                          </div>
                          <div className="space-y-2">
                            <Button
                              variant="outline"
                              onClick={() => document.getElementById('student-responses-upload')?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Your Responses
                            </Button>
                            <input
                              id="student-responses-upload"
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.bmp,.tiff,.webp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, 'student');
                              }}
                            />
                            {studentResponsesFile && (
                              <div className="space-y-2">
                                <div className="text-sm text-green-600 font-medium">
                                  ✓ {studentResponsesFile.name}
                                </div>
                                {isImageFile(studentResponsesFile) && ocrPreview[studentResponsesFile.name] && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const preview = ocrPreview[studentResponsesFile.name];
                                      toast({
                                        title: "OCR Preview",
                                        description: preview.slice(0, 200) + (preview.length > 200 ? '...' : ''),
                                      });
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Preview OCR
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <div className="space-y-2">
                              <Button
                                variant="outline"
                                onClick={() => document.getElementById('multi-image-upload')?.click()}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Images
                              </Button>
                              <input
                                id="multi-image-upload"
                                type="file"
                                accept=".jpg,.jpeg,.png,.bmp,.tiff,.webp"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (files) handleMultiImageUpload(files);
                                }}
                              />
                              <p className="text-xs text-gray-500">
                                Click to add multiple images (JPEG, PNG, BMP, TIFF, WebP)
                              </p>
                </div>
              </div>
                          
                          {studentResponsesImages.length > 0 && (
                            <div className="space-y-2">
                              <Label>Uploaded Images ({studentResponsesImages.length})</Label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {studentResponsesImages.map((image, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div className="flex items-center gap-2">
                                      <Image className="w-4 h-4 text-blue-500" />
                                      <span className="text-sm truncate">{image.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {ocrPreview[image.name] && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            const preview = ocrPreview[image.name];
                                            toast({
                                              title: `OCR Preview - ${image.name}`,
                                              description: preview.slice(0, 200) + (preview.length > 200 ? '...' : ''),
                                            });
                                          }}
                                        >
                                          <Eye className="w-3 h-3" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeImage(index)}
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* OCR Status */}
                  {isPreviewingOCR && (
                    <Alert>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <AlertDescription>
                        Processing image with OCR... This may take a few moments.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Analyze Button */}
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={analyzeResponses}
                  disabled={
                    isAnalyzing || 
                    (inputMode === 'text' && (!idealContent.trim() || !studentResponses.trim())) ||
                    (inputMode === 'file' && (
                      !idealContentFile || 
                      (uploadMode === 'single' && !studentResponsesFile) ||
                      (uploadMode === 'multi' && studentResponsesImages.length === 0)
                    )) ||
                    !config.subject || 
                    !config.grade || 
                    !config.topic
                  }
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
          {analysis?.success ? (
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

              {/* OCR Results */}
              {analysis.ocr_results && Object.keys(analysis.ocr_results).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="w-6 h-6 text-blue-600" />
                      OCR Processing Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(analysis.ocr_results).map(([key, ocrResult]) => (
                      <div key={key} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-700 capitalize">{key.replace('_', ' ')}</h4>
                          <Badge variant="outline">
                            {ocrResult.file_type === 'multi_image' ? 'Multiple Images' : ocrResult.file_type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>File:</strong> {ocrResult.file_name}
                        </p>
                        <div className="border rounded p-3 bg-white">
                          <ScrollArea className="h-32">
                            <p className="text-sm whitespace-pre-wrap">
                              {ocrResult.text || 'No text extracted'}
                            </p>
                          </ScrollArea>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                          <span>Characters extracted: {ocrResult.text?.length || 0}</span>
                          {ocrResult.processing_time && (
                            <span>Processing time: {ocrResult.processing_time}s</span>
                          )}
                        </div>
                      </div>
                    ))}
                    <Alert>
                      <Eye className="h-4 w-4" />
                      <AlertDescription>
                        The text above was automatically extracted from your uploaded images using OCR technology. 
                        This extracted text was used for analysis.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}

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
          ) : analysis ? (
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
          ) : (
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