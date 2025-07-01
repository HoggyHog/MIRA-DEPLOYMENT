
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Award, BookOpen, Clock } from 'lucide-react';

const ProgressAnalytics = () => {
  const subjectProgress = [
    {
      subject: 'Mathematics',
      currentGrade: 'A-',
      progress: 85,
      trend: 'up',
      trendValue: '+5%',
      completedTopics: 12,
      totalTopics: 15,
      timeSpent: '24h',
      achievements: ['Problem Solver', 'Consistent Learner']
    },
    {
      subject: 'Physics',
      currentGrade: 'B+',
      progress: 78,
      trend: 'up',
      trendValue: '+8%',
      completedTopics: 8,
      totalTopics: 12,
      timeSpent: '18h',
      achievements: ['Lab Expert']
    },
    {
      subject: 'Chemistry',
      currentGrade: 'B',
      progress: 72,
      trend: 'down',
      trendValue: '-3%',
      completedTopics: 6,
      totalTopics: 10,
      timeSpent: '15h',
      achievements: []
    },
    {
      subject: 'English',
      currentGrade: 'A',
      progress: 92,
      trend: 'up',
      trendValue: '+2%',
      completedTopics: 14,
      totalTopics: 15,
      timeSpent: '20h',
      achievements: ['Creative Writer', 'Grammar Master']
    }
  ];

  const weeklyStats = [
    { day: 'Mon', hours: 3.5, subjects: 4 },
    { day: 'Tue', hours: 4.2, subjects: 3 },
    { day: 'Wed', hours: 2.8, subjects: 5 },
    { day: 'Thu', hours: 4.5, subjects: 4 },
    { day: 'Fri', hours: 3.0, subjects: 3 },
    { day: 'Sat', hours: 5.2, subjects: 2 },
    { day: 'Sun', hours: 2.5, subjects: 2 }
  ];

  const overallStats = {
    totalStudyTime: '87h 30m',
    averageGrade: 'B+',
    completionRate: 83,
    streak: 12,
    totalAchievements: 15
  };

  const learningInsights = [
    {
      type: 'strength',
      subject: 'English',
      insight: 'Excellent performance in creative writing tasks',
      suggestion: 'Consider entering the school essay competition'
    },
    {
      type: 'improvement',
      subject: 'Chemistry',
      insight: 'Struggling with chemical equation balancing',
      suggestion: 'Schedule extra practice sessions with AI tutor'
    },
    {
      type: 'opportunity',
      subject: 'Mathematics',
      insight: 'Strong foundation in algebra',
      suggestion: 'Ready to advance to advanced topics'
    }
  ];

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800 border-green-200';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'strength': return 'bg-green-50 border-green-200';
      case 'improvement': return 'bg-orange-50 border-orange-200';
      case 'opportunity': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength': return '🏆';
      case 'improvement': return '📈';
      case 'opportunity': return '🎯';
      default: return '💡';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Progress Analytics</h2>
        <p className="text-gray-600">Track your academic performance and learning insights</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-purple-500 to-blue-500 text-white border-0">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{overallStats.totalStudyTime}</p>
            <p className="text-purple-100 text-sm">Total Study Time</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{overallStats.averageGrade}</p>
            <p className="text-green-100 text-sm">Average Grade</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0">
          <CardContent className="p-4 text-center">
            <BookOpen className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{overallStats.completionRate}%</p>
            <p className="text-blue-100 text-sm">Completion Rate</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{overallStats.streak}</p>
            <p className="text-orange-100 text-sm">Day Streak</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-pink-500 to-purple-500 text-white border-0">
          <CardContent className="p-4 text-center">
            <Award className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{overallStats.totalAchievements}</p>
            <p className="text-pink-100 text-sm">Achievements</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Progress */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border border-purple-100">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">Subject-wise Progress</CardTitle>
              <CardDescription>Detailed breakdown of your performance in each subject</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {subjectProgress.map((subject, index) => (
                <div key={index} className="p-4 bg-gray-50/80 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold text-gray-800 text-lg">{subject.subject}</h4>
                      <Badge className={`${getGradeColor(subject.currentGrade)} border`}>
                        {subject.currentGrade}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      {subject.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        subject.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {subject.trendValue}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">{subject.progress}%</p>
                      <p className="text-sm text-gray-600">Overall Progress</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">{subject.completedTopics}/{subject.totalTopics}</p>
                      <p className="text-sm text-gray-600">Topics Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">{subject.timeSpent}</p>
                      <p className="text-sm text-gray-600">Time Spent</p>
                    </div>
                  </div>
                  
                  <Progress value={subject.progress} className="mb-4" />
                  
                  {subject.achievements.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {subject.achievements.map((achievement, achievementIndex) => (
                        <Badge key={achievementIndex} variant="secondary" className="text-xs">
                          <Award className="w-3 h-3 mr-1" />
                          {achievement}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Weekly Activity */}
          <Card className="bg-white/80 backdrop-blur-sm border border-purple-100">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">Weekly Study Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyStats.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <span className="font-medium text-gray-700 w-8">{day.day}</span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{day.hours}h</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                            style={{ width: `${(day.hours / 6) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">{day.subjects} subjects</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights and Recommendations */}
        <div className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border border-purple-100">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">Learning Insights</CardTitle>
              <CardDescription>AI-powered recommendations for your studies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {learningInsights.map((insight, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}>
                  <div className="flex items-start space-x-3">
                    <span className="text-xl">{getInsightIcon(insight.type)}</span>
                    <div>
                      <h4 className="font-medium text-gray-800 text-sm mb-1">
                        {insight.subject}
                      </h4>
                      <p className="text-gray-700 text-sm mb-2">{insight.insight}</p>
                      <p className="text-gray-600 text-xs italic">{insight.suggestion}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Achievement Board */}
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200">
            <CardHeader>
              <CardTitle className="text-lg text-orange-800 flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { title: 'Perfect Score', description: 'Mathematics Quiz', date: '2 days ago' },
                { title: 'Study Streak', description: '7 days in a row', date: '1 week ago' },
                { title: 'Fast Learner', description: 'Completed 5 topics', date: '1 week ago' }
              ].map((achievement, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-white/80 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{achievement.title}</p>
                    <p className="text-gray-600 text-xs">{achievement.description}</p>
                    <p className="text-gray-500 text-xs">{achievement.date}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProgressAnalytics;
