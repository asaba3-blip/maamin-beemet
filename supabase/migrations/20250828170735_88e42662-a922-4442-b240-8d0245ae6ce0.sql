-- Create policies for lesson images (bucket already exists)
CREATE POLICY "Lesson images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'lesson-images');

CREATE POLICY "Admin can upload lesson images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'lesson-images' AND 
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE is_admin = true
  )
);

CREATE POLICY "Admin can update lesson images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'lesson-images' AND 
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE is_admin = true
  )
);

CREATE POLICY "Admin can delete lesson images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'lesson-images' AND 
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE is_admin = true
  )
);