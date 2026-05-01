import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, MessageCircle } from "lucide-react";
import { commentSchema } from "@/lib/validation";

interface CommentRow {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author_name: string;
  author_avatar: string | null;
}

interface Props {
  lessonId: string;
  onCountChange?: (delta: number) => void;
}

const MAX_LEN = 50;

export function LessonComments({ lessonId, onCountChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (lessonId) fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, user]);

  const fetchComments = async () => {
    setLoading(true);
    const { data: cData, error } = await supabase
      .from("comments")
      .select("id, content, created_at, user_id")
      .eq("lesson_id", lessonId)
      .order("created_at", { ascending: false });

    if (error || !cData) {
      setComments([]);
      setLoading(false);
      return;
    }

    const userIds = Array.from(new Set(cData.map((c) => c.user_id)));
    let profileMap = new Map<string, { name: string; avatar: string | null }>();

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      profiles?.forEach((p) => {
        profileMap.set(p.user_id, {
          name: p.display_name || "משתמש",
          avatar: p.avatar_url,
        });
      });
    }

    setComments(
      cData.map((c) => ({
        ...c,
        author_name: profileMap.get(c.user_id)?.name || "משתמש",
        author_avatar: profileMap.get(c.user_id)?.avatar || null,
      }))
    );
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user) return;
    const parsed = commentSchema.safeParse({ content, lesson_id: lessonId });
    if (!parsed.success) {
      toast({
        title: "שגיאה",
        description: parsed.error.errors[0]?.message || "תגובה לא תקינה",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("comments").insert({
      lesson_id: lessonId,
      user_id: user.id,
      content: parsed.data.content,
    });
    setSubmitting(false);

    if (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לשלוח את התגובה",
        variant: "destructive",
      });
      return;
    }

    setContent("");
    onCountChange?.(1);
    fetchComments();
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את התגובה",
        variant: "destructive",
      });
      return;
    }
    onCountChange?.(-1);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const remaining = MAX_LEN - content.length;
  const tooLong = content.length > MAX_LEN;

  return (
    <Card className="mt-8">
      <CardContent className="p-6 text-right" dir="rtl">
        <div className="flex items-center justify-end gap-2 mb-6">
          <h2 className="text-2xl font-heading font-semibold">תגובות</h2>
          <MessageCircle className="h-6 w-6 text-primary" />
        </div>

        {user ? (
          <div className="mb-6">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={MAX_LEN}
              placeholder="כתוב תגובה (עד 50 תווים)..."
              className="text-right"
              dir="rtl"
              rows={2}
            />
            <div className="flex items-center justify-between mt-2">
              <span
                className={`text-sm ${
                  tooLong ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {remaining} / {MAX_LEN}
              </span>
              <Button
                onClick={handleSubmit}
                disabled={submitting || content.trim().length === 0 || tooLong}
              >
                {submitting ? "שולח..." : "שלח תגובה"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-muted rounded-md text-center">
            <p className="text-muted-foreground mb-2">
              יש להתחבר כדי לכתוב תגובה
            </p>
            <Button asChild variant="default" size="sm">
              <Link to="/auth">התחבר</Link>
            </Button>
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground text-center py-4">טוען תגובות...</p>
        ) : !user ? (
          <p className="text-muted-foreground text-center py-4 text-sm">
            התחבר כדי לראות את התגובות
          </p>
        ) : comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            עדיין אין תגובות. היה הראשון להגיב!
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => (
              <div
                key={c.id}
                className="flex gap-3 p-4 bg-muted/40 rounded-md"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  {c.author_avatar && (
                    <AvatarImage src={c.author_avatar} alt={c.author_name} />
                  )}
                  <AvatarFallback>
                    {c.author_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      {user?.id === c.user_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(c.id)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("he-IL")}
                      </span>
                    </div>
                    <span className="font-semibold text-sm">{c.author_name}</span>
                  </div>
                  <p className="text-sm text-foreground break-words whitespace-pre-wrap">
                    {c.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
