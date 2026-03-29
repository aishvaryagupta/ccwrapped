import { getSupabaseAdmin } from './supabase';

export interface AuthenticatedUser {
  userId: string;
  googleId: string;
  username: string | null;
  email: string;
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

  // Verify token with Google
  let googleUser: { id: string; email: string; name: string; picture: string };
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return { ok: false, status: 401, message: 'Invalid or expired Google token' };
    }

    googleUser = (await res.json()) as typeof googleUser;
  } catch {
    return { ok: false, status: 401, message: 'Failed to verify token with Google' };
  }

  // Upsert user via RPC (works with partial unique index on google_id)
  const { data, error } = await getSupabaseAdmin()
    .rpc('upsert_google_user', {
      p_google_id: googleUser.id,
      p_email: googleUser.email,
      p_display_name: googleUser.name,
      p_avatar_url: googleUser.picture,
    })
    .single() as { data: { user_id: string; username: string | null } | null; error: unknown };

  if (error || !data) {
    return { ok: false, status: 500, message: 'Failed to upsert user' };
  }

  return {
    ok: true,
    user: {
      userId: data.user_id,
      googleId: googleUser.id,
      username: data.username,
      email: googleUser.email,
      avatarUrl: googleUser.picture,
    },
  };
}
