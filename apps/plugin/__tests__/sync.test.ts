import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock core modules before importing sync
const tempDir = join(tmpdir(), `ccwrapped-plugin-test-${Date.now()}`);

// We test the sync logic by importing core functions directly and
// verifying they would be called correctly. The actual sync.ts
// is an entry point that wires these together.

import {
  addSyncedSession,
  buildMachineId,
  buildSyncPayload,
  filterDaysForSync,
  getAuthToken,
  isSessionSynced,
  parseTranscriptFile,
  readState,
  writeState,
} from '@ccwrapped/core';

describe('plugin sync logic', () => {
  const fixtureDir = join(tempDir, 'projects', 'test-project');

  beforeEach(() => {
    mkdirSync(fixtureDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('parses transcript and builds payload', async () => {
    const transcriptPath = join(fixtureDir, 'session.jsonl');
    writeFileSync(
      transcriptPath,
      JSON.stringify({
        type: 'assistant',
        timestamp: '2026-03-27T10:00:00.000Z',
        sessionId: 'sess-test',
        requestId: 'req-1',
        message: {
          id: 'msg-1',
          model: 'claude-sonnet-4-20250514',
          usage: { input_tokens: 100, output_tokens: 50 },
        },
      }),
    );

    const entries = await parseTranscriptFile(transcriptPath);
    expect(entries).toHaveLength(1);

    const payload = buildSyncPayload(entries, 'test-machine', '0.1.0');
    expect(payload.days).toHaveLength(1);
    expect(payload.days[0].inputTokens).toBe(100);
  });

  it('idempotency: isSessionSynced prevents re-processing', () => {
    const stateDir = join(tempDir, 'state');
    mkdirSync(stateDir, { recursive: true });

    expect(isSessionSynced('sess-1', stateDir)).toBe(false);
    addSyncedSession('sess-1', stateDir);
    expect(isSessionSynced('sess-1', stateDir)).toBe(true);
  });

  it('auth check: getAuthToken returns null when not configured', () => {
    const stateDir = join(tempDir, 'state2');
    mkdirSync(stateDir, { recursive: true });
    expect(getAuthToken(stateDir)).toBeNull();
  });

  it('filterDaysForSync passes valid payloads through', () => {
    const payload = buildSyncPayload([], 'machine', '0.1.0');
    const { payload: filtered, filtered: dropped } = filterDaysForSync(payload);
    expect(filtered.days).toHaveLength(0);
    expect(dropped).toHaveLength(0);
  });

  it('handles empty transcript gracefully', async () => {
    const emptyPath = join(fixtureDir, 'empty.jsonl');
    writeFileSync(emptyPath, '');
    const entries = await parseTranscriptFile(emptyPath);
    expect(entries).toHaveLength(0);
  });
});
