import { NextResponse } from 'next/server';
import { verifySignedValue, signValue } from '@/lib/cookies';
import { getSupabaseAdmin } from '@/lib/supabase';

const GOOGLE_CLIENT_ID =
  process.env.CCWRAPPED_GOOGLE_CLIENT_ID ??
  '266471192159-3nbjppkhkee2v6eur6vibribf7hhst0v.apps.googleusercontent.com';

const GOOGLE_CLIENT_SECRET =
  process.env.CCWRAPPED_GOOGLE_CLIENT_SECRET ??
  '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';

const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ?? 'https://ccwrapped.dev/api/auth/google/callback';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ccwrapped.dev';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${BASE_URL}?error=auth_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${BASE_URL}?error=missing_params`);
  }

  // 1. Verify CSRF nonce
  const csrfCookie = request.headers.get('cookie')?.match(/ccwrapped_csrf=([^;]+)/)?.[1];
  if (!csrfCookie) {
    return NextResponse.redirect(`${BASE_URL}?error=csrf_missing`);
  }

  const nonce = verifySignedValue(decodeURIComponent(csrfCookie));
  if (!nonce || nonce !== state) {
    return NextResponse.redirect(`${BASE_URL}?error=csrf_mismatch`);
  }

  // 2. Read profile_id and code_verifier from cookies
  const profileCookie = request.headers.get('cookie')?.match(/ccwrapped_profile=([^;]+)/)?.[1];
  const pkceCookie = request.headers.get('cookie')?.match(/ccwrapped_pkce=([^;]+)/)?.[1];

  if (!profileCookie || !pkceCookie) {
    return NextResponse.redirect(`${BASE_URL}?error=session_expired`);
  }

  const profileId = verifySignedValue(decodeURIComponent(profileCookie));
  const codeVerifier = verifySignedValue(decodeURIComponent(pkceCookie));

  if (!profileId || !codeVerifier) {
    return NextResponse.redirect(`${BASE_URL}?error=invalid_cookies`);
  }

  // 3. Exchange code for access token (with PKCE)
  let accessToken: string;
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${BASE_URL}?error=token_exchange`);
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      return NextResponse.redirect(`${BASE_URL}?error=no_token`);
    }

    accessToken = tokenData.access_token;
  } catch {
    return NextResponse.redirect(`${BASE_URL}?error=token_error`);
  }

  // 4. Fetch Google user info
  let googleUser: { id: string; email: string; name: string; picture: string };
  try {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(5000),
    });

    if (!userRes.ok) {
      return NextResponse.redirect(`${BASE_URL}?error=userinfo_failed`);
    }

    googleUser = (await userRes.json()) as typeof googleUser;
  } catch {
    return NextResponse.redirect(`${BASE_URL}?error=userinfo_error`);
  }

  // 5. Look up anonymous user by profile_id
  const supabase = getSupabaseAdmin();
  const { data: anonUser } = await supabase
    .from('users')
    .select('id, username, sync_token_hash')
    .eq('profile_id_prefix', profileId)
    .single();

  if (!anonUser) {
    return NextResponse.redirect(`${BASE_URL}?error=profile_not_found`);
  }

  // 6. Check if Google account already has a user
  const { data: existingGoogleUser } = await supabase
    .from('users')
    .select('id, username')
    .eq('google_id', googleUser.id)
    .single();

  let finalUserId: string;
  let finalUsername: string | null;

  if (existingGoogleUser && existingGoogleUser.id !== anonUser.id) {
    // Merge: move anonymous stats to existing Google user, transfer sync_token
    // Use a transaction-like approach via sequential operations
    // 1. Merge daily_stats with upsert-with-sum for overlapping dates
    const { data: anonStats } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', anonUser.id);

    if (anonStats && anonStats.length > 0) {
      for (const row of anonStats) {
        await supabase.from('daily_stats').upsert(
          {
            user_id: existingGoogleUser.id,
            date: row.date,
            input_tokens: row.input_tokens,
            output_tokens: row.output_tokens,
            cache_creation_tokens: row.cache_creation_tokens,
            cache_read_tokens: row.cache_read_tokens,
            cost_usd: row.cost_usd,
            session_count: row.session_count,
            project_count: row.project_count,
            model_breakdowns: row.model_breakdowns,
            tool_usage: row.tool_usage,
            files_touched: row.files_touched,
            lines_written: row.lines_written,
            machine_id: row.machine_id,
            synced_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,date' },
        );
      }
    }

    // 2. Transfer sync_token_hash to existing user (so CLI keeps working)
    if (anonUser.sync_token_hash) {
      await supabase
        .from('users')
        .update({ sync_token_hash: anonUser.sync_token_hash })
        .eq('id', existingGoogleUser.id);
    }

    // 3. Delete anonymous user (cascade deletes remaining daily_stats)
    await supabase.from('daily_stats').delete().eq('user_id', anonUser.id);
    await supabase.from('users').delete().eq('id', anonUser.id);

    finalUserId = existingGoogleUser.id;
    finalUsername = existingGoogleUser.username;
  } else {
    // Link Google account to anonymous user
    await supabase
      .from('users')
      .update({
        google_id: googleUser.id,
        email: googleUser.email,
        display_name: googleUser.name,
        avatar_url: googleUser.picture,
      })
      .eq('id', anonUser.id);

    finalUserId = anonUser.id;
    finalUsername = anonUser.username;
  }

  // 7. Set session cookie for claim page
  const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  const sessionValue = `${finalUserId}:${expiry}`;

  const response = finalUsername
    ? NextResponse.redirect(`${BASE_URL}/${finalUsername}`)
    : NextResponse.redirect(`${BASE_URL}/claim`);

  response.cookies.set('ccwrapped_session', signValue(sessionValue), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 3600,
  });

  // Clear OAuth cookies
  const clearOpts = { path: '/api/auth', maxAge: 0 };
  response.cookies.set('ccwrapped_csrf', '', clearOpts);
  response.cookies.set('ccwrapped_profile', '', clearOpts);
  response.cookies.set('ccwrapped_pkce', '', clearOpts);

  return response;
}
