import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  FileText, 
  BookOpen, 
  Target,
  Search,
  Star,
  StarOff,
  MoreVertical,
  Download,
  Trash2,
  Eye,
  Calendar,
  Clock,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth0 } from '@auth0/auth0-react';

interface ContentGeneration {
  id: number;
  user_id: string;
  content_type: 'exam' | 'lesson' | 'practice_analysis';
  title: string;
  description: string;
  input_parameters: any;
  generated_content: string;
  metadata: any;
  status: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  specificContent?: any;
}

export const SavedContent = () => {
  const [content, setContent] = useState<ContentGeneration[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedContent, setSelectedContent] = useState<ContentGeneration | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const { getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    fetchContent();
  }, []);

  useEffect(() => {
    filterContent();
  }, [content, activeTab, searchQuery]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently();
      const response = await fetch('/api/protected/teacher-content/content-generations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch content');
      
      const data = await response.json();
      setContent(data.content || []);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: "Error",
        description: "Failed to load saved content",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterContent = () => {
    let filtered = content;

    // Filter by type
    if (activeTab !== 'all') {
      filtered = filtered.filter(item => item.content_type === activeTab);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredContent(filtered);
  };

  const toggleFavorite = async (contentId: number, currentStatus: boolean) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`/api/protected/teacher-content/content-generations/${contentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_favorite: !currentStatus })
      });

      if (!response.ok) throw new Error('Failed to update favorite status');

      setContent(prev => prev.map(item => 
        item.id === contentId ? { ...item, is_favorite: !currentStatus } : item
      ));

      toast({
        title: currentStatus ? "Removed from favorites" : "Added to favorites",
        description: "Content updated successfully"
      });
    } catch (error) {
      console.error('Error updating favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive"
      });
    }
  };

  const deleteContent = async (contentId: number) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`/api/protected/teacher-content/content-generations/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete content');

      setContent(prev => prev.filter(item => item.id !== contentId));
      
      toast({
        title: "Content deleted",
        description: "Content has been deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive"
      });
    }
  };

  const downloadContent = (item: ContentGeneration) => {
    const blob = new Blob([item.generated_content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.replace(/[^a-z0-9]/gi, '_')}_${item.content_type}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'exam':
        return <FileText className="w-5 h-5" />;
      case 'lesson':
        return <BookOpen className="w-5 h-5" />;
      case 'practice_analysis':
        return <Target className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'exam':
        return 'Exam';
      case 'lesson':
        return 'Lesson';
      case 'practice_analysis':
        return 'Practice Analysis';
      default:
        return type;
    }
  };

  const ContentCard = ({ item }: { item: ContentGeneration }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${
              item.content_type === 'exam' ? 'bg-blue-100 text-blue-600' :
              item.content_type === 'lesson' ? 'bg-green-100 text-green-600' :
              'bg-purple-100 text-purple-600'
            }`}>
              {getContentIcon(item.content_type)}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-1">{item.title || 'Untitled'}</CardTitle>
              <CardDescription className="line-clamp-2 mt-1">
                {item.description || 'No description available'}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(item.id, item.is_favorite);
              }}
            >
              {item.is_favorite ? (
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ) : (
                <StarOff className="w-4 h-4" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  setSelectedContent(item);
                  setViewDialogOpen(true);
                }}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadContent(item)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => deleteContent(item.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <Badge variant="secondary">
              {getContentTypeLabel(item.content_type)}
            </Badge>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{format(new Date(item.created_at), 'h:mm a')}</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setSelectedContent(item);
              setViewDialogOpen(true);
            }}
          >
            View
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Saved Content</h2>
          <p className="text-gray-600">View and manage your generated content</p>
        </div>
        <Button onClick={fetchContent} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Content</TabsTrigger>
          <TabsTrigger value="exam">Exams</TabsTrigger>
          <TabsTrigger value="lesson">Lessons</TabsTrigger>
          <TabsTrigger value="practice_analysis">Practice Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : filteredContent.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-gray-400 mb-4">
                  {getContentIcon(activeTab === 'all' ? 'exam' : activeTab)}
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No {activeTab === 'all' ? '' : getContentTypeLabel(activeTab)} content found
                </h3>
                <p className="text-gray-500">
                  {searchQuery ? 'Try adjusting your search query' : 'Generate content to see it here'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContent.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedContent?.title || 'Content Details'}</DialogTitle>
            <DialogDescription>
              Generated on {selectedContent && format(new Date(selectedContent.created_at), 'MMMM d, yyyy at h:mm a')}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] mt-4">
            <div className="space-y-4">
              {selectedContent?.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-gray-600">{selectedContent.description}</p>
                </div>
              )}
              
              {selectedContent?.input_parameters && (
                <div>
                  <h4 className="font-semibold mb-2">Configuration</h4>
                  <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedContent.input_parameters, null, 2)}
                  </pre>
                </div>
              )}
              
              <div>
                <h4 className="font-semibold mb-2">Generated Content</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">
                    {selectedContent?.generated_content}
                  </pre>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 