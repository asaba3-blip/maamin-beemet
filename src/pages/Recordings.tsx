import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Headphones } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCanonical } from "@/hooks/useCanonical";

interface Rec {
  id: string;
  title: string;
  summary: string;
  audio_url: string;
  audio_duration_seconds: number | null;
  created_at: string;
}

const fmt = (s: number | null) =>
  s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : null;

export default function Recordings() {
  useCanonical("/recordings");
  const navigate = useNavigate();
  const [items, setItems] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("lessons")
        .select("id, title, summary, audio_url, audio_duration_seconds, created_at")
        .eq("published", true)
        .not("audio_url", "is", null)
        .order("created_at", { ascending: false });
      setItems(((data as any[]) || []).filter((r) => r.audio_url));
      setLoading(false);
    })();
  }, []);

  const filtered = items.filter((r) => r.title.includes(q.trim()));

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>שיעורים מוקלטים | לימודי מקרא ויהדות</title>
        <meta name="description" content="האזינו לשיעורים המוקלטים במקרא, אמונה ויהדות – כל ההקלטות במקום אחד." />
        <meta property="og:title" content="שיעורים מוקלטים" />
        <meta property="og:description" content="כל השיעורים המוקלטים במקום אחד." />
      </Helmet>
      <main className="container mx-auto px-4 py-8 max-w-4xl" dir="rtl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowRight className="ml-2 h-4 w-4" />
          חזור לעמוד הראשי
        </Button>
        <h1 className="text-4xl font-heading font-bold mb-2 flex items-center gap-3">
          <Headphones className="h-8 w-8 text-primary" />
          שיעורים מוקלטים
        </h1>
        <p className="text-muted-foreground mb-6">האזינו לשיעורים בכל מקום ובכל זמן.</p>
        <Input placeholder="חיפוש לפי כותרת..." value={q} onChange={(e) => setQ(e.target.value)} className="mb-6" />

        {loading ? (
          <p className="text-muted-foreground">טוען...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">עדיין אין שיעורים מוקלטים.</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-5 text-right space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl font-semibold">
                      <Link to={`/lesson/${r.id}`} className="hover:underline">{r.title}</Link>
                    </h2>
                    {fmt(r.audio_duration_seconds) && (
                      <span className="text-sm text-muted-foreground shrink-0">{fmt(r.audio_duration_seconds)}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{r.summary}</p>
                  <audio controls preload="none" src={r.audio_url} className="w-full" />
                  <Link to={`/lesson/${r.id}`} className="text-sm text-primary hover:underline">לשיעור הכתוב ←</Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
