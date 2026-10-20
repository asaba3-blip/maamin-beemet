CREATE TABLE public.audio_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  visitor_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audio_events TO authenticated;
GRANT ALL ON public.audio_events TO service_role;
ALTER TABLE public.audio_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audio events" ON public.audio_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX audio_events_lookup ON public.audio_events (lesson_id, event_type, visitor_hash, created_at);

CREATE OR REPLACE FUNCTION public.get_audio_analytics()
RETURNS TABLE(lesson_id uuid, lesson_title text, plays_today bigint, plays_week bigint, plays_total bigint, downloads_today bigint, downloads_week bigint, downloads_total bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT l.id, l.title,
    COUNT(e.id) FILTER (WHERE e.event_type='play' AND e.created_at >= date_trunc('day', now())),
    COUNT(e.id) FILTER (WHERE e.event_type='play' AND e.created_at >= now() - interval '7 days'),
    COUNT(e.id) FILTER (WHERE e.event_type='play'),
    COUNT(e.id) FILTER (WHERE e.event_type='download' AND e.created_at >= date_trunc('day', now())),
    COUNT(e.id) FILTER (WHERE e.event_type='download' AND e.created_at >= now() - interval '7 days'),
    COUNT(e.id) FILTER (WHERE e.event_type='download')
  FROM public.lessons l
  LEFT JOIN public.audio_events e ON e.lesson_id = l.id
  WHERE public.has_role(auth.uid(), 'admin'::app_role) AND l.audio_url IS NOT NULL
  GROUP BY l.id, l.title
  ORDER BY 5 DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_audio_daily(days_back integer DEFAULT 30)
RETURNS TABLE(day date, plays bigint, downloads bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT date_trunc('day', created_at)::date,
    COUNT(*) FILTER (WHERE event_type='play'),
    COUNT(*) FILTER (WHERE event_type='download')
  FROM public.audio_events
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
    AND created_at >= now() - (days_back || ' days')::interval
  GROUP BY 1 ORDER BY 1;
$$;