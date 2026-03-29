import { NextResponse } from 'next/server';
import { verifyAndUpsertUser, verifyBySyncToken, createAnonymousUser } from '@/lib/auth';
import { checkAndUpdateRateLimit } from '@/lib/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase';
import { validateSyncPayload } from '@/lib/validation';

export async function POST(request: Request) {
  // 1. Parse body first (needed for machine_id in anonymous creation)
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

  // 2. Three-way auth (X-Sync-Token takes priority over Bearer)
  const syncTokenHeader = request.headers.get('X-Sync-Token');
  const bearerHeader = request.headers.get('Authorization');

  let userId: string;
  let username: string | null = null;
  let returnSyncToken: string | undefined;

  if (syncTokenHeader) {
    // Path 1: Sync token auth (new CLI)
    const auth = await verifyBySyncToken(syncTokenHeader);
    if (!auth.ok) {
      return NextResponse.json(
        { error: 'auth', message: auth.message },
        { status: auth.status },
      );
    }
    userId = auth.user.userId;
    username = auth.user.username;
  } else if (bearerHeader) {
    // Path 2: Google Bearer auth (backward compat)
    const auth = await verifyAndUpsertUser(bearerHeader);
    if (!auth.ok) {
      return NextResponse.json(
        { error: 'auth', message: auth.message },
        { status: auth.status },
      );
    }
    userId = auth.user.userId;
    username = auth.user.username;
    returnSyncToken = auth.syncToken;
  } else {
    // Path 3: Anonymous first sync
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? 'unknown';
    const auth = await createAnonymousUser(payload.machine_id, ip);
    if (!auth.ok) {
      return NextResponse.json(
        { error: 'auth', message: auth.message },
        { status: auth.status },
      );
    }
    userId = auth.user.userId;
    username = auth.user.username;
    returnSyncToken = auth.syncToken;
  }

  // 3. Rate limit
  const rateLimit = await checkAndUpdateRateLimit(userId);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'rate_limit', message: 'Too many syncs. Try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfter) },
      },
    );
  }

  // 4. Upsert daily_stats
  const rows = payload.days.map((day) => ({
    user_id: userId,
    date: day.date,
    input_tokens: day.inputTokens,
    output_tokens: day.outputTokens,
    cache_creation_tokens: day.cacheCreationTokens,
    cache_read_tokens: day.cacheReadTokens,
    cost_usd: day.costUSD,
    session_count: day.sessionCount,
    project_count: day.projectCount,
    model_breakdowns: day.modelBreakdowns,
    tool_usage: ('toolCounts' in day ? day.toolCounts : null) ?? null,
    files_touched: ('filesTouched' in day ? day.filesTouched : null) ?? null,
    lines_written: ('linesWritten' in day ? day.linesWritten : null) ?? null,
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

  // 5. Build profile URL
  const profileUrl = username
    ? `https://ccwrapped.dev/@${username}`
    : `https://ccwrapped.dev/p/${userId.slice(0, 8)}`;

  // 6. Respond
  return NextResponse.json({
    profile_url: profileUrl,
    username,
    ...(returnSyncToken ? { sync_token: returnSyncToken } : {}),
  });
}
