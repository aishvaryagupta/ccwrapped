import { NextResponse } from 'next/server';
import { validateUsername } from '@ccwrapped/core';
import { verifyAndUpsertUser, verifyBySyncToken } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getSessionUserId } from '@/lib/session';

export async function POST(request: Request) {
  // Three-way auth: session cookie > X-Sync-Token > Bearer
  let userId: string | null = null;
  let existingUsername: string | null = null;

  // Try session cookie first (web claim flow)
  userId = await getSessionUserId();

  if (!userId) {
    // Try sync token
    const syncTokenHeader = request.headers.get('X-Sync-Token');
    if (syncTokenHeader) {
      const auth = await verifyBySyncToken(syncTokenHeader);
      if (auth.ok) {
        userId = auth.user.userId;
        existingUsername = auth.user.username;
      }
    }
  }

  if (!userId) {
    // Try Bearer token (backward compat)
    const auth = await verifyAndUpsertUser(request.headers.get('Authorization'));
    if (auth.ok) {
      userId = auth.user.userId;
      existingUsername = auth.user.username;
    }
  }

  if (!userId) {
    return NextResponse.json(
      { error: 'auth', message: 'Not authenticated' },
      { status: 401 },
    );
  }

  // Check if username already set
  if (existingUsername === null) {
    const { data: userRow } = await getSupabaseAdmin()
      .from('users')
      .select('username')
      .eq('id', userId)
      .single();
    existingUsername = userRow?.username ?? null;
  }

  if (existingUsername) {
    return NextResponse.json(
      { error: 'already_set', message: 'Username is already set' },
      { status: 400 },
    );
  }

  let body: { username?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: 'validation', message: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  if (!body.username) {
    return NextResponse.json(
      { error: 'validation', message: 'Username is required' },
      { status: 400 },
    );
  }

  const validation = validateUsername(body.username);
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'validation', message: validation.reason },
      { status: 400 },
    );
  }

  // Claim username (unique constraint handles races)
  const { data, error } = await getSupabaseAdmin()
    .from('users')
    .update({ username: validation.normalized })
    .eq('id', userId)
    .is('username', null)
    .select('username')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'taken', message: 'Username is already taken' },
        { status: 409 },
      );
    }
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'already_set', message: 'Username is already set' },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: 'server', message: 'Failed to claim username' },
      { status: 500 },
    );
  }

  return NextResponse.json({ username: data.username });
}
