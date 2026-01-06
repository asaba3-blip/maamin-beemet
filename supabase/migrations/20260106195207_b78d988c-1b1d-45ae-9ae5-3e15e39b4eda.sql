-- Fix overly permissive RLS policy on lesson_views table
-- The edge function uses service role which bypasses RLS anyway,
-- so we don't need a permissive policy for regular users

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can manage lesson views" ON public.lesson_views;

-- Create a restrictive policy that denies all direct access
-- (Service role bypasses RLS, so edge function will still work)
-- Only allow SELECT for admins to view analytics
CREATE POLICY "Admins can view lesson views"
ON public.lesson_views
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- No INSERT/UPDATE/DELETE policies for regular users
-- All writes should go through the edge function with service role