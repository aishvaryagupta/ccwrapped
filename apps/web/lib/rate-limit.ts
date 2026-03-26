import { supabase } from './supabase.js';

const ONE_HOUR_MS = 3600_000;

export async function checkAndUpdateRateLimit(
  userId: string,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  // Atomic check-and-set: insert or update only if last_sync is > 1 hour ago
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_user_id: userId,
    p_interval_ms: ONE_HOUR_MS,
  });

  // If RPC doesn't exist yet, fall back to query-based check
  if (error) {
    return checkRateLimitFallback(userId);
  }

  if (data === true) {
    return { allowed: true };
  }

  // Blocked — calculate retry-after
  const { data: limitRow } = await supabase
    .from('sync_rate_limits')
    .select('last_sync')
    .eq('user_id', userId)
    .single();

  if (!limitRow) return { allowed: true };

  const elapsed = Date.now() - new Date(limitRow.last_sync).getTime();
  return {
    allowed: false,
    retryAfter: Math.ceil((ONE_HOUR_MS - elapsed) / 1000),
  };
}

async function checkRateLimitFallback(
  userId: string,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const { data } = await supabase
    .from('sync_rate_limits')
    .select('last_sync')
    .eq('user_id', userId)
    .single();

  if (!data) {
    // First sync — insert rate limit row
    await supabase
      .from('sync_rate_limits')
      .upsert({ user_id: userId, last_sync: new Date().toISOString() });
    return { allowed: true };
  }

  const lastSync = new Date(data.last_sync).getTime();
  const elapsed = Date.now() - lastSync;

  if (elapsed < ONE_HOUR_MS) {
    return {
      allowed: false,
      retryAfter: Math.ceil((ONE_HOUR_MS - elapsed) / 1000),
    };
  }

  // Update timestamp
  await supabase
    .from('sync_rate_limits')
    .update({ last_sync: new Date().toISOString() })
    .eq('user_id', userId);

  return { allowed: true };
}
