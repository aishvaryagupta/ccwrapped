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
import type { CcwrappedState } from './types.js';

function defaultState(): CcwrappedState {
  return {
    synced_sessions: [],
    last_sync: null,
    username: null,
    machine_id: buildMachineId(),
    sync_token: null,
    profile_id: null,
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

export function setUsername(username: string, configDir?: string): void {
  const state = readState(configDir);
  state.username = username;
  writeState(state, configDir);
}

export function getSyncToken(configDir?: string): string | null {
  return readState(configDir).sync_token;
}

export function setSyncToken(token: string, profileId: string, configDir?: string): void {
  const state = readState(configDir);
  state.sync_token = token;
  state.profile_id = profileId;
  writeState(state, configDir);
}

export function clearState(configDir?: string): void {
  const state = readState(configDir);
  const fresh = defaultState();
  // Preserve sync_token and profile_id — logout shouldn't destroy the anonymous profile
  fresh.sync_token = state.sync_token;
  fresh.profile_id = state.profile_id;
  fresh.machine_id = state.machine_id;
  writeState(fresh, configDir);
}

export function fullClearState(configDir?: string): void {
  writeState(defaultState(), configDir);
}
