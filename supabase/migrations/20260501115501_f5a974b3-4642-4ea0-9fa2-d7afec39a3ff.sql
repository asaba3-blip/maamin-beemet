CREATE OR REPLACE FUNCTION public.get_lesson_analytics()
RETURNS TABLE (
  lesson_id uuid,
  lesson_title text,
  views_today bigint,
  views_48h bigint,
  views_week bigint,
  views_total bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.id AS lesson_id,
    l.title AS lesson_title,
    COUNT(lv.id) FILTER (WHERE lv.created_at >= date_trunc('day', now())) AS views_today,
    COUNT(lv.id) FILTER (WHERE lv.created_at >= now() - interval '48 hours') AS views_48h,
    COUNT(lv.id) FILTER (WHERE lv.created_at >= now() - interval '7 days') AS views_week,
    COUNT(lv.id) AS views_total
  FROM public.lessons l
  LEFT JOIN public.lesson_views lv ON lv.lesson_id = l.id
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
  GROUP BY l.id, l.title
  ORDER BY views_total DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_views_daily(days_back int DEFAULT 30)
RETURNS TABLE (
  day date,
  views bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    date_trunc('day', lv.created_at)::date AS day,
    COUNT(*)::bigint AS views
  FROM public.lesson_views lv
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
    AND lv.created_at >= (now() - (days_back || ' days')::interval)
  GROUP BY 1
  ORDER BY 1;
$$;