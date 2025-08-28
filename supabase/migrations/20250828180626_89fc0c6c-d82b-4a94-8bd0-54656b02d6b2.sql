-- Check and fix storage policies for lesson-images bucket

-- Create storage policies for lesson-images bucket if they don't exist
INSERT INTO storage.policies (id, bucket_id, target, action, check_expression)
SELECT 
  'admin_upload_lesson_images',
  'lesson-images',
  'INSERT',
  'objects',
  'get_current_user_admin_status() = true'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies 
  WHERE bucket_id = 'lesson-images' 
  AND target = 'INSERT'
);

INSERT INTO storage.policies (id, bucket_id, target, action, check_expression)
SELECT 
  'public_read_lesson_images',
  'lesson-images', 
  'SELECT',
  'objects',
  'true'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies 
  WHERE bucket_id = 'lesson-images' 
  AND target = 'SELECT'
);

-- Update existing policies if they exist
UPDATE storage.policies 
SET check_expression = 'get_current_user_admin_status() = true'
WHERE bucket_id = 'lesson-images' 
AND target = 'INSERT'
AND check_expression != 'get_current_user_admin_status() = true';

UPDATE storage.policies 
SET check_expression = 'true'
WHERE bucket_id = 'lesson-images' 
AND target = 'SELECT'
AND check_expression != 'true';