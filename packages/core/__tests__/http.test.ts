import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchSyncMetadata, postSyncPayload } from '../src/http.js';
import type { SyncPayload } from '../src/types.js';

const mockPayload: SyncPayload = {
  schema_version: 1,
  client_version: '0.1.0',
  machine_id: 'test123',
  days: [],
};

describe('postSyncPayload', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends correct request and returns data on success', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ profile_url: 'https://ccwrapped.dev/@user' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await postSyncPayload('https://api.test', mockPayload, { syncToken: 'token123' });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.test/sync');
    expect((opts as RequestInit).method).toBe('POST');
    expect((opts as RequestInit).headers).toMatchObject({
      'X-Sync-Token': 'token123',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.profile_url).toBe('https://ccwrapped.dev/@user');
    }
  });

  it('returns auth error on 401', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 401 }));
    const result = await postSyncPayload('https://api.test', mockPayload, { syncToken: 'bad' });
    expect(result).toEqual({ ok: false, error: 'auth', message: 'Invalid or expired token' });
  });

  it('returns server error on 500', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }));
    const result = await postSyncPayload('https://api.test', mockPayload, { syncToken: 'token' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('server');
  });

  it('returns network error on fetch failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('ECONNREFUSED'));
    const result = await postSyncPayload('https://api.test', mockPayload, { syncToken: 'token' });
    expect(result).toEqual({ ok: false, error: 'network', message: 'Could not reach server' });
  });
});

describe('fetchSyncMetadata', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns metadata on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ machine_id: 'abc', last_sync: '2026-03-27', total_tokens: 100000 }),
        { status: 200 },
      ),
    );

    const result = await fetchSyncMetadata('https://api.test', '2026-03-27', { syncToken: 'token' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.machine_id).toBe('abc');
    }
  });

  it('returns empty metadata on 404', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 404 }));
    const result = await fetchSyncMetadata('https://api.test', '2026-03-27', { syncToken: 'token' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.total_tokens).toBe(0);
    }
  });

  it('returns network error on failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('timeout'));
    const result = await fetchSyncMetadata('https://api.test', '2026-03-27', { syncToken: 'token' });
    expect(result).toEqual({ ok: false, error: 'network' });
  });
});
