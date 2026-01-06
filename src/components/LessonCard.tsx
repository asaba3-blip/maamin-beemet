import { Heart, MessageCircle, Calendar, Clock, Eye } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const formatViewCount = (count: number): string => {
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return count.toString();
};

interface Lesson {
  id: string;
  title: string;
  summary: string;
  image?: string;
  image_url?: string;
  topic?: string;
  topics?: { name: string };
  date?: string;
  created_at?: string;
  readTime?: string;
  likes?: number;
  likes_count?: number;
  comments?: number;
  comments_count?: number;
  views_count?: number;
  isLiked?: boolean;
}

interface LessonCardProps {
  lesson: Lesson;
  onLike: (lessonId: string) => void;
  onReadMore: (lessonId: string) => void;
}

export function LessonCard({ lesson, onLike, onReadMore }: LessonCardProps) {
  return (
    <Card className="group hover:shadow-card transition-all duration-300 overflow-hidden">
      <div className="relative bg-muted">
        {(lesson.image || lesson.image_url) && (
          <img 
            src={lesson.image || lesson.image_url} 
            alt={lesson.title}
            className="w-full h-48 object-contain group-hover:scale-105 transition-transform duration-300"
          />
        )}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
            {lesson.topic || lesson.topics?.name}
          </Badge>
        </div>
        
        {/* Stats overlay at bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <div className="flex items-center justify-start gap-4 text-white text-sm">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onLike(lesson.id);
              }}
              className={`gap-1 p-1 h-auto hover:bg-white/20 ${lesson.isLiked ? 'text-red-400' : 'text-white'}`}
            >
              <Heart className={`h-4 w-4 ${lesson.isLiked ? 'fill-current' : ''}`} />
              <span>{lesson.likes || lesson.likes_count || 0}</span>
            </Button>
            
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>{lesson.comments || lesson.comments_count || 0}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{formatViewCount(lesson.views_count || 0)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <CardHeader className="text-right">
        <h3 className="text-xl font-heading font-semibold text-card-foreground group-hover:text-primary transition-colors">
          {lesson.title}
        </h3>
        <div className="flex items-center justify-end gap-4 text-sm text-muted-foreground">
          {lesson.readTime && (
            <div className="flex items-center gap-1">
              <span>{lesson.readTime}</span>
              <Clock className="h-4 w-4" />
            </div>
          )}
          <div className="flex items-center gap-1">
            <span>{lesson.date || new Date(lesson.created_at || '').toLocaleDateString('he-IL')}</span>
            <Calendar className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="text-right">
        <p className="text-muted-foreground leading-relaxed font-body">{lesson.summary}</p>
      </CardContent>
      
      <CardFooter className="pt-4 border-t">
        <Button 
          onClick={() => onReadMore(lesson.id)}
          className="font-medium w-full"
        >
          קרא עוד
        </Button>
      </CardFooter>
    </Card>
  );
}