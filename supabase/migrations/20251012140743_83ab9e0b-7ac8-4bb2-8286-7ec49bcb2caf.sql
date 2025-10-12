-- Security Fix: Migrate Admin Roles to Separate Table
-- This fixes the CLIENT_SIDE_AUTH vulnerability

-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
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

-- 4. Migrate existing is_admin users to user_roles table (only valid users)
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'admin'::app_role
FROM public.profiles p
INNER JOIN auth.users u ON p.user_id = u.id
WHERE p.is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. Drop all dependent policies first before dropping function

-- Drop topics policies
DROP POLICY IF EXISTS "Admin can delete topics" ON public.topics;
DROP POLICY IF EXISTS "Admin can insert topics" ON public.topics;
DROP POLICY IF EXISTS "Admin can update topics" ON public.topics;

-- Drop lessons policies
DROP POLICY IF EXISTS "Admin can delete lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admin can insert lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admin can update lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admin can view all lessons" ON public.lessons;

-- Drop lesson_topics policies
DROP POLICY IF EXISTS "Admin can delete lesson topics" ON public.lesson_topics;
DROP POLICY IF EXISTS "Admin can insert lesson topics" ON public.lesson_topics;
DROP POLICY IF EXISTS "Admin can update lesson topics" ON public.lesson_topics;

-- Drop site_settings policies
DROP POLICY IF EXISTS "Admin can delete site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin can insert site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin can update site settings" ON public.site_settings;

-- Drop profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Drop likes policies
DROP POLICY IF EXISTS "Admins can view all likes" ON public.likes;

-- Drop storage policies
DROP POLICY IF EXISTS "Admin can upload lesson images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete documents" ON storage.objects;

-- Now drop old admin status function
DROP FUNCTION IF EXISTS public.get_current_user_admin_status();

-- 6. Recreate all policies with has_role function

-- Topics policies
CREATE POLICY "Admin can delete topics" ON public.topics
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can insert topics" ON public.topics
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update topics" ON public.topics
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Lessons policies
CREATE POLICY "Admin can delete lessons" ON public.lessons
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can insert lessons" ON public.lessons
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update lessons" ON public.lessons
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can view all lessons" ON public.lessons
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Lesson_topics policies
CREATE POLICY "Admin can delete lesson topics" ON public.lesson_topics
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can insert lesson topics" ON public.lesson_topics
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update lesson topics" ON public.lesson_topics
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Site_settings policies
CREATE POLICY "Admin can delete site settings" ON public.site_settings
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can insert site settings" ON public.site_settings
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update site settings" ON public.site_settings
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Profiles policies
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Fix: User Profiles Cannot Be Viewed by Other Users
CREATE POLICY "Authenticated users can view public profile info" ON public.profiles
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Likes policies
CREATE POLICY "Admins can view all likes" ON public.likes
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies
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

-- Fix: User Comments and Activity Could Be Exposed
DROP POLICY IF EXISTS "Authenticated users can view all comments" ON public.comments;

CREATE POLICY "Users can view comments on published lessons" ON public.comments
FOR SELECT USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.lessons 
    WHERE lessons.id = comments.lesson_id 
    AND lessons.published = true
  )
);

-- Create RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 7. Remove is_admin column from profiles (after migration)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin;