-- Computed column for anonymous profile URL lookups
-- Stores first 12 chars of UUID as text, with a unique index
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_id_prefix text
  GENERATED ALWAYS AS (left(id::text, 12)) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_profile_id_prefix
  ON users (profile_id_prefix);

NOTIFY pgrst, 'reload schema';
