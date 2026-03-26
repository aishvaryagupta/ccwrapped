import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatCost, formatTokens, padRight } from '../src/ui.js';

describe('ui helpers', () => {
  it('formatTokens formats millions', () => {
    expect(formatTokens(2_400_000)).toBe('2.4M');
  });

  it('formatTokens formats thousands', () => {
    expect(formatTokens(145_200)).toBe('145.2K');
  });

  it('formatTokens formats small numbers', () => {
    expect(formatTokens(42)).toBe('42');
  });

  it('formatCost formats to 2 decimals', () => {
    expect(formatCost(8.5)).toBe('$8.50');
    expect(formatCost(0)).toBe('$0.00');
  });

  it('padRight pads correctly', () => {
    expect(padRight('hi', 5)).toBe('hi   ');
    expect(padRight('hello', 3)).toBe('hello');
  });
});

describe('default command', () => {
  const tempDir = join(tmpdir(), `devwrapped-cli-test-${Date.now()}`);
  const projectDir = join(tempDir, 'projects', 'test-project');

  beforeEach(() => {
    mkdirSync(projectDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('scanAllFiles finds entries from temp directory', async () => {
    writeFileSync(
      join(projectDir, 'session.jsonl'),
      JSON.stringify({
        type: 'assistant',
        timestamp: '2026-03-27T10:00:00.000Z',
        sessionId: 'sess-1',
        requestId: 'req-1',
        message: {
          id: 'msg-1',
          model: 'claude-sonnet-4-20250514',
          usage: { input_tokens: 500, output_tokens: 200 },
        },
      }),
    );

    const { scanAllFiles, buildSyncPayload, buildMachineId } = await import('@devwrapped/core');
    const entries = await scanAllFiles({ claudePaths: [tempDir] });
    expect(entries).toHaveLength(1);

    const payload = buildSyncPayload(entries, buildMachineId(), '0.1.0');
    expect(payload.days).toHaveLength(1);
    expect(payload.days[0].inputTokens).toBe(500);
  });
});

describe('status command', () => {
  const tempDir = join(tmpdir(), `devwrapped-status-test-${Date.now()}`);

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('readState returns defaults for missing config', async () => {
    const { readState } = await import('@devwrapped/core');
    const state = readState(tempDir);
    expect(state.auth_token).toBeNull();
    expect(state.synced_sessions).toEqual([]);
  });

  it('readState reflects setAuthToken', async () => {
    const { readState, setAuthToken } = await import('@devwrapped/core');
    setAuthToken('gho_test', 'testuser', tempDir);
    const state = readState(tempDir);
    expect(state.auth_token).toBe('gho_test');
    expect(state.github_login).toBe('testuser');
  });
});
