import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CommentItem {
  id: string;
  content: string;
  created_at: string;
  lesson_id: string;
  lesson_title: string;
  author_name: string;
}

const LS_KEY = "admin_comments_last_seen";

export function AdminCommentsBell() {
  const [items, setItems] = useState<CommentItem[]>([]);
  const [lastSeen, setLastSeen] = useState<string>(() => {
    return localStorage.getItem(LS_KEY) || new Date(0).toISOString();
  });
  const [open, setOpen] = useState(false);

  const fetchComments = useCallback(async () => {
    const { data: cData } = await supabase
      .from("comments")
      .select("id, content, created_at, user_id, lesson_id")
      .order("created_at", { ascending: false })
      .limit(20);
    if (!cData || cData.length === 0) {
      setItems([]);
      return;
    }
    const lessonIds = Array.from(new Set(cData.map((c) => c.lesson_id)));
    const userIds = Array.from(new Set(cData.map((c) => c.user_id)));
    const [{ data: lessons }, { data: profiles }] = await Promise.all([
      supabase.from("lessons").select("id, title").in("id", lessonIds),
      supabase.from("profiles").select("user_id, display_name").in("user_id", userIds),
    ]);
    const lMap = new Map(lessons?.map((l) => [l.id, l.title]) || []);
    const pMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) || []);
    setItems(
      cData.map((c) => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        lesson_id: c.lesson_id,
        lesson_title: lMap.get(c.lesson_id) || "שיעור",
        author_name: pMap.get(c.user_id) || "משתמש",
      }))
    );
  }, []);

  useEffect(() => {
    fetchComments();
    const channel = supabase
      .channel("admin-comments-bell")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments" },
        () => fetchComments()
      )
      .subscribe();
    const iv = setInterval(fetchComments, 60000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(iv);
    };
  }, [fetchComments]);

  const unreadCount = items.filter((c) => c.created_at > lastSeen).length;

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (o && items.length > 0) {
      const newest = items[0].created_at;
      localStorage.setItem(LS_KEY, newest);
      setLastSeen(newest);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative" aria-label="התראות תגובות">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[70vh] overflow-y-auto p-0">
        <div className="px-4 py-3 border-b border-border sticky top-0 bg-popover z-10">
          <div className="font-semibold text-right">תגובות אחרונות</div>
          <div className="text-xs text-muted-foreground text-right">
            {unreadCount > 0 ? `${unreadCount} תגובות חדשות` : "אין תגובות חדשות"}
          </div>
        </div>
        {items.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            עדיין אין תגובות
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((c) => {
              const isUnread = c.created_at > lastSeen;
              return (
                <li key={c.id}>
                  <Link
                    to={`/lesson/${c.lesson_id}#comment-${c.id}`}
                    onClick={() => setOpen(false)}
                    className={`block px-4 py-3 hover:bg-muted/60 transition-colors text-right ${
                      isUnread ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">
                        {formatTime(c.created_at)}
                      </span>
                      <span className="text-sm font-semibold text-primary truncate">
                        {c.lesson_title}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      מאת {c.author_name}
                    </div>
                    <div className="text-sm line-clamp-2 text-foreground">
                      {c.content}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
