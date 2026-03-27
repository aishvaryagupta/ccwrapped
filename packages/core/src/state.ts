import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { refreshAccessToken } from './auth.js';
import { CONFIG_DIR_NAME, MAX_SYNCED_SESSIONS, STATE_FILE_NAME } from './consts.js';
import { buildMachineId } from './payload.js';
import type { CcwrappedState } from './types.js';

function defaultState(): CcwrappedState {
  return {
    synced_sessions: [],
    last_sync: null,
    auth_token: null,
    refresh_token: null,
    token_expiry: null,
    username: null,
    machine_id: buildMachineId(),
  };
}

export function getConfigDir(configDir?: string): string {
  return configDir ?? join(homedir(), '.config', CONFIG_DIR_NAME);
}

function ensureConfigDir(configDir?: string): string {
  const dir = getConfigDir(configDir);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function statePathForRead(configDir?: string): string {
  return join(getConfigDir(configDir), STATE_FILE_NAME);
}

function statePathForWrite(configDir?: string): string {
  return join(ensureConfigDir(configDir), STATE_FILE_NAME);
}

export function readState(configDir?: string): CcwrappedState {
  try {
    const file = statePathForRead(configDir);
    if (!existsSync(file)) return defaultState();
    const raw = readFileSync(file, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<CcwrappedState>;
    return {
      ...defaultState(),
      ...parsed,
    };
  } catch {
    return defaultState();
  }
}

export function writeState(state: CcwrappedState, configDir?: string): boolean {
  try {
    const file = statePathForWrite(configDir);
    const tmp = `${file}.tmp`;
    writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf-8');
    chmodSync(tmp, 0o600);
    renameSync(tmp, file);
    return true;
  } catch {
    return false;
  }
}

export function addSyncedSession(sessionId: string, configDir?: string): void {
  const state = readState(configDir);
  if (state.synced_sessions.includes(sessionId)) return;

  state.synced_sessions.push(sessionId);
  // FIFO eviction when over cap
  if (state.synced_sessions.length > MAX_SYNCED_SESSIONS) {
    state.synced_sessions = state.synced_sessions.slice(
      state.synced_sessions.length - MAX_SYNCED_SESSIONS,
    );
  }
  state.last_sync = new Date().toISOString();
  writeState(state, configDir);
}

export function isSessionSynced(sessionId: string, configDir?: string): boolean {
  const state = readState(configDir);
  return state.synced_sessions.includes(sessionId);
}

export function getAuthToken(configDir?: string): string | null {
  return readState(configDir).auth_token;
}

export function setAuthToken(
  token: string,
  refreshToken: string,
  expiresIn: number,
  configDir?: string,
): void {
  const state = readState(configDir);
  state.auth_token = token;
  state.refresh_token = refreshToken;
  state.token_expiry = new Date(Date.now() + expiresIn * 1000).toISOString();
  writeState(state, configDir);
}

export function setUsername(username: string, configDir?: string): void {
  const state = readState(configDir);
  state.username = username;
  writeState(state, configDir);
}

export async function getValidToken(
  clientId: string,
  clientSecret: string,
  configDir?: string,
): Promise<string | null> {
  const state = readState(configDir);
  if (!state.auth_token) return null;

  // Token still valid (with 60s buffer)
  if (state.token_expiry) {
    const expiryMs = new Date(state.token_expiry).getTime();
    if (Date.now() < expiryMs - 60_000) {
      return state.auth_token;
    }
  }

  // Try refresh
  if (!state.refresh_token || !clientId || !clientSecret) return null;

  const result = await refreshAccessToken(clientId, clientSecret, state.refresh_token);
  if (!result) return null;

  state.auth_token = result.accessToken;
  state.token_expiry = new Date(Date.now() + result.expiresIn * 1000).toISOString();
  writeState(state, configDir);

  return result.accessToken;
}

export function clearState(configDir?: string): void {
  writeState(defaultState(), configDir);
}
