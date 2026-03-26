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
import { CONFIG_DIR_NAME, MAX_SYNCED_SESSIONS, STATE_FILE_NAME } from './consts.js';
import { buildMachineId } from './payload.js';
import type { DevwrappedState } from './types.js';

function defaultState(): DevwrappedState {
  return {
    synced_sessions: [],
    last_sync: null,
    auth_token: null,
    github_login: null,
    machine_id: buildMachineId(),
  };
}

export function getConfigDir(configDir?: string): string {
  const dir = configDir ?? join(homedir(), '.config', CONFIG_DIR_NAME);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function statePath(configDir?: string): string {
  return join(getConfigDir(configDir), STATE_FILE_NAME);
}

export function readState(configDir?: string): DevwrappedState {
  try {
    const file = statePath(configDir);
    if (!existsSync(file)) return defaultState();
    const raw = readFileSync(file, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DevwrappedState>;
    return {
      ...defaultState(),
      ...parsed,
    };
  } catch {
    return defaultState();
  }
}

export function writeState(state: DevwrappedState, configDir?: string): boolean {
  try {
    const file = statePath(configDir);
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
  login: string,
  configDir?: string,
): void {
  const state = readState(configDir);
  state.auth_token = token;
  state.github_login = login;
  writeState(state, configDir);
}

export function clearState(configDir?: string): void {
  writeState(defaultState(), configDir);
}
