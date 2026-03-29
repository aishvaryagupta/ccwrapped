import { NextResponse } from 'next/server';
import { signValue, generateNonce } from '@/lib/cookies';
import { generateCodeVerifier, generateCodeChallenge } from '@/lib/pkce';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID ?? '';

const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ?? 'https://ccwrapped.dev/api/auth/google/callback';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get('profile_id');

  if (!profileId || !/^[a-f0-9]{8,12}$/.test(profileId)) {
    return NextResponse.json(
      { error: 'Invalid profile_id' },
      { status: 400 },
    );
  }

  // Generate CSRF nonce
  const nonce = generateNonce();

  // Generate PKCE code verifier + challenge
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Build Google OAuth URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', nonce);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('access_type', 'online');
  authUrl.searchParams.set('prompt', 'select_account');

  // Set signed cookies for callback verification
  const response = NextResponse.redirect(authUrl.toString());

  const cookieOpts = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/api/auth',
    maxAge: 300, // 5 minutes
  };

  response.cookies.set('ccwrapped_csrf', signValue(nonce), cookieOpts);
  response.cookies.set('ccwrapped_profile', signValue(profileId), cookieOpts);
  response.cookies.set('ccwrapped_pkce', signValue(codeVerifier), cookieOpts);

  return response;
}
