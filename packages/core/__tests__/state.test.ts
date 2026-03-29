import { chmodSync, existsSync, readFileSync, statSync } from 'node:fs';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  addSyncedSession,
  clearState,
  fullClearState,
  isSessionSynced,
  readState,
  setSyncToken,
  writeState,
} from '../src/state.js';

let tempDir: string;

beforeEach(() => {
  tempDir = join(tmpdir(), `ccwrapped-state-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('readState', () => {
  it('returns default state when file does not exist', () => {
    const state = readState(tempDir);
    expect(state.synced_sessions).toEqual([]);
    expect(state.last_sync).toBeNull();
    expect(state.username).toBeNull();
    expect(state.sync_token).toBeNull();
    expect(state.machine_id).toMatch(/^[0-9a-f]{12}$/);
  });

  it('returns default state when file is corrupt', () => {
    const { writeFileSync, mkdirSync } = require('node:fs');
    mkdirSync(tempDir, { recursive: true });
    writeFileSync(join(tempDir, 'state.json'), 'not json');
    const state = readState(tempDir);
    expect(state.synced_sessions).toEqual([]);
  });

  it('reads existing state file', () => {
    const existing = {
      synced_sessions: ['sess-1'],
      last_sync: '2026-03-27T10:00:00Z',
      username: 'testuser',
      machine_id: 'abc123def456',
      sync_token: null,
      profile_id: null,
    };
    writeState(existing, tempDir);
    const state = readState(tempDir);
    expect(state).toEqual(existing);
  });
});

describe('writeState', () => {
  it('creates config directory if missing', () => {
    const state = readState(tempDir);
    const ok = writeState(state, tempDir);
    expect(ok).toBe(true);
    expect(existsSync(join(tempDir, 'state.json'))).toBe(true);
  });

  it('sets chmod 0600 on state file', () => {
    writeState(readState(tempDir), tempDir);
    const stats = statSync(join(tempDir, 'state.json'));
    // 0o600 = 384 decimal; mask off file type bits
    expect(stats.mode & 0o777).toBe(0o600);
  });

  it('writes valid JSON', () => {
    const state = readState(tempDir);
    state.auth_token = 'gho_test123';
    writeState(state, tempDir);
    const raw = readFileSync(join(tempDir, 'state.json'), 'utf-8');
    expect(() => JSON.parse(raw)).not.toThrow();
    expect(JSON.parse(raw).auth_token).toBe('gho_test123');
  });
});

describe('addSyncedSession', () => {
  it('adds a session to the list', () => {
    addSyncedSession('sess-1', tempDir);
    expect(isSessionSynced('sess-1', tempDir)).toBe(true);
    expect(isSessionSynced('sess-2', tempDir)).toBe(false);
  });

  it('does not duplicate sessions', () => {
    addSyncedSession('sess-1', tempDir);
    addSyncedSession('sess-1', tempDir);
    const state = readState(tempDir);
    expect(state.synced_sessions.filter((s) => s === 'sess-1')).toHaveLength(1);
  });

  it('updates last_sync timestamp', () => {
    addSyncedSession('sess-1', tempDir);
    const state = readState(tempDir);
    expect(state.last_sync).not.toBeNull();
    expect(new Date(state.last_sync!).getTime()).toBeGreaterThan(0);
  });

  it('applies FIFO eviction when over cap', () => {
    // Add 505 sessions
    for (let i = 0; i < 505; i++) {
      addSyncedSession(`sess-${i}`, tempDir);
    }
    const state = readState(tempDir);
    expect(state.synced_sessions).toHaveLength(500);
    // Oldest 5 should be evicted
    expect(state.synced_sessions.includes('sess-0')).toBe(false);
    expect(state.synced_sessions.includes('sess-4')).toBe(false);
    // Latest should remain
    expect(state.synced_sessions.includes('sess-504')).toBe(true);
  });
});

describe('sync token and clear', () => {
  it('clearState resets sessions but preserves sync_token', () => {
    addSyncedSession('sess-1', tempDir);
    setSyncToken('my-sync-token', 'abc123', tempDir);
    clearState(tempDir);
    const state = readState(tempDir);
    expect(state.synced_sessions).toEqual([]);
    expect(state.sync_token).toBe('my-sync-token');
    expect(state.profile_id).toBe('abc123');
  });

  it('fullClearState wipes everything including sync_token', () => {
    setSyncToken('my-sync-token', 'abc123', tempDir);
    fullClearState(tempDir);
    const state = readState(tempDir);
    expect(state.sync_token).toBeNull();
    expect(state.profile_id).toBeNull();
  });
});
