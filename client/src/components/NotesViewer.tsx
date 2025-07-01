import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Calendar, Download, Highlighter, MessageCircle, Play } from 'lucide-react';

const NotesViewer = () => {
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedText, setSelectedText] = useState('');

  const subjects = [
    { id: 'all', name: 'All Subjects' },
    { id: 'math', name: 'Mathematics' },
    { id: 'physics', name: 'Physics' },
    { id: 'chemistry', name: 'Chemistry' },
    { id: 'english', name: 'English' },
    { id: 'history', name: 'History' }
  ];

  const notes = [
    {
      id: 1,
      subject: 'Mathematics',
      topic: 'Quadratic Equations',
      date: '2024-01-12',
      class: 'Class 10A',
      content: 'A quadratic equation is a polynomial equation of degree 2. The general form is ax² + bx + c = 0, where a ≠ 0. The discriminant Δ = b² - 4ac determines the nature of roots.',
      examples: ['x² - 5x + 6 = 0', '2x² + 3x - 1 = 0'],
      aiExplanation: 'Think of quadratic equations like finding where a parabola crosses the x-axis. The discriminant tells us if it crosses twice (two real roots), once (one repeated root), or never (complex roots).',
      status: 'reviewed'
    },
    {
      id: 2,
      subject: 'Physics',
      topic: 'Newton\'s Laws of Motion',
      date: '2024-01-11',
      class: 'Class 10A',
      content: 'Newton\'s three laws form the foundation of classical mechanics. First Law: An object at rest stays at rest unless acted upon by a force. Second Law: F = ma. Third Law: For every action, there is an equal and opposite reaction.',
      examples: ['A ball rolling on a frictionless surface', 'Rocket propulsion'],
      aiExplanation: 'Newton\'s laws explain everyday phenomena. When you walk, you push backward on the ground (action), and the ground pushes forward on you (reaction), propelling you forward.',
      status: 'new'
    }
  ];

  const filteredNotes = selectedSubject === 'all' 
    ? notes 
    : notes.filter(note => note.subject.toLowerCase() === selectedSubject);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString());
    }
  };

  const askAboutSelection = () => {
    if (selectedText) {
      console.log('Asking AI about:', selectedText);
      // This would integrate with the doubt chat functionality
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lecture Notes</h2>
          <p className="text-gray-600">AI-enhanced notes with explanations and examples</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map(subject => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Selected Text Action */}
      {selectedText && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Selected text:</p>
                <p className="font-medium text-gray-800 italic">"{selectedText}"</p>
              </div>
              <Button onClick={askAboutSelection} className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                <MessageCircle className="w-4 h-4 mr-2" />
                Ask AI about this
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredNotes.map((note) => (
          <Card key={note.id} className="bg-white/80 backdrop-blur-sm border border-purple-100 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{note.topic}</CardTitle>
                    <CardDescription className="flex items-center space-x-2">
                      <span>{note.subject}</span>
                      <span>•</span>
                      <span>{note.class}</span>
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={note.status === 'new' ? 'default' : 'secondary'}>
                    {note.status}
                  </Badge>
                  <p className="text-sm text-gray-500 mt-1 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {note.date}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Note Content */}
              <div className="bg-gray-50/80 rounded-lg p-4" onMouseUp={handleTextSelection}>
                <h4 className="font-medium text-gray-800 mb-2">Content:</h4>
                <p className="text-gray-700 leading-relaxed select-text">{note.content}</p>
              </div>

              {/* Examples */}
              {note.examples && note.examples.length > 0 && (
                <div className="bg-blue-50/80 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                    <Play className="w-4 h-4 mr-2" />
                    Solved Examples:
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {note.examples.map((example, index) => (
                      <li key={index} className="text-blue-700 text-sm font-mono">{example}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Explanation */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                <h4 className="font-medium text-purple-800 mb-2 flex items-center">
                  <Highlighter className="w-4 h-4 mr-2" />
                  AI Explanation:
                </h4>
                <p className="text-purple-700 text-sm leading-relaxed">{note.aiExplanation}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Ask Doubt
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
                  View Full Notes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border border-purple-100">
          <CardContent className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No notes found</h3>
            <p className="text-gray-500">Try selecting a different subject or check back later for new notes.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotesViewer;
