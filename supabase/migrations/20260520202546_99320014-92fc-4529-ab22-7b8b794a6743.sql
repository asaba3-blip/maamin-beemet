-- Storage: admin can update/delete lesson images
CREATE POLICY "Admins can update lesson images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'lesson-images' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'lesson-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete lesson images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'lesson-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- user_roles: explicit admin-only INSERT/UPDATE/DELETE as restrictive policies
-- (existing permissive "Admins can manage roles" already gates, but add restrictive layer
-- to defend in depth against any future permissive policy mistakes.)
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));