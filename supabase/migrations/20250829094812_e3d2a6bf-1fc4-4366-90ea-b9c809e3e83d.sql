-- Create lesson_topics junction table for many-to-many relationship
CREATE TABLE public.lesson_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL,
  topic_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, topic_id)
);

-- Enable RLS on lesson_topics
ALTER TABLE public.lesson_topics ENABLE ROW LEVEL SECURITY;

-- Create policies for lesson_topics
CREATE POLICY "Admin can insert lesson topics" 
ON public.lesson_topics 
FOR INSERT 
WITH CHECK (get_current_user_admin_status() = true);

CREATE POLICY "Admin can update lesson topics" 
ON public.lesson_topics 
FOR UPDATE 
USING (get_current_user_admin_status() = true);

CREATE POLICY "Admin can delete lesson topics" 
ON public.lesson_topics 
FOR DELETE 
USING (get_current_user_admin_status() = true);

CREATE POLICY "Lesson topics are viewable by everyone" 
ON public.lesson_topics 
FOR SELECT 
USING (true);

-- Insert holidays category and subcategories
INSERT INTO public.topics (name, description, sort_order) VALUES 
('חגים', 'חגי ישראל ומועדים', 1);

-- Get the holidays category ID for subcategories
DO $$
DECLARE 
    holidays_id UUID;
BEGIN
    SELECT id INTO holidays_id FROM public.topics WHERE name = 'חגים';
    
    -- Insert all Jewish holidays in chronological order
    INSERT INTO public.topics (name, description, parent_id, sort_order) VALUES 
    ('ראש השנה', 'ראש השנה ותקופת התשובה', holidays_id, 1),
    ('יום כיפור', 'יום הכיפורים', holidays_id, 2),
    ('סוכות', 'חג הסוכות', holidays_id, 3),
    ('שמחת תורה', 'שמחת תורה וסיום התורה', holidays_id, 4),
    ('חנוכה', 'חג החנוכה', holidays_id, 5),
    ('ט״ו בשבט', 'ראש השנה לאילנות', holidays_id, 6),
    ('פורים', 'חג הפורים', holidays_id, 7),
    ('פסח', 'חג הפסח', holidays_id, 8),
    ('ל״ג בעומר', 'ל״ג בעומר', holidays_id, 9),
    ('יום ירושלים', 'יום ירושלים', holidays_id, 10),
    ('שבועות', 'חג השבועות', holidays_id, 11);
END $$;