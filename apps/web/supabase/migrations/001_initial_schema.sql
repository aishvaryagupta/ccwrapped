CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id       text UNIQUE NOT NULL,
  username        text UNIQUE,
  email           text NOT NULL,
  display_name    text,
  avatar_url      text,
  created_at      timestamptz DEFAULT now(),
  settings        jsonb DEFAULT '{}'::jsonb
);

-- UNIQUE constraint on username already creates an implicit B-tree index

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

-- Rate limiting (atomic check-and-set)
CREATE TABLE sync_rate_limits (
  user_id     uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_sync   timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_daily_stats_date ON daily_stats (date);
CREATE INDEX idx_daily_stats_tokens ON daily_stats (date, (input_tokens + output_tokens) DESC);

-- Row-level security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_rate_limits ENABLE ROW LEVEL SECURITY;

-- Read-only policies for anon/authenticated clients
-- Service role key bypasses RLS entirely for writes
CREATE POLICY "Users are publicly readable"
  ON users FOR SELECT USING (true);

CREATE POLICY "Daily stats are publicly readable"
  ON daily_stats FOR SELECT USING (true);

-- No write policies for anon — writes only via service role key

-- ============================================================
-- RPC: Atomic rate limit check-and-set
-- Returns true if allowed, false if rate-limited
-- ============================================================
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id uuid,
  p_interval_ms bigint
) RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_last_sync timestamptz;
  v_interval interval;
BEGIN
  v_interval := (p_interval_ms || ' milliseconds')::interval;

  -- Atomic: insert if not exists, or update if interval has passed
  INSERT INTO sync_rate_limits (user_id, last_sync)
  VALUES (p_user_id, now())
  ON CONFLICT (user_id) DO UPDATE
    SET last_sync = now()
    WHERE sync_rate_limits.last_sync < now() - v_interval
  RETURNING last_sync INTO v_last_sync;

  -- If RETURNING produced a row, the insert/update succeeded → allowed
  RETURN v_last_sync IS NOT NULL;
END;
$$;

-- ============================================================
-- RPC: Leaderboard query (server-side aggregation)
-- Returns top users by total tokens for a date range
-- ============================================================
CREATE OR REPLACE FUNCTION get_leaderboard(
  p_since date,
  p_limit int DEFAULT 100
) RETURNS TABLE (
  username text,
  avatar_url text,
  total_tokens bigint,
  total_sessions bigint
)
LANGUAGE sql STABLE
AS $$
  SELECT
    u.username,
    u.avatar_url,
    SUM(ds.input_tokens + ds.output_tokens)::bigint AS total_tokens,
    SUM(ds.session_count)::bigint AS total_sessions
  FROM daily_stats ds
  JOIN users u ON u.id = ds.user_id
  WHERE ds.date >= p_since
    AND u.username IS NOT NULL
  GROUP BY u.id, u.username, u.avatar_url
  ORDER BY total_tokens DESC
  LIMIT p_limit;
$$;
