import { NextResponse } from 'next/server';
import { verifyAndUpsertUser, verifyBySyncToken } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  // Dual auth: X-Sync-Token takes priority over Bearer
  const syncTokenHeader = request.headers.get('X-Sync-Token');
  const bearerHeader = request.headers.get('Authorization');

  let userId: string;

  if (syncTokenHeader) {
    const auth = await verifyBySyncToken(syncTokenHeader);
    if (!auth.ok) {
      return NextResponse.json(
        { error: 'auth', message: auth.message },
        { status: auth.status },
      );
    }
    userId = auth.user.userId;
  } else if (bearerHeader) {
    const auth = await verifyAndUpsertUser(bearerHeader);
    if (!auth.ok) {
      return NextResponse.json(
        { error: 'auth', message: auth.message },
        { status: auth.status },
      );
    }
    userId = auth.user.userId;
  } else {
    return NextResponse.json(
      { error: 'auth', message: 'Missing authentication' },
      { status: 401 },
    );
  }

  // Parse date from query
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'validation', message: 'Missing or invalid date parameter (YYYY-MM-DD)' },
      { status: 400 },
    );
  }

  // Query
  const { data, error } = await getSupabaseAdmin()
    .from('daily_stats')
    .select('machine_id, synced_at, input_tokens, output_tokens')
    .eq('user_id', userId)
    .eq('date', date)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { machine_id: '', last_sync: '', total_tokens: 0 },
      { status: 404 },
    );
  }

  return NextResponse.json({
    machine_id: data.machine_id ?? '',
    last_sync: data.synced_at,
    total_tokens: (data.input_tokens ?? 0) + (data.output_tokens ?? 0),
  });
}
