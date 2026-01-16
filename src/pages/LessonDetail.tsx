import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight, Heart, MessageCircle, Calendar, Clock, Share2, Eye, Printer, Download } from "lucide-react";
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const viewTrackedRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchLesson();
    }
  }, [id, user]);

  useEffect(() => {
    if (id && lesson && !viewTrackedRef.current) {
      viewTrackedRef.current = true;
      trackLessonView(id).then((counted) => {
        if (counted) {
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

  const handleDownloadPdf = async () => {
    if (!lesson || !contentRef.current) return;
    
    setIsGeneratingPdf(true);
    
    try {
      // Dynamic imports to avoid build-time type resolution issues
      const [{ jsPDF }, html2canvasModule] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);
      const html2canvas = html2canvasModule.default;
      
      // A4 dimensions at 96 DPI: 794px x 1123px, use slightly smaller for margins
      const a4WidthPx = 750;
      
      const pdfContent = document.createElement('div');
      pdfContent.style.direction = 'rtl';
      pdfContent.style.fontFamily = 'Arial, sans-serif';
      pdfContent.style.padding = '40px';
      pdfContent.style.backgroundColor = 'white';
      pdfContent.style.color = 'black';
      pdfContent.style.width = `${a4WidthPx}px`;
      pdfContent.style.position = 'absolute';
      pdfContent.style.left = '-9999px';
      
      const sanitizedTitle = DOMPurify.sanitize(lesson.title);
      const sanitizedTopic = DOMPurify.sanitize(lesson.topic.name);
      const sanitizedSummary = DOMPurify.sanitize(lesson.summary);
      const sanitizedContent = DOMPurify.sanitize(lesson.content);
      
      pdfContent.innerHTML = `
        <div style="border-bottom: 4px solid #1a365d; padding-bottom: 20px; margin-bottom: 24px;">
          <h1 style="font-size: 32px; margin-bottom: 12px; text-align: right; font-weight: bold; color: #1a365d;">${sanitizedTitle}</h1>
          <div style="display: flex; justify-content: flex-end; gap: 20px; align-items: center;">
            <span style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 6px 16px; border-radius: 20px; font-size: 13px;">${sanitizedTopic}</span>
            <span style="color: #64748b; font-size: 13px;">${formatDate(lesson.created_at)}</span>
          </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-right: 4px solid #0ea5e9; padding: 20px; margin-bottom: 28px; border-radius: 8px;">
          <p style="font-size: 17px; color: #0c4a6e; text-align: right; line-height: 1.7; margin: 0; font-style: italic;">${sanitizedSummary}</p>
        </div>
        
        <div style="text-align: right; line-height: 2; font-size: 16px; color: #1e293b;">${sanitizedContent}</div>
        
        <div style="border-top: 2px solid #e2e8f0; margin-top: 40px; padding-top: 16px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">מאמין באמת • maamin-beemet.lovable.app</p>
        </div>
      `;
      
      document.body.appendChild(pdfContent);
      
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      document.body.removeChild(pdfContent);
      
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableWidth = pdfWidth - (margin * 2);
      
      // Scale to fill the full usable width
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = usableWidth / imgWidth;
      const scaledWidth = usableWidth;
      const scaledHeight = imgHeight * ratio;
      
      const pageHeight = pdfHeight - (margin * 2);
      let heightLeft = scaledHeight;
      let position = margin;
      
      pdf.addImage(imgData, 'JPEG', margin, position, scaledWidth, scaledHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - scaledHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, scaledWidth, scaledHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${lesson.title}.pdf`);
      
      toast({
        title: "הורדה הושלמה",
        description: "קובץ ה-PDF נשמר בהצלחה",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן ליצור את קובץ ה-PDF",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
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
            <div className="relative mb-8 rounded-lg overflow-hidden bg-muted">
              <img 
                src={lesson.image_url} 
                alt={lesson.title}
                className="w-full h-64 md:h-96 object-contain"
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

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-1"
                >
                  <Printer className="h-4 w-4" />
                  הדפס
                </Button>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="gap-1"
                >
                  <Download className="h-4 w-4" />
                  {isGeneratingPdf ? 'מייצר...' : 'הורד PDF'}
                </Button>
              </div>
            </div>
          </header>

          <Card>
            <CardContent className="prose prose-lg max-w-none p-8 text-right">
              <div 
                ref={contentRef}
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
