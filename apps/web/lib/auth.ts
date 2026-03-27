import { supabase } from './supabase';

export interface AuthenticatedUser {
  userId: string;
  githubId: number;
  githubLogin: string;
  avatarUrl: string;
}

type AuthResult =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; status: number; message: string };

export async function verifyAndUpsertUser(
  authHeader: string | null,
): Promise<AuthResult> {
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, message: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.slice(7);
  if (!token) {
    return { ok: false, status: 401, message: 'Empty token' };
  }

  // Verify token with GitHub
  let githubUser: { id: number; login: string; avatar_url: string };
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return { ok: false, status: 401, message: 'Invalid or expired GitHub token' };
    }

    githubUser = (await res.json()) as typeof githubUser;
  } catch {
    return { ok: false, status: 401, message: 'Failed to verify token with GitHub' };
  }

  // Upsert user
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        github_id: githubUser.id,
        github_login: githubUser.login,
        avatar_url: githubUser.avatar_url,
      },
      { onConflict: 'github_id' },
    )
    .select('id')
    .single();

  if (error || !data) {
    return { ok: false, status: 500, message: 'Failed to upsert user' };
  }

  return {
    ok: true,
    user: {
      userId: data.id,
      githubId: githubUser.id,
      githubLogin: githubUser.login,
      avatarUrl: githubUser.avatar_url,
    },
  };
}
