ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS discussion_prompt text;

DROP POLICY IF EXISTS "Users can view comments on published lessons" ON public.comments;

CREATE POLICY "Anyone can view comments on published lessons"
ON public.comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lessons
    WHERE lessons.id = comments.lesson_id AND lessons.published = true
  )
);