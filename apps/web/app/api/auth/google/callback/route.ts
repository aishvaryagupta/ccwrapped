import { cookies } from 'next/headers';
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
  const authError = searchParams.get('error');

  if (authError) {
    return NextResponse.redirect(`${BASE_URL}?error=auth_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${BASE_URL}?error=missing_params`);
  }

  // 1. Read and verify cookies
  const cookieStore = await cookies();
  const csrfCookie = cookieStore.get('ccwrapped_csrf')?.value;
  const profileCookie = cookieStore.get('ccwrapped_profile')?.value;
  const pkceCookie = cookieStore.get('ccwrapped_pkce')?.value;

  if (!csrfCookie || !profileCookie || !pkceCookie) {
    return NextResponse.redirect(`${BASE_URL}?error=session_expired`);
  }

  const nonce = verifySignedValue(csrfCookie);
  const profileId = verifySignedValue(profileCookie);
  const codeVerifier = verifySignedValue(pkceCookie);

  if (!nonce || !profileId || !codeVerifier) {
    return NextResponse.redirect(`${BASE_URL}?error=invalid_cookies`);
  }

  // 2. Verify CSRF
  if (nonce !== state) {
    return NextResponse.redirect(`${BASE_URL}?error=csrf_mismatch`);
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
    // Merge: atomic RPC transfers stats, sync_token, deletes anonymous user
    await supabase.rpc('merge_anonymous_user', {
      p_anon_user_id: anonUser.id,
      p_target_user_id: existingGoogleUser.id,
    });

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
  const expiry = Math.floor(Date.now() / 1000) + 3600;
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
