import { createHash, randomUUID } from 'node:crypto';
import { getSupabaseAdmin } from './supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthenticatedUser {
  userId: string;
  username: string | null;
  googleId?: string;
  email?: string;
  avatarUrl?: string;
}

type AuthResult =
  | { ok: true; user: AuthenticatedUser; syncToken?: string }
  | { ok: false; status: number; message: string };

// ---------------------------------------------------------------------------
// Sync token helpers
// ---------------------------------------------------------------------------

function hashSyncToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

// ---------------------------------------------------------------------------
// Verify by sync token (X-Sync-Token header)
// ---------------------------------------------------------------------------

export async function verifyBySyncToken(rawToken: string): Promise<AuthResult> {
  const hash = hashSyncToken(rawToken);

  const { data, error } = await getSupabaseAdmin()
    .from('users')
    .select('id, username')
    .eq('sync_token_hash', hash)
    .single();

  if (error || !data) {
    return { ok: false, status: 401, message: 'Invalid sync token' };
  }

  // Best-effort update of last_active_at
  void getSupabaseAdmin()
    .from('users')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', data.id);

  return {
    ok: true,
    user: { userId: data.id, username: data.username },
  };
}

// ---------------------------------------------------------------------------
// Create anonymous user (no auth headers)
// Idempotent: reuses existing anonymous user for the same machine_id
// ---------------------------------------------------------------------------

export async function createAnonymousUser(
  machineId: string,
  ip: string,
): Promise<AuthResult & { syncToken?: string }> {
  // Check for existing anonymous user with this machine_id (idempotent retry)
  const { data: existing } = await getSupabaseAdmin()
    .from('users')
    .select('id, username, sync_token_hash')
    .eq('machine_id', machineId)
    .is('google_id', null)
    .single();

  if (existing) {
    // Machine already has an anonymous profile. Do NOT rotate the token —
    // that would let an attacker who guesses the machine_id hijack the profile.
    // The CLI should still have the sync_token in state.json.
    return {
      ok: false,
      status: 409,
      message: 'A profile already exists for this machine. Use your existing sync token or delete ~/.config/ccwrapped/state.json to start fresh.',
    };
  }

  // IP rate limit via atomic Postgres function
  const { data: allowed } = await getSupabaseAdmin()
    .rpc('check_anon_creation_limit', { p_ip: ip }) as { data: boolean | null };

  if (!allowed) {
    return { ok: false, status: 429, message: 'Too many accounts created. Try again later.' };
  }

  const rawToken = randomUUID();
  const hash = hashSyncToken(rawToken);

  const { data, error } = await getSupabaseAdmin()
    .from('users')
    .insert({ sync_token_hash: hash, machine_id: machineId })
    .select('id, username')
    .single();

  if (error || !data) {
    return { ok: false, status: 500, message: 'Failed to create user' };
  }

  return {
    ok: true,
    user: { userId: data.id, username: data.username },
    syncToken: rawToken,
  };
}

// ---------------------------------------------------------------------------
// Verify by Google Bearer token (backward compat)
// ---------------------------------------------------------------------------

export async function verifyAndUpsertUser(
  authHeader: string | null,
): Promise<AuthResult & { syncToken?: string }> {
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

  // Generate sync_token for migration if user doesn't have one
  let syncToken: string | undefined;
  const { data: userRow } = await getSupabaseAdmin()
    .from('users')
    .select('sync_token_hash')
    .eq('id', data.user_id)
    .single();

  if (!userRow?.sync_token_hash) {
    const rawToken = randomUUID();
    await getSupabaseAdmin()
      .from('users')
      .update({ sync_token_hash: hashSyncToken(rawToken) })
      .eq('id', data.user_id);
    syncToken = rawToken;
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
    syncToken,
  };
}
