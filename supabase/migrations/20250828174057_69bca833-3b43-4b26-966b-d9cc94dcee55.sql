-- Fix security issue: Hide admin status from public view
-- Remove the existing public policy for profiles
DROP POLICY "Profiles are viewable by everyone" ON public.profiles;

-- Create a view for public profile information (without admin status)
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  user_id,
  display_name,
  avatar_url,
  created_at,
  updated_at
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_barrier = true);

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

-- Create RLS policy for public view (no admin status exposed)
-- Anyone can view the public profile information
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.public_profiles 
FOR SELECT 
USING (true);