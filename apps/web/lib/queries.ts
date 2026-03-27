import { createClient } from '@supabase/supabase-js';

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY');
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

  // Server-side aggregation via Postgres RPC
  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_since: sinceDate,
    p_limit: 100,
  });

  if (error || !data) return [];

  return (data as Array<{
    github_login: string;
    avatar_url: string;
    total_tokens: number;
    total_sessions: number;
  }>).map((row, i) => ({
    rank: i + 1,
    githubLogin: row.github_login,
    avatarUrl: row.avatar_url ?? '',
    totalTokens: Number(row.total_tokens),
    totalSessions: Number(row.total_sessions),
  }));
}
