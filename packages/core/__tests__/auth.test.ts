import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchGitHubUser, pollForToken, startDeviceFlow } from '../src/auth.js';

describe('startDeviceFlow', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns device code response on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          device_code: 'dc_123',
          user_code: 'AB12-CD34',
          verification_uri: 'https://github.com/login/device',
          expires_in: 900,
          interval: 5,
        }),
        { status: 200 },
      ),
    );

    const result = await startDeviceFlow('client_123');
    expect(result).not.toBeNull();
    expect(result!.user_code).toBe('AB12-CD34');
    expect(result!.device_code).toBe('dc_123');
  });

  it('returns null on HTTP error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 422 }));
    const result = await startDeviceFlow('bad_client');
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network'));
    const result = await startDeviceFlow('client_123');
    expect(result).toBeNull();
  });
});

describe('pollForToken', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('returns token on success', async () => {
    const mockFetch = vi.mocked(fetch);
    // First poll: pending
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'authorization_pending' }), { status: 200 }),
    );
    // Second poll: success + user fetch
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: 'gho_abc123' }), { status: 200 }),
    );
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ login: 'testuser', avatar_url: 'https://avatar.url' }),
        { status: 200 },
      ),
    );

    const promise = pollForToken('client_123', 'dc_123', 0.01);
    // Advance timers for both polls
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(100);

    const result = await promise;
    expect(result).toEqual({ ok: true, token: 'gho_abc123', login: 'testuser' });
  });

  it('returns expired error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'expired_token' }), { status: 200 }),
    );

    const promise = pollForToken('client_123', 'dc_123', 0.01);
    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;
    expect(result).toEqual({ ok: false, error: 'expired' });
  });

  it('returns denied error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'access_denied' }), { status: 200 }),
    );

    const promise = pollForToken('client_123', 'dc_123', 0.01);
    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;
    expect(result).toEqual({ ok: false, error: 'denied' });
  });
});

describe('fetchGitHubUser', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns user on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ login: 'octocat', avatar_url: 'https://avatars.githubusercontent.com/u/1' }),
        { status: 200 },
      ),
    );

    const user = await fetchGitHubUser('gho_token');
    expect(user).toEqual({
      login: 'octocat',
      avatar_url: 'https://avatars.githubusercontent.com/u/1',
    });
  });

  it('returns null on 401', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 401 }));
    const user = await fetchGitHubUser('bad_token');
    expect(user).toBeNull();
  });
});
