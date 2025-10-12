-- Drop the existing policy that allows everyone to view all likes
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;

-- Create new policy: Users can view only their own likes
CREATE POLICY "Users can view their own likes" 
ON public.likes 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create new policy: Admins can view all likes
CREATE POLICY "Admins can view all likes" 
ON public.likes 
FOR SELECT 
USING (get_current_user_admin_status() = true);