-- Add new topic: מקרא והיסטוריה
INSERT INTO public.topics (name, description, sort_order)
VALUES ('מקרא והיסטוריה', 'נושאים במקרא ובהיסטוריה', 4)
ON CONFLICT DO NOTHING;