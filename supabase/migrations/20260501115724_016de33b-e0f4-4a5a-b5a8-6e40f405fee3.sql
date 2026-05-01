-- Revoke broad execute on SECURITY DEFINER functions, then re-grant where needed
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_public_profiles() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_lesson_views(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_lesson_analytics() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_views_daily(int) FROM PUBLIC, anon;

-- Grants strictly to roles that need them
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_lesson_views(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_lesson_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_views_daily(int) TO authenticated;

-- Restrict listing on the public lesson-images bucket: replace any broad SELECT-all policy
-- with one that still allows reading individual objects via direct URL but disallows listing the bucket.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname IN (
        'Public Access',
        'Public Access for lesson-images',
        'Anyone can view lesson images',
        'Lesson images are publicly accessible',
        'Public read access',
        'Allow public read access',
        'Public can view lesson images'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Recreate a narrow read policy: allow SELECT only for direct object access (not listing).
-- Storage's list endpoint requires SELECT permission too, so we keep SELECT but the
-- frontend uses getPublicUrl (which doesn't need this policy at all for public buckets).
-- To stop listing while keeping public URLs working, we keep the bucket public=true
-- (handled by storage CDN) and DO NOT add any anon SELECT policy on storage.objects.
-- Public URLs continue to work because public buckets are served via CDN without RLS check.