import React, { useState } from 'react';
import { Link } from 'wouter';
import { Users, MessageCircle, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DoubtChat from '@/components/DoubtChat';
import PracticePlaygroundDemo from '@/components/student/PracticePlaygroundDemo';
import AITutorMira from '@/components/student/AITutorMira';

const StudentPilot = () => {
  const [activeTab, setActiveTab] = useState('doubt-chat');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
              <Users className="h-8 w-8 text-cyan-600" />
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">Mira by Centum AI</h1>
                <p className="text-sm text-cyan-600 font-medium">Student Pilot Edition</p>
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
            Welcome to Student Pilot Dashboard
          </h2>
          <p className="text-lg text-gray-600">
            Get instant help with your studies using our AI-powered doubt solving system
          </p>
        </div>

        {/* Feature Cards Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div 
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              activeTab === 'doubt-chat' 
                ? 'border-cyan-500 bg-cyan-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('doubt-chat')}
          >
            <div className="flex items-center mb-3">
              <MessageCircle className="h-8 w-8 text-cyan-600" />
              <h3 className="text-xl font-semibold text-gray-900 ml-3">AI Doubt Solver</h3>
            </div>
            <p className="text-gray-600">
              Ask questions about any CBSE topic and get detailed explanations with step-by-step solutions
            </p>
          </div>

          <div 
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              activeTab === 'practice-playground' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('practice-playground')}
          >
            <div className="flex items-center mb-3">
              <div className="h-8 w-8 text-blue-600 flex items-center justify-center bg-blue-100 rounded">
                🎯
              </div>
              <h3 className="text-xl font-semibold text-gray-900 ml-3">Practice Playground</h3>
            </div>
            <p className="text-gray-600">
              Upload your practice responses to get detailed feedback with marking schemes and improvement tips
            </p>
          </div>

          <div 
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              activeTab === 'ai-tutor' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('ai-tutor')}
          >
            <div className="flex items-center mb-3">
              <div className="h-8 w-8 text-purple-600 flex items-center justify-center bg-purple-100 rounded">
                🧠
              </div>
              <h3 className="text-xl font-semibold text-gray-900 ml-3">AI Tutor Mira</h3>
            </div>
            <p className="text-gray-600">
              Upload any content, create personalized exams, and chat with your AI tutor for guided learning
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-50 p-1 m-4 rounded-lg">
              <TabsTrigger 
                value="doubt-chat" 
                className="flex items-center gap-2 data-[state=active]:bg-white"
              >
                <MessageCircle className="h-4 w-4" />
                AI Doubt Chat
              </TabsTrigger>
              <TabsTrigger 
                value="practice-playground"
                className="flex items-center gap-2 data-[state=active]:bg-white"
              >
                🎯
                Practice Playground
              </TabsTrigger>
              <TabsTrigger 
                value="ai-tutor"
                className="flex items-center gap-2 data-[state=active]:bg-white"
              >
                🧠
                AI Tutor Mira
              </TabsTrigger>
            </TabsList>

            <TabsContent value="doubt-chat" className="p-6 pt-0">
              <DoubtChat />
            </TabsContent>

            <TabsContent value="practice-playground" className="p-6 pt-0">
              <PracticePlaygroundDemo />
            </TabsContent>

            <TabsContent value="ai-tutor" className="p-6 pt-0">
              <AITutorMira />
            </TabsContent>
          </Tabs>
        </div>

        {/* Pilot Info Footer */}
        <div className="mt-8 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-cyan-900 mb-2">Pilot Edition Feature</h4>
            <p className="text-cyan-700 text-sm">
              This pilot version includes AI-powered doubt solving and practice playground. Additional student features will be available in the complete version.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPilot;