import { NextResponse } from 'next/server';
import { verifyAndUpsertUser } from '@/lib/auth';
import { checkAndUpdateRateLimit } from '@/lib/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase';
import { validateSyncPayload } from '@/lib/validation';

export async function POST(request: Request) {
  // 1. Auth
  const auth = await verifyAndUpsertUser(request.headers.get('Authorization'));
  if (!auth.ok) {
    return NextResponse.json(
      { error: 'auth', message: auth.message },
      { status: auth.status },
    );
  }

  const { user } = auth;

  // 2. Rate limit
  const rateLimit = await checkAndUpdateRateLimit(user.userId);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'rate_limit', message: 'Too many syncs. Try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfter) },
      },
    );
  }

  // 3. Validate payload
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'validation', message: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const validation = validateSyncPayload(body);
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'validation', message: validation.error },
      { status: 400 },
    );
  }

  const { payload } = validation;

  // 4. Upsert daily_stats
  const rows = payload.days.map((day) => ({
    user_id: user.userId,
    date: day.date,
    input_tokens: day.inputTokens,
    output_tokens: day.outputTokens,
    cache_creation_tokens: day.cacheCreationTokens,
    cache_read_tokens: day.cacheReadTokens,
    cost_usd: day.costUSD,
    session_count: day.sessionCount,
    project_count: day.projectCount,
    model_breakdowns: day.modelBreakdowns,
    machine_id: payload.machine_id,
    synced_at: new Date().toISOString(),
  }));

  const { error } = await getSupabaseAdmin()
    .from('daily_stats')
    .upsert(rows, { onConflict: 'user_id,date' });

  if (error) {
    return NextResponse.json(
      { error: 'server', message: 'Failed to save stats' },
      { status: 500 },
    );
  }

  // 5. Respond
  return NextResponse.json({
    profile_url: `https://claudewrapped.dev/@${user.githubLogin}`,
  });
}
