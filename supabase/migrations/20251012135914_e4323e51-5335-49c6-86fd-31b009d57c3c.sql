-- Fix: User Activity Tracking via Public Comments
-- Restrict comment visibility to authenticated users only

-- Drop the existing policy that allows everyone to view all comments
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;

-- Create new policy: Only authenticated users can view comments
CREATE POLICY "Authenticated users can view all comments" 
ON public.comments 
FOR SELECT 
USING (auth.uid() IS NOT NULL);