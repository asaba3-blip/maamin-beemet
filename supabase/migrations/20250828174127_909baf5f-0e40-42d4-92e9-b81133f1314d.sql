-- Fix security issue: Hide admin status from public view
-- Remove the existing public policy for profiles
DROP POLICY "Profiles are viewable by everyone" ON public.profiles;

-- Create new RLS policies for profiles table
-- Only allow users to see their own full profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow admins to view all profiles (including admin status)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (get_current_user_admin_status() = true);

-- Create a security definer function for public profile access (without admin status)
CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.created_at,
    p.updated_at
  FROM public.profiles p;
$$;