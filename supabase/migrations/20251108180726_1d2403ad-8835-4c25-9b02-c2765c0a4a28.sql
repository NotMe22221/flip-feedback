-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('routine-videos', 'routine-videos', true);

-- Create policies for video uploads
CREATE POLICY "Allow public video uploads"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'routine-videos');

CREATE POLICY "Allow public video access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'routine-videos');

-- Add video_url column to analysis_sessions
ALTER TABLE public.analysis_sessions
ADD COLUMN IF NOT EXISTS video_path TEXT;