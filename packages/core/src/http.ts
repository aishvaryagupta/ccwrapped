import { HTTP_TIMEOUT_MS } from './consts.js';
import type { HttpResult, SyncMetadata, SyncPayload } from './types.js';

export async function postSyncPayload(
  baseUrl: string,
  token: string,
  payload: SyncPayload,
): Promise<HttpResult<{ profile_url: string }>> {
  try {
    const res = await fetch(`${baseUrl}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });

    if (res.status === 401) {
      return { ok: false, error: 'auth', message: 'Invalid or expired token' };
    }

    if (!res.ok) {
      return { ok: false, error: 'server', message: `HTTP ${res.status}` };
    }

    const data = (await res.json()) as { profile_url: string };
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'network', message: 'Could not reach server' };
  }
}

export async function fetchSyncMetadata(
  baseUrl: string,
  token: string,
  date: string,
): Promise<HttpResult<SyncMetadata>> {
  try {
    const res = await fetch(`${baseUrl}/sync/metadata?date=${date}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
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
