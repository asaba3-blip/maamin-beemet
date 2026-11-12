DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
CREATE POLICY "Anyone can read public display settings" ON public.site_settings
FOR SELECT USING (setting_key IN ('site_title','hero_title','hero_subtitle','header_title','header_subtitle','admin_message','admin_message_enabled'));
CREATE POLICY "Admin can read all site settings" ON public.site_settings
FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view public profile info" ON public.profiles;

CREATE OR REPLACE FUNCTION public.get_comment_author_profiles(p_user_ids uuid[])
RETURNS TABLE(user_id uuid, display_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.avatar_url
  FROM public.profiles p
  WHERE p.user_id = ANY(p_user_ids)
    AND EXISTS (
      SELECT 1 FROM public.comments c JOIN public.lessons l ON l.id = c.lesson_id
      WHERE c.user_id = p.user_id AND l.published = true
    );
$$;
GRANT EXECUTE ON FUNCTION public.get_comment_author_profiles(uuid[]) TO anon, authenticated;