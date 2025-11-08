-- Make video_url nullable since we're using video_path instead
ALTER TABLE public.analysis_sessions
ALTER COLUMN video_url DROP NOT NULL;