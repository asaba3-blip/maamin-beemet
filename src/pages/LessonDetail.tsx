import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight, Heart, MessageCircle, Calendar, Clock, Share2, Eye } from "lucide-react";
import { trackLessonView, formatViewCount } from "@/lib/viewTracker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import DOMPurify from 'dompurify';

interface Lesson {
  id: string;
  title: string;
  summary: string;
  content: string;
  image_url: string | null;
  created_at: string;
  related_lessons?: string[];
  topic: {
    name: string;
  };
  likes_count: number;
  comments_count: number;
  views_count: number;
  isLiked?: boolean;
}

interface RelatedLesson {
  id: string;
  title: string;
  summary: string;
}

export default function LessonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [relatedLessons, setRelatedLessons] = useState<RelatedLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const viewTrackedRef = useRef(false);

  useEffect(() => {
    if (id) {
      fetchLesson();
    }
  }, [id, user]);

  // Track view once per session
  useEffect(() => {
    if (id && lesson && !viewTrackedRef.current) {
      viewTrackedRef.current = true;
      trackLessonView(id).then((counted) => {
        if (counted) {
          // Increment the local view count
          setLesson(prev => prev ? { ...prev, views_count: prev.views_count + 1 } : null);
        }
      });
    }
  }, [id, lesson]);

  const fetchLesson = async () => {
    try {
      const { data: lessonData, error } = await supabase
        .from("lessons")
        .select(`
          *,
          topic:topics(name)
        `)
        .eq("id", id)
        .eq("published", true)
        .single();

      if (error) {
        console.error("Error fetching lesson:", error);
        return;
      }

      let isLiked = false;
      if (user) {
        const { data: likeData } = await supabase
          .from("likes")
          .select("id")
          .eq("lesson_id", id)
          .eq("user_id", user.id)
          .single();
        
        isLiked = !!likeData;
      }

      setLesson({
        ...lessonData,
        isLiked
      });

      // Fetch related lessons if they exist
      if (lessonData.related_lessons && lessonData.related_lessons.length > 0) {
        const { data: relatedData } = await supabase
          .from("lessons")
          .select("id, title, summary")
          .in("id", lessonData.related_lessons)
          .eq("published", true);
        
        if (relatedData) {
          setRelatedLessons(relatedData);
        }
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "נדרשת התחברות",
        description: "יש להתחבר כדי לאהוב שיעורים",
        variant: "destructive",
      });
      return;
    }

    if (!lesson) return;

    try {
      if (lesson.isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("lesson_id", lesson.id)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("likes")
          .insert({
            lesson_id: lesson.id,
            user_id: user.id,
          });
      }

      setLesson({
        ...lesson,
        isLiked: !lesson.isLiked,
        likes_count: lesson.isLiked ? lesson.likes_count - 1 : lesson.likes_count + 1
      });
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: lesson?.title,
        text: lesson?.summary,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "הקישור הועתק",
        description: "הקישור הועתק ללוח",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">השיעור לא נמצא</h1>
          <Button onClick={() => navigate("/")}>
            <ArrowRight className="ml-2 h-4 w-4" />
            חזור לעמוד הראשי
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/50">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowRight className="ml-2 h-4 w-4" />
          חזור לעמוד הראשי
        </Button>

        <article className="max-w-4xl mx-auto">
          {lesson.image_url && (
            <div className="relative mb-8 rounded-lg overflow-hidden">
              <img 
                src={lesson.image_url} 
                alt={lesson.title}
                className="w-full h-64 md:h-96 object-cover"
              />
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                  {lesson.topic.name}
                </Badge>
              </div>
            </div>
          )}

          <header className="mb-8 text-right">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-foreground leading-tight">
              {lesson.title}
            </h1>

            {relatedLessons.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">שיעורים קשורים:</h3>
                <div className="flex flex-wrap gap-2">
                  {relatedLessons.map((relatedLesson) => (
                    <Button
                      key={relatedLesson.id}
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/lesson/${relatedLesson.id}`)}
                      className="text-sm"
                    >
                      {relatedLesson.title}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-end gap-6 text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <span>{formatViewCount(lesson.views_count)}</span>
                <Eye className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1">
                <span>10 דק'</span>
                <Clock className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1">
                <span>{formatDate(lesson.created_at)}</span>
                <Calendar className="h-4 w-4" />
              </div>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed mb-6 font-body">
              {lesson.summary}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLike}
                  className={`gap-1 ${lesson.isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
                >
                  <span>{lesson.likes_count}</span>
                  <Heart className={`h-5 w-5 ${lesson.isLiked ? 'fill-current' : ''}`} />
                </Button>
                
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span>{lesson.comments_count}</span>
                  <MessageCircle className="h-5 w-5" />
                </div>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleShare}
                  className="gap-1"
                >
                  <Share2 className="h-4 w-4" />
                  שתף
                </Button>
              </div>
            </div>
          </header>

          <Card>
            <CardContent className="prose prose-lg max-w-none p-8 text-right">
              <div 
                className="leading-relaxed text-foreground hebrew-content content-typography"
                style={{ direction: 'rtl' }}
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(lesson.content, {
                    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'blockquote', 'code', 'pre', 'span', 'div'],
                    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel'],
                    ADD_ATTR: ['target', 'rel'],
                    ALLOW_UNKNOWN_PROTOCOLS: false
                  })
                }}
              />
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              חזור לדף הבית
            </Button>
          </div>
        </article>
      </div>
    </div>
  );
}