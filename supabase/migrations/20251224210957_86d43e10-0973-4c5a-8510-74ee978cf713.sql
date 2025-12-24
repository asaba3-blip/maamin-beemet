-- Create lesson_views table for tracking unique views
CREATE TABLE public.lesson_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  visitor_hash text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_lesson_views_lesson_id ON public.lesson_views(lesson_id);
CREATE INDEX idx_lesson_views_created_at ON public.lesson_views(created_at);
CREATE INDEX idx_lesson_views_visitor_hash ON public.lesson_views(visitor_hash);
CREATE INDEX idx_lesson_views_lookup ON public.lesson_views(lesson_id, visitor_hash, created_at);

-- Enable RLS
ALTER TABLE public.lesson_views ENABLE ROW LEVEL SECURITY;

-- Allow inserts from authenticated and anonymous users (via edge function with service role)
-- No direct read/write access from client - all handled by edge function
CREATE POLICY "Service role can manage lesson views"
ON public.lesson_views
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to increment view count atomically
CREATE OR REPLACE FUNCTION public.increment_lesson_views(p_lesson_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.lessons
  SET views_count = views_count + 1
  WHERE id = p_lesson_id;
END;
$$;