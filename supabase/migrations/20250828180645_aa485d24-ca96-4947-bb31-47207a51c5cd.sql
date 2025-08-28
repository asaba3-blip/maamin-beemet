-- Create storage policies for lesson-images bucket using the correct syntax

-- Policy for admins to upload images
CREATE POLICY "Admin can upload lesson images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-images' 
  AND get_current_user_admin_status() = true
);

-- Policy for public access to read images  
CREATE POLICY "Public can view lesson images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'lesson-images');