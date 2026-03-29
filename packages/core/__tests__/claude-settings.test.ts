import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  installCcwrappedHook,
  isCcwrappedHookInstalled,
  readClaudeSettings,
  uninstallCcwrappedHook,
  writeClaudeSettings,
} from '../src/claude-settings.js';

let tempFile: string;

beforeEach(() => {
  const dir = join(tmpdir(), `ccwrapped-settings-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  tempFile = join(dir, 'settings.json');
});

afterEach(() => {
  rmSync(dirname(tempFile), { recursive: true, force: true });
});

describe('readClaudeSettings', () => {
  it('returns empty object when file does not exist', () => {
    expect(readClaudeSettings(tempFile)).toEqual({});
  });

  it('returns empty object for malformed JSON', () => {
    writeFileSync(tempFile, 'not json');
    expect(readClaudeSettings(tempFile)).toEqual({});
  });

  it('reads valid settings', () => {
    writeFileSync(tempFile, JSON.stringify({ permissions: { allow: ['Read'] } }));
    const settings = readClaudeSettings(tempFile);
    expect(settings.permissions).toEqual({ allow: ['Read'] });
  });
});

describe('writeClaudeSettings', () => {
  it('writes valid JSON', () => {
    const ok = writeClaudeSettings({ foo: 'bar' }, tempFile);
    expect(ok).toBe(true);
    const raw = readFileSync(tempFile, 'utf-8');
    expect(JSON.parse(raw)).toEqual({ foo: 'bar' });
  });

  it('preserves all keys on roundtrip', () => {
    const original = {
      permissions: { allow: ['Read', 'Edit'] },
      statusLine: true,
      hooks: { PreToolUse: [] },
    };
    writeClaudeSettings(original, tempFile);
    const loaded = readClaudeSettings(tempFile);
    expect(loaded).toEqual(original);
  });
});

describe('installCcwrappedHook', () => {
  it('creates hooks in empty settings', () => {
    const result = installCcwrappedHook(tempFile);
    expect(result).toEqual({ installed: true, alreadyPresent: false });

    const settings = readClaudeSettings(tempFile);
    const hooks = settings.hooks as Record<string, unknown[]>;
    expect(hooks.SessionEnd).toHaveLength(1);
    expect((hooks.SessionEnd[0] as { hooks: { command: string }[] }).hooks[0].command).toContain('ccwrapdev hook-sync');
  });

  it('preserves existing settings keys', () => {
    writeClaudeSettings({ permissions: { allow: ['Bash'] }, statusLine: false }, tempFile);
    installCcwrappedHook(tempFile);

    const settings = readClaudeSettings(tempFile);
    expect(settings.permissions).toEqual({ allow: ['Bash'] });
    expect(settings.statusLine).toBe(false);
    expect(settings.hooks).toBeDefined();
  });

  it('appends to existing SessionEnd hooks', () => {
    const existing = {
      hooks: {
        SessionEnd: [
          { matcher: '', hooks: [{ type: 'command', command: 'echo other-hook' }] },
        ],
      },
    };
    writeClaudeSettings(existing, tempFile);
    installCcwrappedHook(tempFile);

    const settings = readClaudeSettings(tempFile);
    const sessionEnd = (settings.hooks as Record<string, unknown[]>).SessionEnd;
    expect(sessionEnd).toHaveLength(2);
  });

  it('preserves other hook event types', () => {
    const existing = {
      hooks: {
        PreToolUse: [{ matcher: '', hooks: [{ type: 'command', command: 'echo pre' }] }],
      },
    };
    writeClaudeSettings(existing, tempFile);
    installCcwrappedHook(tempFile);

    const settings = readClaudeSettings(tempFile);
    const hooks = settings.hooks as Record<string, unknown[]>;
    expect(hooks.PreToolUse).toHaveLength(1);
    expect(hooks.SessionEnd).toHaveLength(1);
  });

  it('is idempotent — second install returns alreadyPresent', () => {
    installCcwrappedHook(tempFile);
    const result = installCcwrappedHook(tempFile);
    expect(result).toEqual({ installed: false, alreadyPresent: true });

    const settings = readClaudeSettings(tempFile);
    const sessionEnd = (settings.hooks as Record<string, unknown[]>).SessionEnd;
    expect(sessionEnd).toHaveLength(1);
  });
});

describe('isCcwrappedHookInstalled', () => {
  it('returns false for empty settings', () => {
    expect(isCcwrappedHookInstalled(tempFile)).toBe(false);
  });

  it('returns false when no hooks key', () => {
    writeClaudeSettings({ permissions: {} }, tempFile);
    expect(isCcwrappedHookInstalled(tempFile)).toBe(false);
  });

  it('returns true after install', () => {
    installCcwrappedHook(tempFile);
    expect(isCcwrappedHookInstalled(tempFile)).toBe(true);
  });
});

describe('uninstallCcwrappedHook', () => {
  it('returns true when no hooks exist', () => {
    expect(uninstallCcwrappedHook(tempFile)).toBe(true);
  });

  it('removes ccwrapped hook entry', () => {
    installCcwrappedHook(tempFile);
    expect(isCcwrappedHookInstalled(tempFile)).toBe(true);

    const ok = uninstallCcwrappedHook(tempFile);
    expect(ok).toBe(true);
    expect(isCcwrappedHookInstalled(tempFile)).toBe(false);
  });

  it('preserves other SessionEnd hooks', () => {
    const existing = {
      hooks: {
        SessionEnd: [
          { matcher: '', hooks: [{ type: 'command', command: 'echo other-hook' }] },
        ],
      },
    };
    writeClaudeSettings(existing, tempFile);
    installCcwrappedHook(tempFile);
    uninstallCcwrappedHook(tempFile);

    const settings = readClaudeSettings(tempFile);
    const sessionEnd = (settings.hooks as Record<string, unknown[]>).SessionEnd;
    expect(sessionEnd).toHaveLength(1);
    expect((sessionEnd[0] as { hooks: { command: string }[] }).hooks[0].command).toBe('echo other-hook');
  });

  it('preserves other hook event types', () => {
    writeClaudeSettings({
      hooks: {
        PreToolUse: [{ matcher: '', hooks: [{ type: 'command', command: 'echo pre' }] }],
      },
    }, tempFile);
    installCcwrappedHook(tempFile);
    uninstallCcwrappedHook(tempFile);

    const settings = readClaudeSettings(tempFile);
    const hooks = settings.hooks as Record<string, unknown[]>;
    expect(hooks.PreToolUse).toHaveLength(1);
  });
});
