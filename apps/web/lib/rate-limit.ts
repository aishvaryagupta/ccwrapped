import { supabase } from './supabase.js';

const ONE_HOUR_MS = 3600_000;

export async function checkRateLimit(
  userId: string,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const { data } = await supabase
    .from('daily_stats')
    .select('synced_at')
    .eq('user_id', userId)
    .order('synced_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) return { allowed: true };

  const lastSync = new Date(data.synced_at).getTime();
  const elapsed = Date.now() - lastSync;

  if (elapsed < ONE_HOUR_MS) {
    return {
      allowed: false,
      retryAfter: Math.ceil((ONE_HOUR_MS - elapsed) / 1000),
    };
  }

  return { allowed: true };
}
