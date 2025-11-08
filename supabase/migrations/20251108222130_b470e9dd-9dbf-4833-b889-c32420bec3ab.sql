-- Fix MISSING_RLS: Clean up orphaned data and make user_id NOT NULL
-- Delete rows with NULL user_id (orphaned data)
DELETE FROM analysis_sessions WHERE user_id IS NULL;

-- Add NOT NULL constraint
ALTER TABLE analysis_sessions 
ALTER COLUMN user_id SET NOT NULL;

-- Set default to current user
ALTER TABLE analysis_sessions 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Fix STORAGE_EXPOSURE: Create RLS policies for storage
-- Allow users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'routine-videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'routine-videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'routine-videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'routine-videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);