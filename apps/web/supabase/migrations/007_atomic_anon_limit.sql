-- Atomic anonymous creation rate limiter (replaces JS read-then-write)
CREATE OR REPLACE FUNCTION check_anon_creation_limit(
  p_ip text,
  p_max_per_hour int DEFAULT 5
) RETURNS boolean
LANGUAGE plpgsql AS $$
DECLARE
  v_count int;
BEGIN
  -- Clean expired entry for this IP only
  DELETE FROM anon_creation_limits
  WHERE ip_address = p_ip AND window_start < now() - interval '1 hour';

  -- Atomic insert-or-increment
  INSERT INTO anon_creation_limits (ip_address, count, window_start)
  VALUES (p_ip, 1, now())
  ON CONFLICT (ip_address) DO UPDATE
    SET count = anon_creation_limits.count + 1
    WHERE anon_creation_limits.count < p_max_per_hour
  RETURNING count INTO v_count;

  -- If RETURNING produced a row, the insert/update succeeded
  RETURN v_count IS NOT NULL;
END;
$$;

NOTIFY pgrst, 'reload schema';
