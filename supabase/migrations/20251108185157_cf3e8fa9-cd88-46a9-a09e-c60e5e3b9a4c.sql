-- Add user_id column to analysis_sessions
ALTER TABLE analysis_sessions 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_analysis_sessions_user_id ON analysis_sessions(user_id);

-- Drop existing public RLS policies
DROP POLICY IF EXISTS "Allow public read access" ON analysis_sessions;
DROP POLICY IF EXISTS "Allow public insert access" ON analysis_sessions;

-- Create user-specific RLS policies
CREATE POLICY "Users can view own sessions"
ON analysis_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
ON analysis_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
ON analysis_sessions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
ON analysis_sessions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Update storage bucket RLS policies for user-specific video access
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;

-- Users can view their own videos
CREATE POLICY "Users can view own videos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'routine-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can upload their own videos
CREATE POLICY "Users can upload own videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'routine-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own videos
CREATE POLICY "Users can update own videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'routine-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own videos
CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'routine-videos' AND auth.uid()::text = (storage.foldername(name))[1]);