import React, { useState } from 'react';
import { Link } from 'wouter';
import { GraduationCap, FileText, BookOpen, ArrowLeft, PlayCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIExamGenerator } from '@/components/teacher/AIExamGenerator';
import { LecturePreparation } from '@/components/teacher/LecturePreparation';
import { DocumentStateProvider } from '@/contexts/DocumentStateContext';
import PracticePlaygroundDemo from '@/components/student/PracticePlaygroundDemo';

const TeacherPilot = () => {
  const [activeTab, setActiveTab] = useState('exam-generator');

  return (
    <DocumentStateProvider>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
              <GraduationCap className="h-8 w-8 text-indigo-600" />
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">Mira by Centum AI</h1>
                <p className="text-sm text-indigo-600 font-medium">Teacher Pilot Edition</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full font-medium">
                Pilot Version
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Teacher Pilot Dashboard
          </h2>
          <p className="text-lg text-gray-600">
            Experience AI-powered teaching tools with our streamlined pilot features
          </p>
        </div>

        {/* Feature Cards Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div 
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              activeTab === 'exam-generator' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('exam-generator')}
          >
            <div className="flex items-center mb-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900 ml-3">AI Exam Generator</h3>
            </div>
            <p className="text-gray-600">
              Create CBSE-aligned exam papers with customizable difficulty levels and question types
            </p>
          </div>

          <div 
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              activeTab === 'lesson-generator' 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('lesson-generator')}
          >
            <div className="flex items-center mb-3">
              <BookOpen className="h-8 w-8 text-indigo-600" />
              <h3 className="text-xl font-semibold text-gray-900 ml-3">AI Lesson Generator</h3>
            </div>
            <p className="text-gray-600">
              Generate comprehensive lesson plans with activities, assessments, and CBSE alignment
            </p>
          </div>

          {/* NEW Practice Playground feature card */}
          <div 
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              activeTab === 'practice-playground' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('practice-playground')}
          >
            <div className="flex items-center mb-3">
              <PlayCircle className="h-8 w-8 text-green-600" />
              <h3 className="text-xl font-semibold text-gray-900 ml-3">Practice Playground</h3>
            </div>
            <p className="text-gray-600">
              Analyse practice answers with AI marking and feedback, OCR-supported.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-50 p-1 m-4 rounded-lg">
              <TabsTrigger 
                value="exam-generator" 
                className="flex items-center gap-2 data-[state=active]:bg-white"
              >
                <FileText className="h-4 w-4" />
                AI Exam Generator
              </TabsTrigger>
              <TabsTrigger 
                value="lesson-generator"
                className="flex items-center gap-2 data-[state=active]:bg-white"
              >
                <BookOpen className="h-4 w-4" />
                AI Lesson Generator
              </TabsTrigger>
              {/* NEW PRACTICE TRIGGER */}
              <TabsTrigger 
                value="practice-playground"
                className="flex items-center gap-2 data-[state=active]:bg-white"
              >
                <PlayCircle className="h-4 w-4" />
                Practice Playground
              </TabsTrigger>
            </TabsList>

            <TabsContent value="exam-generator" className="p-6 pt-0">
              <AIExamGenerator />
            </TabsContent>

            <TabsContent value="lesson-generator" className="p-6 pt-0">
              <LecturePreparation />
            </TabsContent>
            {/* NEW PRACTICE CONTENT */}
            <TabsContent value="practice-playground" className="p-6 pt-0">
              <PracticePlaygroundDemo />
            </TabsContent>
          </Tabs>
        </div>

        {/* Pilot Info Footer */}
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-blue-900 mb-2">Pilot Edition Features</h4>
            <p className="text-blue-700 text-sm">
              This pilot version includes our core AI teaching tools. Full dashboard features will be available in the complete version.
            </p>
          </div>
        </div>
      </div>
    </div>
    </DocumentStateProvider>
  );
};

export default TeacherPilot;