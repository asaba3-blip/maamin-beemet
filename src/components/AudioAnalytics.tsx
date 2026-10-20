import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Row {
  lesson_id: string; lesson_title: string;
  plays_today: number; plays_week: number; plays_total: number;
  downloads_today: number; downloads_week: number; downloads_total: number;
}

export const AudioAnalytics = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [daily, setDaily] = useState<{ day: string; plays: number; downloads: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [a, d] = await Promise.all([
        (supabase.rpc as any)("get_audio_analytics"),
        (supabase.rpc as any)("get_audio_daily", { days_back: 30 }),
      ]);
      if (!a.error && a.data) setRows((a.data as any[]).map((r) => {
        const o: any = { ...r };
        for (const k of Object.keys(o)) if (k.startsWith("plays") || k.startsWith("downloads")) o[k] = Number(o[k]) || 0;
        return o;
      }));
      if (!d.error && d.data) setDaily((d.data as any[]).map((r) => ({
        day: new Date(r.day).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" }),
        plays: Number(r.plays) || 0, downloads: Number(r.downloads) || 0,
      })));
      setLoading(false);
    })();
  }, []);

  const totalPlays = rows.reduce((s, r) => s + r.plays_total, 0);
  const totalDownloads = rows.reduce((s, r) => s + r.downloads_total, 0);

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>הקלטות – האזנות והורדות</CardTitle>
        <p className="text-sm text-muted-foreground">סה"כ האזנות: {totalPlays} · סה"כ הורדות: {totalDownloads}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="plays" name="האזנות" stroke="hsl(var(--primary))" strokeWidth={2} />
              <Line type="monotone" dataKey="downloads" name="הורדות" stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {loading ? <p className="text-muted-foreground text-center">טוען...</p> : rows.length === 0 ? (
          <p className="text-muted-foreground text-center">אין עדיין שיעורים מוקלטים</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">שיעור</TableHead>
                  <TableHead className="text-center">האזנות היום</TableHead>
                  <TableHead className="text-center">האזנות שבוע</TableHead>
                  <TableHead className="text-center">האזנות סה"כ</TableHead>
                  <TableHead className="text-center">הורדות היום</TableHead>
                  <TableHead className="text-center">הורדות שבוע</TableHead>
                  <TableHead className="text-center">הורדות סה"כ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.lesson_id}>
                    <TableCell className="font-medium"><a href={`/lesson/${r.lesson_id}`} className="text-primary hover:underline">{r.lesson_title}</a></TableCell>
                    <TableCell className="text-center">{r.plays_today}</TableCell>
                    <TableCell className="text-center">{r.plays_week}</TableCell>
                    <TableCell className="text-center font-semibold">{r.plays_total}</TableCell>
                    <TableCell className="text-center">{r.downloads_today}</TableCell>
                    <TableCell className="text-center">{r.downloads_week}</TableCell>
                    <TableCell className="text-center font-semibold">{r.downloads_total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
