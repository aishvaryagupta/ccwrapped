-- Migrate from GitHub OAuth to Google OAuth
-- Idempotent: safe to re-run if partially applied

-- Add new columns (IF NOT EXISTS handles re-runs)
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email text DEFAULT 'unknown@migrated';
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name text;

-- Backfill from old columns if they still exist
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='github_login') THEN
    UPDATE users SET username = github_login WHERE github_login IS NOT NULL AND username IS NULL;
  END IF;
END $$;

-- Backfill nulls so NOT NULL can be applied
UPDATE users SET email = 'unknown@migrated' WHERE email IS NULL;

-- Add unique constraints idempotently
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_google_id_unique') THEN
    ALTER TABLE users ADD CONSTRAINT users_google_id_unique UNIQUE (google_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_username_unique') THEN
    ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);
  END IF;
END $$;

-- Drop old columns
ALTER TABLE users DROP COLUMN IF EXISTS github_id;
ALTER TABLE users DROP COLUMN IF EXISTS github_login;

-- NOT NULL on email
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
-- Remove the default we added for migration
ALTER TABLE users ALTER COLUMN email DROP DEFAULT;

-- Ensure tables from initial schema exist
CREATE TABLE IF NOT EXISTS sync_rate_limits (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_sync timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE sync_rate_limits ENABLE ROW LEVEL SECURITY;

-- Indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats (date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_tokens ON daily_stats (date, (input_tokens + output_tokens) DESC);

-- Drop old function signatures (return type changed)
DROP FUNCTION IF EXISTS get_leaderboard(date, int);
DROP FUNCTION IF EXISTS check_rate_limit(uuid, bigint);

-- RPC functions
CREATE OR REPLACE FUNCTION check_rate_limit(p_user_id uuid, p_interval_ms bigint)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE v_last_sync timestamptz; v_interval interval;
BEGIN
  v_interval := (p_interval_ms || ' milliseconds')::interval;
  INSERT INTO sync_rate_limits (user_id, last_sync) VALUES (p_user_id, now())
  ON CONFLICT (user_id) DO UPDATE SET last_sync = now()
  WHERE sync_rate_limits.last_sync < now() - v_interval
  RETURNING last_sync INTO v_last_sync;
  RETURN v_last_sync IS NOT NULL;
END; $$;

CREATE OR REPLACE FUNCTION get_leaderboard(p_since date, p_limit int DEFAULT 100)
RETURNS TABLE (username text, avatar_url text, total_tokens bigint, total_sessions bigint)
LANGUAGE sql STABLE AS $$
  SELECT u.username, u.avatar_url,
    SUM(ds.input_tokens + ds.output_tokens)::bigint AS total_tokens,
    SUM(ds.session_count)::bigint AS total_sessions
  FROM daily_stats ds JOIN users u ON u.id = ds.user_id
  WHERE ds.date >= p_since AND u.username IS NOT NULL
  GROUP BY u.id, u.username, u.avatar_url
  ORDER BY total_tokens DESC LIMIT p_limit;
$$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
