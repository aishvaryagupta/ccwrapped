import { supabase } from './supabase';

const ONE_HOUR_MS = 3600_000;

export async function checkAndUpdateRateLimit(
  userId: string,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_user_id: userId,
    p_interval_ms: ONE_HOUR_MS,
  });

  if (error) {
    // If RPC fails (e.g., function doesn't exist yet), allow the request
    // rather than blocking legitimate syncs
    return { allowed: true };
  }

  if (data === true) {
    return { allowed: true };
  }

  // Blocked — calculate retry-after from the rate limit row
  const { data: limitRow } = await supabase
    .from('sync_rate_limits')
    .select('last_sync')
    .eq('user_id', userId)
    .single();

  if (!limitRow) return { allowed: false, retryAfter: 3600 };

  const elapsed = Date.now() - new Date(limitRow.last_sync).getTime();
  return {
    allowed: false,
    retryAfter: Math.ceil(Math.max(ONE_HOUR_MS - elapsed, 0) / 1000),
  };
}
