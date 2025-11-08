-- Add voice_notes column to analysis_sessions table
ALTER TABLE public.analysis_sessions 
ADD COLUMN voice_notes TEXT;