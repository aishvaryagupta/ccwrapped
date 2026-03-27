import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchGoogleUser, pollForToken, refreshAccessToken, startDeviceFlow } from '../src/auth.js';

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
          user_code: 'ABCD-1234',
          verification_url: 'https://www.google.com/device',
          expires_in: 1800,
          interval: 5,
        }),
        { status: 200 },
      ),
    );

    const result = await startDeviceFlow('client_123');
    expect(result).not.toBeNull();
    expect(result!.user_code).toBe('ABCD-1234');
    expect(result!.device_code).toBe('dc_123');
    expect(result!.verification_url).toBe('https://www.google.com/device');

    // Verify form-encoded request
    const [url, opts] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('https://oauth2.googleapis.com/device/code');
    expect((opts as RequestInit).headers).toMatchObject({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
  });

  it('returns null on empty client ID', async () => {
    const result = await startDeviceFlow('');
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
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

  it('returns token and refresh token on success', async () => {
    const mockFetch = vi.mocked(fetch);
    // First poll: pending
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'authorization_pending' }), { status: 200 }),
    );
    // Second poll: success
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          access_token: 'ya29_test',
          refresh_token: '1//test_refresh',
          expires_in: 3600,
        }),
        { status: 200 },
      ),
    );
    // User info fetch
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: '123456',
          email: 'user@example.com',
          name: 'Test User',
          picture: 'https://photo.url',
        }),
        { status: 200 },
      ),
    );

    const promise = pollForToken('client_123', 'secret_123', 'dc_123', 0.01);
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(100);

    const result = await promise;
    expect(result).toEqual({
      ok: true,
      token: 'ya29_test',
      refreshToken: '1//test_refresh',
      expiresIn: 3600,
      email: 'user@example.com',
    });
  });

  it('returns expired error on expired_token', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'expired_token' }), { status: 200 }),
    );

    const promise = pollForToken('client_123', 'secret_123', 'dc_123', 0.01);
    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;
    expect(result).toEqual({ ok: false, error: 'expired' });
  });

  it('returns expired error on invalid_grant', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 200 }),
    );

    const promise = pollForToken('client_123', 'secret_123', 'dc_123', 0.01);
    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;
    expect(result).toEqual({ ok: false, error: 'expired' });
  });

  it('returns denied error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'access_denied' }), { status: 200 }),
    );

    const promise = pollForToken('client_123', 'secret_123', 'dc_123', 0.01);
    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;
    expect(result).toEqual({ ok: false, error: 'denied' });
  });
});

describe('fetchGoogleUser', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns Google user on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: '123456789',
          email: 'user@gmail.com',
          name: 'Test User',
          picture: 'https://lh3.googleusercontent.com/photo',
        }),
        { status: 200 },
      ),
    );

    const user = await fetchGoogleUser('ya29_token');
    expect(user).toEqual({
      id: '123456789',
      email: 'user@gmail.com',
      name: 'Test User',
      picture: 'https://lh3.googleusercontent.com/photo',
    });

    // Verify correct endpoint
    const [url] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('https://www.googleapis.com/oauth2/v2/userinfo');
  });

  it('returns null on 401', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 401 }));
    const user = await fetchGoogleUser('bad_token');
    expect(user).toBeNull();
  });
});

describe('refreshAccessToken', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns new access token on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ access_token: 'ya29_new', expires_in: 3600 }),
        { status: 200 },
      ),
    );

    const result = await refreshAccessToken('client_123', 'secret_123', '1//refresh');
    expect(result).toEqual({ accessToken: 'ya29_new', expiresIn: 3600 });

    // Verify form-encoded refresh request
    const [url, opts] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('https://oauth2.googleapis.com/token');
    const body = (opts as RequestInit).body as URLSearchParams;
    expect(body.get('grant_type')).toBe('refresh_token');
    expect(body.get('refresh_token')).toBe('1//refresh');
  });

  it('returns null on failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 401 }));
    const result = await refreshAccessToken('client_123', 'secret_123', 'bad_refresh');
    expect(result).toBeNull();
  });
});
