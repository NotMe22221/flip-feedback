-- Add batch_id column to group related uploads
ALTER TABLE analysis_sessions 
ADD COLUMN batch_id uuid;

-- Create index for better query performance on batch operations
CREATE INDEX idx_batch_id ON analysis_sessions(batch_id);