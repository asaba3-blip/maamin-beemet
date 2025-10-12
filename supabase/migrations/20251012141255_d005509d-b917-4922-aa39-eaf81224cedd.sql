-- Security Fix: Complete Admin Role Migration
-- This fixes the CLIENT_SIDE_AUTH vulnerability

-- 1. Create app_role enum (skip if exists)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create user_roles table (skip if exists)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Drop ALL policies that need to be recreated
DROP POLICY IF EXISTS "Admin can delete topics" ON public.topics;
DROP POLICY IF EXISTS "Admin can insert topics" ON public.topics;
DROP POLICY IF EXISTS "Admin can update topics" ON public.topics;
DROP POLICY IF EXISTS "Admin can delete lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admin can insert lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admin can update lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admin can view all lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admin can delete lesson topics" ON public.lesson_topics;
DROP POLICY IF EXISTS "Admin can insert lesson topics" ON public.lesson_topics;
DROP POLICY IF EXISTS "Admin can update lesson topics" ON public.lesson_topics;
DROP POLICY IF EXISTS "Admin can delete site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin can insert site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin can update site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view public profile info" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all likes" ON public.likes;
DROP POLICY IF EXISTS "Admin can upload lesson images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view all comments" ON public.comments;
DROP POLICY IF EXISTS "Users can view comments on published lessons" ON public.comments;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Drop old admin status function
DROP FUNCTION IF EXISTS public.get_current_user_admin_status();

-- 5. Create all policies with has_role function
CREATE POLICY "Admin can delete topics" ON public.topics
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can insert topics" ON public.topics
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update topics" ON public.topics
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete lessons" ON public.lessons
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can insert lessons" ON public.lessons
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update lessons" ON public.lessons
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can view all lessons" ON public.lessons
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete lesson topics" ON public.lesson_topics
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can insert lesson topics" ON public.lesson_topics
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update lesson topics" ON public.lesson_topics
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete site settings" ON public.site_settings
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can insert site settings" ON public.site_settings
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update site settings" ON public.site_settings
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view public profile info" ON public.profiles
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all likes" ON public.likes
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can upload lesson images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'lesson-images' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin can upload documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin can view documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin can update documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin can delete documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view comments on published lessons" ON public.comments
FOR SELECT USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.lessons 
    WHERE lessons.id = comments.lesson_id 
    AND lessons.published = true
  )
);

CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));