import { Heart, MessageCircle, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
      <div className="relative">
        {(lesson.image || lesson.image_url) && (
          <img 
            src={lesson.image || lesson.image_url} 
            alt={lesson.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
            {lesson.topic || lesson.topics?.name}
          </Badge>
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
      
      <CardFooter className="flex justify-between items-center pt-4 border-t">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onLike(lesson.id)}
            className={`gap-1 ${lesson.isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
          >
            <span>{lesson.likes || lesson.likes_count || 0}</span>
            <Heart className={`h-4 w-4 ${lesson.isLiked ? 'fill-current' : ''}`} />
          </Button>
          
          <div className="flex items-center gap-1 text-muted-foreground">
            <span>{lesson.comments || lesson.comments_count || 0}</span>
            <MessageCircle className="h-4 w-4" />
          </div>
        </div>
        
        <Button 
          onClick={() => onReadMore(lesson.id)}
          className="font-medium"
        >
          קרא עוד
        </Button>
      </CardFooter>
    </Card>
  );
}