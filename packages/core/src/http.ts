import { HTTP_TIMEOUT_MS } from './consts.js';
import type { HttpResult, SyncMetadata, SyncPayload } from './types.js';

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 500;

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

async function delay(attempt: number): Promise<void> {
  const ms = BASE_DELAY_MS * 2 ** attempt + Math.random() * BASE_DELAY_MS;
  return new Promise((r) => setTimeout(r, ms));
}

class TimeoutError extends Error {
  constructor() {
    super('Request timed out');
    this.name = 'TimeoutError';
  }
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
      });
      if (attempt < MAX_RETRIES && isRetryable(res.status)) {
        await delay(attempt);
        continue;
      }
      return res;
    } catch (err) {
      const isTimeout = err instanceof DOMException && err.name === 'TimeoutError';
      lastError = isTimeout ? new TimeoutError() : err;
      if (attempt < MAX_RETRIES) {
        await delay(attempt);
      }
    }
  }
  throw lastError;
}

export async function postSyncPayload(
  baseUrl: string,
  token: string,
  payload: SyncPayload,
): Promise<HttpResult<{ profile_url: string }>> {
  try {
    const res = await fetchWithRetry(`${baseUrl}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      return { ok: false, error: 'auth', message: 'Invalid or expired token' };
    }

    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After');
      return { ok: false, error: 'server', message: `Rate limited. Try again in ${retryAfter ?? '60'} minutes.` };
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return { ok: false, error: 'server', message: body.message ?? `HTTP ${res.status}` };
    }

    const data = (await res.json()) as { profile_url: string };
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof TimeoutError
      ? 'Request timed out — server may be slow, try again'
      : 'Could not reach server';
    return { ok: false, error: 'network', message };
  }
}

export async function fetchSyncMetadata(
  baseUrl: string,
  token: string,
  date: string,
): Promise<HttpResult<SyncMetadata>> {
  try {
    const res = await fetchWithRetry(`${baseUrl}/sync/metadata?date=${date}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      return { ok: false, error: 'auth' };
    }

    if (res.status === 404) {
      return { ok: true, data: { machine_id: '', last_sync: '', total_tokens: 0 } };
    }

    if (!res.ok) {
      return { ok: false, error: 'server' };
    }

    const data = (await res.json()) as SyncMetadata;
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'network' };
  }
}

export async function claimUsername(
  baseUrl: string,
  token: string,
  username: string,
): Promise<HttpResult<{ username: string }>> {
  try {
    const res = await fetchWithRetry(`${baseUrl}/username`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username }),
    });

    if (res.status === 401) {
      return { ok: false, error: 'auth', message: 'Invalid or expired token' };
    }

    if (res.status === 409) {
      return { ok: false, error: 'server', message: 'Username is already taken' };
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return { ok: false, error: 'validation', message: body.message ?? `HTTP ${res.status}` };
    }

    const data = (await res.json()) as { username: string };
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof TimeoutError
      ? 'Request timed out — server may be slow, try again'
      : 'Could not reach server';
    return { ok: false, error: 'network', message };
  }
}
