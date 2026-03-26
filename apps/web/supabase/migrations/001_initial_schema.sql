CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id       bigint UNIQUE NOT NULL,
  github_login    text NOT NULL,
  avatar_url      text,
  created_at      timestamptz DEFAULT now(),
  settings        jsonb DEFAULT '{}'::jsonb
);

-- Daily stats (one row per user per day, upsert on sync)
CREATE TABLE daily_stats (
  user_id                 uuid REFERENCES users(id) ON DELETE CASCADE,
  date                    date NOT NULL,
  input_tokens            bigint NOT NULL DEFAULT 0,
  output_tokens           bigint NOT NULL DEFAULT 0,
  cache_creation_tokens   bigint DEFAULT 0,
  cache_read_tokens       bigint DEFAULT 0,
  cost_usd                numeric(10,4),
  session_count           int,
  project_count           int,
  model_breakdowns        jsonb,
  machine_id              text,
  synced_at               timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

-- Indexes
CREATE INDEX idx_daily_stats_date ON daily_stats (date);
CREATE INDEX idx_daily_stats_tokens ON daily_stats (date, (input_tokens + output_tokens) DESC);
CREATE INDEX idx_daily_stats_synced_at ON daily_stats (user_id, synced_at DESC);

-- Row-level security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users are publicly readable"
  ON users FOR SELECT USING (true);

CREATE POLICY "Daily stats are publicly readable"
  ON daily_stats FOR SELECT USING (true);
