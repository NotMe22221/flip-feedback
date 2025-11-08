-- Create analysis sessions table
CREATE TABLE public.analysis_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_seconds DECIMAL(5,2),
  
  -- Scores
  ai_score DECIMAL(3,1) CHECK (ai_score >= 0 AND ai_score <= 10),
  posture_score INTEGER CHECK (posture_score >= 0 AND posture_score <= 100),
  stability_score INTEGER CHECK (stability_score >= 0 AND stability_score <= 100),
  smoothness_score INTEGER CHECK (smoothness_score >= 0 AND smoothness_score <= 100),
  
  -- Analysis data
  keypoints_data JSONB,
  feedback_text TEXT,
  
  -- Metrics
  avg_knee_angle DECIMAL(5,2),
  avg_hip_angle DECIMAL(5,2),
  landing_stability DECIMAL(5,2)
);

-- Enable Row Level Security
ALTER TABLE public.analysis_sessions ENABLE ROW LEVEL SECURITY;

-- Public read access for demo (can be restricted later with auth)
CREATE POLICY "Allow public read access" 
ON public.analysis_sessions 
FOR SELECT 
USING (true);

-- Public insert access for demo (can be restricted later with auth)
CREATE POLICY "Allow public insert access" 
ON public.analysis_sessions 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_analysis_sessions_created_at ON public.analysis_sessions(created_at DESC);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;