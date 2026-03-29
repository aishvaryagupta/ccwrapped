import {
  existsSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CLAUDE_SETTINGS_DIR = '.claude';
const CLAUDE_SETTINGS_FILE = 'settings.json';
const HOOK_MARKER = 'ccwrapdev hook-sync';

interface HookEntry {
  type: string;
  command: string;
  async?: boolean;
  timeout?: number;
}

interface HookMatcher {
  matcher: string;
  hooks: HookEntry[];
}

type ClaudeSettings = Record<string, unknown>;

export function getClaudeSettingsPath(overridePath?: string): string {
  return overridePath ?? join(homedir(), CLAUDE_SETTINGS_DIR, CLAUDE_SETTINGS_FILE);
}

export function readClaudeSettings(overridePath?: string): ClaudeSettings {
  try {
    const file = getClaudeSettingsPath(overridePath);
    if (!existsSync(file)) return {};
    const raw = readFileSync(file, 'utf-8');
    return JSON.parse(raw) as ClaudeSettings;
  } catch {
    return {};
  }
}

export function writeClaudeSettings(settings: ClaudeSettings, overridePath?: string): boolean {
  try {
    const file = getClaudeSettingsPath(overridePath);
    const tmp = `${file}.tmp`;
    writeFileSync(tmp, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
    renameSync(tmp, file);
    return true;
  } catch {
    return false;
  }
}

function findHookMarker(settings: ClaudeSettings): boolean {
  const hooks = settings.hooks as Record<string, HookMatcher[]> | undefined;
  if (!hooks || typeof hooks !== 'object') return false;

  const sessionEnd = hooks.SessionEnd;
  if (!Array.isArray(sessionEnd)) return false;

  return sessionEnd.some(
    (matcher) =>
      Array.isArray(matcher.hooks) &&
      matcher.hooks.some(
        (h) => typeof h.command === 'string' && h.command.includes(HOOK_MARKER),
      ),
  );
}

export function isCcwrappedHookInstalled(overridePath?: string): boolean {
  const settings = readClaudeSettings(overridePath);
  return findHookMarker(settings);
}

export function installCcwrappedHook(overridePath?: string): { installed: boolean; alreadyPresent: boolean } {
  const settings = readClaudeSettings(overridePath);

  if (findHookMarker(settings)) {
    return { installed: false, alreadyPresent: true };
  }

  const newEntry: HookMatcher = {
    matcher: '',
    hooks: [
      {
        type: 'command',
        command: 'npx ccwrapdev hook-sync',
        async: true,
        timeout: 30,
      },
    ],
  };

  if (!settings.hooks || typeof settings.hooks !== 'object') {
    settings.hooks = {};
  }

  const hooks = settings.hooks as Record<string, HookMatcher[]>;

  if (!Array.isArray(hooks.SessionEnd)) {
    hooks.SessionEnd = [];
  }

  hooks.SessionEnd.push(newEntry);

  const ok = writeClaudeSettings(settings, overridePath);
  return { installed: ok, alreadyPresent: false };
}

export function uninstallCcwrappedHook(overridePath?: string): boolean {
  const settings = readClaudeSettings(overridePath);
  const hooks = settings.hooks as Record<string, HookMatcher[]> | undefined;

  if (!hooks || typeof hooks !== 'object') return true;

  const sessionEnd = hooks.SessionEnd;
  if (!Array.isArray(sessionEnd)) return true;

  hooks.SessionEnd = sessionEnd.filter(
    (matcher) =>
      !Array.isArray(matcher.hooks) ||
      !matcher.hooks.some(
        (h) => typeof h.command === 'string' && h.command.includes(HOOK_MARKER),
      ),
  );

  return writeClaudeSettings(settings, overridePath);
}
