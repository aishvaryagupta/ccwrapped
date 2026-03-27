import { NextResponse } from 'next/server';
import { validateUsername } from '@ccwrapped/core';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json(
      { error: 'validation', message: 'username query parameter is required' },
      { status: 400 },
    );
  }

  const validation = validateUsername(username);
  if (!validation.valid) {
    return NextResponse.json({ available: false, reason: validation.reason });
  }

  const { data } = await getSupabaseAdmin()
    .from('users')
    .select('id')
    .eq('username', validation.normalized)
    .single();

  return NextResponse.json({ available: !data });
}
