-- Fix: drop the constraint from migration 002 that blocks NULL google_id inserts
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_google_id_unique;

-- Fix: enable RLS on anon_creation_limits
ALTER TABLE anon_creation_limits ENABLE ROW LEVEL SECURITY;

-- Fix: remove redundant partial index (sync_token_hash UNIQUE constraint already covers lookups)
DROP INDEX IF EXISTS idx_users_sync_token_hash;

-- RPC: upsert user by google_id (works with partial unique index, unlike PostgREST client)
CREATE OR REPLACE FUNCTION upsert_google_user(
  p_google_id text,
  p_email text,
  p_display_name text,
  p_avatar_url text
) RETURNS TABLE (user_id uuid, username text)
LANGUAGE plpgsql AS $$
BEGIN
  -- Try update first
  UPDATE users SET
    email = p_email,
    display_name = p_display_name,
    avatar_url = p_avatar_url,
    last_active_at = now()
  WHERE google_id = p_google_id;

  IF FOUND THEN
    RETURN QUERY SELECT id, users.username FROM users WHERE google_id = p_google_id;
    RETURN;
  END IF;

  -- Insert new user
  RETURN QUERY
  INSERT INTO users (google_id, email, display_name, avatar_url)
  VALUES (p_google_id, p_email, p_display_name, p_avatar_url)
  RETURNING id AS user_id, users.username;
END;
$$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
