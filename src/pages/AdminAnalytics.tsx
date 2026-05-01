import { useEffect, useState, useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Eye, Calendar, Clock, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface LessonAnalytics {
  lesson_id: string;
  lesson_title: string;
  views_today: number;
  views_48h: number;
  views_week: number;
  views_total: number;
}

interface DailyView {
  day: string;
  views: number;
}

const AdminAnalytics = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<LessonAnalytics[]>([]);
  const [daily, setDaily] = useState<DailyView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      setLoading(true);
      const [a, d] = await Promise.all([
        supabase.rpc("get_lesson_analytics"),
        supabase.rpc("get_views_daily", { days_back: 30 }),
      ]);
      if (!a.error && a.data) {
        setRows(
          (a.data as any[]).map((r) => ({
            lesson_id: r.lesson_id,
            lesson_title: r.lesson_title,
            views_today: Number(r.views_today) || 0,
            views_48h: Number(r.views_48h) || 0,
            views_week: Number(r.views_week) || 0,
            views_total: Number(r.views_total) || 0,
          }))
        );
      }
      if (!d.error && d.data) {
        setDaily(
          (d.data as any[]).map((r) => ({
            day: new Date(r.day).toLocaleDateString("he-IL", {
              day: "2-digit",
              month: "2-digit",
            }),
            views: Number(r.views) || 0,
          }))
        );
      }
      setLoading(false);
    };
    load();
  }, [isAdmin]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        today: acc.today + r.views_today,
        h48: acc.h48 + r.views_48h,
        week: acc.week + r.views_week,
        total: acc.total + r.views_total,
      }),
      { today: 0, h48: 0, week: 0, total: 0 }
    );
  }, [rows]);

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        r.lesson_title.toLowerCase().includes(search.toLowerCase())
      ),
    [rows, search]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">דשבורד אנליטיקה</h1>
          <p className="text-muted-foreground mt-2">
            מעקב כניסות לאתר ולשיעורים
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            icon={<Calendar className="h-5 w-5" />}
            label="היום"
            value={totals.today}
          />
          <SummaryCard
            icon={<Clock className="h-5 w-5" />}
            label="48 שעות"
            value={totals.h48}
          />
          <SummaryCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="שבוע אחרון"
            value={totals.week}
          />
          <SummaryCard
            icon={<Eye className="h-5 w-5" />}
            label="סך הכל"
            value={totals.total}
          />
        </div>

        {/* Daily Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>כניסות יומיות (30 ימים אחרונים)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Lessons Table */}
        <Card>
          <CardHeader>
            <CardTitle>כניסות לפי שיעור</CardTitle>
            <Input
              placeholder="חיפוש שיעור..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-4 max-w-sm"
            />
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-8">טוען...</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                אין נתונים להצגה
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">שם השיעור</TableHead>
                      <TableHead className="text-center">היום</TableHead>
                      <TableHead className="text-center">48 שעות</TableHead>
                      <TableHead className="text-center">שבוע</TableHead>
                      <TableHead className="text-center">סך הכל</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.lesson_id}>
                        <TableCell className="font-medium">
                          <a
                            href={`/lesson/${r.lesson_id}`}
                            className="hover:underline text-primary"
                          >
                            {r.lesson_title}
                          </a>
                        </TableCell>
                        <TableCell className="text-center">
                          {r.views_today}
                        </TableCell>
                        <TableCell className="text-center">
                          {r.views_48h}
                        </TableCell>
                        <TableCell className="text-center">
                          {r.views_week}
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {r.views_total}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const SummaryCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-primary">{icon}</span>
      </div>
      <div className="text-2xl font-bold">{value.toLocaleString("he-IL")}</div>
    </CardContent>
  </Card>
);

export default AdminAnalytics;
