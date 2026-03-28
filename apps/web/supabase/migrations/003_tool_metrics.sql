-- Add tool metrics columns (nullable for backward compatibility with schema v1)
ALTER TABLE daily_stats ADD COLUMN IF NOT EXISTS tool_usage jsonb;
ALTER TABLE daily_stats ADD COLUMN IF NOT EXISTS files_touched int;
ALTER TABLE daily_stats ADD COLUMN IF NOT EXISTS lines_written int;
