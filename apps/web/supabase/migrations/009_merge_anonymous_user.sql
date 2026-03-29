-- Atomic merge of anonymous user into existing Google user
-- Sums overlapping daily_stats, transfers sync_token, deletes anonymous user
CREATE OR REPLACE FUNCTION merge_anonymous_user(
  p_anon_user_id uuid,
  p_target_user_id uuid
) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  -- 1. Merge daily_stats: additive for overlapping dates
  INSERT INTO daily_stats (
    user_id, date, input_tokens, output_tokens,
    cache_creation_tokens, cache_read_tokens, cost_usd,
    session_count, project_count, model_breakdowns,
    tool_usage, files_touched, lines_written, machine_id, synced_at
  )
  SELECT
    p_target_user_id, date, input_tokens, output_tokens,
    cache_creation_tokens, cache_read_tokens, cost_usd,
    session_count, project_count, model_breakdowns,
    tool_usage, files_touched, lines_written, machine_id, now()
  FROM daily_stats
  WHERE user_id = p_anon_user_id
  ON CONFLICT (user_id, date) DO UPDATE SET
    input_tokens = daily_stats.input_tokens + EXCLUDED.input_tokens,
    output_tokens = daily_stats.output_tokens + EXCLUDED.output_tokens,
    cache_creation_tokens = daily_stats.cache_creation_tokens + EXCLUDED.cache_creation_tokens,
    cache_read_tokens = daily_stats.cache_read_tokens + EXCLUDED.cache_read_tokens,
    cost_usd = daily_stats.cost_usd + EXCLUDED.cost_usd,
    session_count = daily_stats.session_count + EXCLUDED.session_count,
    project_count = GREATEST(daily_stats.project_count, EXCLUDED.project_count),
    synced_at = now();

  -- 2. Transfer sync_token_hash to target user (so CLI keeps working)
  UPDATE users
  SET sync_token_hash = (SELECT sync_token_hash FROM users WHERE id = p_anon_user_id)
  WHERE id = p_target_user_id
    AND (SELECT sync_token_hash FROM users WHERE id = p_anon_user_id) IS NOT NULL;

  -- 3. Delete anonymous user (CASCADE deletes remaining daily_stats)
  DELETE FROM daily_stats WHERE user_id = p_anon_user_id;
  DELETE FROM sync_rate_limits WHERE user_id = p_anon_user_id;
  DELETE FROM users WHERE id = p_anon_user_id;
END;
$$;

NOTIFY pgrst, 'reload schema';
