import { homedir } from 'node:os';
import { join } from 'node:path';

// Claude Code log locations
export const CLAUDE_CONFIG_DIR_ENV = 'CLAUDE_CONFIG_DIR';
export const CLAUDE_PROJECTS_DIR = 'projects';
export const JSONL_GLOB = '**/*.jsonl';

// Default config paths (resolved from home directory)
export const DEFAULT_CONFIG_PATHS = [
  join(homedir(), '.config', 'claude'),
  join(homedir(), '.claude'),
];

// Sanity caps (server-side validation mirrors these)
export const MAX_TOTAL_TOKENS_PER_DAY = 15_000_000;
export const MAX_COST_USD_PER_DAY = 50;
export const MIN_COST_USD_PER_DAY = 0;
export const MAX_BACKFILL_DAYS = 30;

// Payload
export const SCHEMA_VERSION = 2;
export const CLIENT_VERSION = '0.1.0';

// ccwrapped state
export const CONFIG_DIR_NAME = 'ccwrapped';
export const STATE_FILE_NAME = 'state.json';
export const MAX_SYNCED_SESSIONS = 500;

// API
export const API_BASE_URL = 'https://ccwrapped.dev/api';
export const GOOGLE_CLIENT_ID = '266471192159-3nbjppkhkee2v6eur6vibribf7hhst0v.apps.googleusercontent.com';
export const GOOGLE_CLIENT_SECRET = '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';
export const HTTP_TIMEOUT_MS = 5000;

// Username validation
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;

// Model pricing (USD per million tokens) — v0.1 hardcoded
export interface ModelPricing {
  input: number;
  output: number;
  cacheCreation: number;
  cacheRead: number;
}

// Ordered longest-prefix-first so the most specific match wins
const MODEL_PRICING_TABLE: Array<[string, ModelPricing]> = [
  // Opus 4.6 (latest)
  ['claude-opus-4-6', { input: 5, output: 25, cacheCreation: 6.25, cacheRead: 0.5 }],
  // Opus 4.5
  ['claude-opus-4-5', { input: 5, output: 25, cacheCreation: 6.25, cacheRead: 0.5 }],
  // Opus (fallback for future opus-4-* variants)
  ['claude-opus-4', { input: 5, output: 25, cacheCreation: 6.25, cacheRead: 0.5 }],
  // Sonnet 4.6
  ['claude-sonnet-4-6', { input: 3, output: 15, cacheCreation: 3.75, cacheRead: 0.3 }],
  // Sonnet 4.5
  ['claude-sonnet-4-5', { input: 3, output: 15, cacheCreation: 3.75, cacheRead: 0.3 }],
  // Sonnet (fallback)
  ['claude-sonnet-4', { input: 3, output: 15, cacheCreation: 3.75, cacheRead: 0.3 }],
  // Haiku 4.5
  ['claude-haiku-4-5', { input: 1, output: 5, cacheCreation: 1.25, cacheRead: 0.1 }],
  // Haiku (fallback)
  ['claude-haiku-4', { input: 1, output: 5, cacheCreation: 1.25, cacheRead: 0.1 }],
];

export const DEFAULT_PRICING: ModelPricing = {
  input: 3, output: 15, cacheCreation: 3.75, cacheRead: 0.3,
};

/**
 * Match a full model name (e.g. "claude-opus-4-6") to its pricing
 * using longest-prefix-first matching.
 */
export function getModelPricing(modelName: string): ModelPricing {
  for (const [prefix, pricing] of MODEL_PRICING_TABLE) {
    if (modelName.startsWith(prefix)) {
      return pricing;
    }
  }
  return DEFAULT_PRICING;
}
