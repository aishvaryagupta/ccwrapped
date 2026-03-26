import { createClient } from '@supabase/supabase-js';

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface UserProfile {
  id: string;
  githubLogin: string;
  avatarUrl: string;
  createdAt: string;
}

export interface DayStats {
  date: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  costUsd: number;
  sessionCount: number;
  projectCount: number;
  modelBreakdowns: Array<{
    modelName: string;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
  }>;
}

export async function fetchUserProfile(
  username: string,
): Promise<UserProfile | null> {
  const supabase = getClient();
  const { data } = await supabase
    .from('users')
    .select('id, github_login, avatar_url, created_at')
    .eq('github_login', username)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    githubLogin: data.github_login,
    avatarUrl: data.avatar_url,
    createdAt: data.created_at,
  };
}

export async function fetchUserStats(userId: string): Promise<DayStats[]> {
  const supabase = getClient();
  const { data } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  if (!data) return [];

  return data.map((row) => ({
    date: row.date,
    inputTokens: row.input_tokens ?? 0,
    outputTokens: row.output_tokens ?? 0,
    cacheCreationTokens: row.cache_creation_tokens ?? 0,
    cacheReadTokens: row.cache_read_tokens ?? 0,
    costUsd: Number(row.cost_usd ?? 0),
    sessionCount: row.session_count ?? 0,
    projectCount: row.project_count ?? 0,
    modelBreakdowns: (row.model_breakdowns ?? []) as DayStats['modelBreakdowns'],
  }));
}

export interface LeaderboardEntry {
  rank: number;
  githubLogin: string;
  avatarUrl: string;
  totalTokens: number;
  totalSessions: number;
}

export async function fetchLeaderboard(
  period: 'daily' | 'weekly' | 'monthly',
): Promise<LeaderboardEntry[]> {
  const supabase = getClient();

  const now = new Date();
  let sinceDate: string;
  switch (period) {
    case 'daily':
      sinceDate = now.toISOString().slice(0, 10);
      break;
    case 'weekly':
      sinceDate = new Date(now.getTime() - 7 * 86400_000).toISOString().slice(0, 10);
      break;
    case 'monthly':
      sinceDate = new Date(now.getTime() - 30 * 86400_000).toISOString().slice(0, 10);
      break;
  }

  // Fetch stats with date filter, then aggregate client-side
  // (Supabase JS doesn't support JOIN + GROUP BY directly)
  const { data: stats } = await supabase
    .from('daily_stats')
    .select('user_id, input_tokens, output_tokens, session_count')
    .gte('date', sinceDate);

  if (!stats || stats.length === 0) return [];

  // Aggregate by user
  const userAgg = new Map<
    string,
    { totalTokens: number; totalSessions: number }
  >();

  for (const row of stats) {
    const existing = userAgg.get(row.user_id);
    const tokens = (row.input_tokens ?? 0) + (row.output_tokens ?? 0);
    const sessions = row.session_count ?? 0;

    if (existing) {
      existing.totalTokens += tokens;
      existing.totalSessions += sessions;
    } else {
      userAgg.set(row.user_id, { totalTokens: tokens, totalSessions: sessions });
    }
  }

  // Sort by total tokens
  const sorted = [...userAgg.entries()]
    .sort((a, b) => b[1].totalTokens - a[1].totalTokens)
    .slice(0, 100);

  // Fetch user details
  const userIds = sorted.map(([id]) => id);
  const { data: users } = await supabase
    .from('users')
    .select('id, github_login, avatar_url')
    .in('id', userIds);

  const userMap = new Map(
    (users ?? []).map((u) => [u.id, { login: u.github_login, avatar: u.avatar_url }]),
  );

  return sorted.map(([userId, agg], i) => {
    const user = userMap.get(userId);
    return {
      rank: i + 1,
      githubLogin: user?.login ?? 'unknown',
      avatarUrl: user?.avatar ?? '',
      totalTokens: agg.totalTokens,
      totalSessions: agg.totalSessions,
    };
  });
}
