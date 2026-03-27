import { NextResponse } from 'next/server';
import { validateUsername } from '@ccwrapped/core';
import { verifyAndUpsertUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  const auth = await verifyAndUpsertUser(request.headers.get('Authorization'));
  if (!auth.ok) {
    return NextResponse.json(
      { error: 'auth', message: auth.message },
      { status: auth.status },
    );
  }

  const { user } = auth;

  // Already has a username
  if (user.username) {
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
    .eq('id', user.userId)
    .is('username', null)
    .select('username')
    .single();

  if (error) {
    // Unique constraint violation — another user has this username
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'taken', message: 'Username is already taken' },
        { status: 409 },
      );
    }
    // PGRST116 = single() found 0 rows — username was already set (concurrent request)
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
