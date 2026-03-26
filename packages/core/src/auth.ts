import type { AuthResult, DeviceCodeResponse, GitHubUser } from './types.js';

const GITHUB_DEVICE_CODE_URL = 'https://github.com/login/device/code';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';

export async function startDeviceFlow(
  clientId: string,
): Promise<DeviceCodeResponse | null> {
  try {
    const res = await fetch(GITHUB_DEVICE_CODE_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        scope: 'read:user',
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
  deviceCode: string,
  interval: number,
): Promise<AuthResult> {
  let pollInterval = interval;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await sleep(pollInterval * 1000);

    try {
      const res = await fetch(GITHUB_TOKEN_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        }),
      });

      const data = (await res.json()) as Record<string, string>;

      if (data.access_token) {
        const user = await fetchGitHubUser(data.access_token);
        if (!user) return { ok: false, error: 'network' };
        return { ok: true, token: data.access_token, login: user.login };
      }

      switch (data.error) {
        case 'authorization_pending':
          continue;
        case 'slow_down':
          pollInterval += 5;
          continue;
        case 'expired_token':
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

export async function fetchGitHubUser(
  token: string,
): Promise<GitHubUser | null> {
  try {
    const res = await fetch(GITHUB_USER_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) return null;
    const data = (await res.json()) as GitHubUser;
    return data;
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
