-- Add related_lessons column to lessons table to store up to 4 related lesson IDs
ALTER TABLE public.lessons 
ADD COLUMN related_lessons uuid[] DEFAULT ARRAY[]::uuid[];