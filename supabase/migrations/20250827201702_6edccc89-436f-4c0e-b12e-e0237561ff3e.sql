-- Create topics table
CREATE TABLE public.topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.topics(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  topic_id UUID REFERENCES public.topics(id),
  image_url TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create likes table
CREATE TABLE public.likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, user_id)
);

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create function to get current user role to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_current_user_admin_status()
RETURNS BOOLEAN AS $$
  SELECT is_admin FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create policies for topics (read-only for all users)
CREATE POLICY "Topics are viewable by everyone" 
ON public.topics 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can insert topics" 
ON public.topics 
FOR INSERT 
WITH CHECK (public.get_current_user_admin_status() = true);

CREATE POLICY "Admin can update topics" 
ON public.topics 
FOR UPDATE 
USING (public.get_current_user_admin_status() = true);

CREATE POLICY "Admin can delete topics" 
ON public.topics 
FOR DELETE 
USING (public.get_current_user_admin_status() = true);

-- Create policies for lessons
CREATE POLICY "Published lessons are viewable by everyone" 
ON public.lessons 
FOR SELECT 
USING (published = true);

CREATE POLICY "Admin can view all lessons" 
ON public.lessons 
FOR SELECT 
USING (public.get_current_user_admin_status() = true);

CREATE POLICY "Admin can insert lessons" 
ON public.lessons 
FOR INSERT 
WITH CHECK (public.get_current_user_admin_status() = true);

CREATE POLICY "Admin can update lessons" 
ON public.lessons 
FOR UPDATE 
USING (public.get_current_user_admin_status() = true);

CREATE POLICY "Admin can delete lessons" 
ON public.lessons 
FOR DELETE 
USING (public.get_current_user_admin_status() = true);

-- Create policies for comments
CREATE POLICY "Comments are viewable by everyone" 
ON public.comments 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for likes
CREATE POLICY "Likes are viewable by everyone" 
ON public.likes 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can like lessons" 
ON public.likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can unlike lessons" 
ON public.likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_topics_updated_at
BEFORE UPDATE ON public.topics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default topics
INSERT INTO public.topics (name, description) VALUES
('מקרא', 'שיעורים בתנך ופירושים'),
('אמונה', 'נושאי אמונה ומחשבה יהודית'),
('הלכה', 'שיעורים בהלכה ומצוות'),
('מועדים', 'חגים ומועדי השנה'),
('תפילה', 'נושאי תפילה ועבודת השם');

-- Create storage bucket for lesson images
INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-images', 'lesson-images', true);

-- Create storage policies for lesson images
CREATE POLICY "Lesson images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'lesson-images');

CREATE POLICY "Admin can upload lesson images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'lesson-images' AND public.get_current_user_admin_status() = true);

-- Create storage bucket for document uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Create storage policies for documents
CREATE POLICY "Admin can upload documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND public.get_current_user_admin_status() = true);

CREATE POLICY "Admin can view documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documents' AND public.get_current_user_admin_status() = true);

CREATE POLICY "Admin can update documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'documents' AND public.get_current_user_admin_status() = true);

CREATE POLICY "Admin can delete documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'documents' AND public.get_current_user_admin_status() = true);