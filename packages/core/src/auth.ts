import type { AuthResult, DeviceCodeResponse, GoogleUser } from './types.js';

const GOOGLE_DEVICE_CODE_URL = 'https://oauth2.googleapis.com/device/code';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

export async function startDeviceFlow(
  clientId: string,
): Promise<DeviceCodeResponse | null> {
  if (!clientId) return null;

  try {
    const res = await fetch(GOOGLE_DEVICE_CODE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        scope: 'openid email profile',
      }),
    });

    if (!res.ok) return null;
    return (await res.json()) as DeviceCodeResponse;
  } catch {
    return null;
  }
}

export async function pollForToken(
  clientId: string,
  clientSecret: string,
  deviceCode: string,
  interval: number,
): Promise<AuthResult> {
  let pollInterval = interval;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await sleep(pollInterval * 1000);

    try {
      const res = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        }),
      });

      const data = (await res.json()) as Record<string, unknown>;

      if (data.access_token) {
        const user = await fetchGoogleUser(data.access_token as string);
        if (!user) return { ok: false, error: 'network' };
        return {
          ok: true,
          token: data.access_token as string,
          refreshToken: data.refresh_token as string,
          expiresIn: Number(data.expires_in),
          email: user.email,
        };
      }

      switch (data.error) {
        case 'authorization_pending':
          continue;
        case 'slow_down':
          pollInterval += 5;
          continue;
        case 'expired_token':
        case 'invalid_grant':
          return { ok: false, error: 'expired' };
        case 'access_denied':
          return { ok: false, error: 'denied' };
        default:
          return { ok: false, error: 'network' };
      }
    } catch {
      return { ok: false, error: 'network' };
    }
  }
}

export async function fetchGoogleUser(
  token: string,
): Promise<GoogleUser | null> {
  try {
    const res = await fetch(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) return null;
    return (await res.json()) as GoogleUser;
  } catch {
    return null;
  }
}

export async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<{ accessToken: string; expiresIn: number } | null> {
  try {
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    if (!data.access_token) return null;

    return {
      accessToken: data.access_token as string,
      expiresIn: Number(data.expires_in),
    };
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
