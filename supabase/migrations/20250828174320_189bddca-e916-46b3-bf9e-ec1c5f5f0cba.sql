-- Fix security warnings from linter

-- Fix WARN 1: Function Search Path Mutable
-- Update the get_public_profiles function to have immutable search path
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
SET search_path = public
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

-- Also fix the existing get_current_user_admin_status function
CREATE OR REPLACE FUNCTION public.get_current_user_admin_status()
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
  SELECT is_admin FROM public.profiles WHERE user_id = auth.uid();
$$;