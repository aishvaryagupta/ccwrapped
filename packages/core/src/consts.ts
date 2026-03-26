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
export const SCHEMA_VERSION = 1;
export const CLIENT_VERSION = '0.1.0';

// Model pricing (USD per million tokens) — v0.1 hardcoded
interface ModelPricing {
  input: number;
  output: number;
  cacheCreation: number;
  cacheRead: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'claude-opus-4': {
    input: 15,
    output: 75,
    cacheCreation: 18.75,
    cacheRead: 1.5,
  },
  'claude-sonnet-4': {
    input: 3,
    output: 15,
    cacheCreation: 3.75,
    cacheRead: 0.3,
  },
  'claude-haiku-4': {
    input: 0.8,
    output: 4,
    cacheCreation: 1,
    cacheRead: 0.08,
  },
};

export const DEFAULT_PRICING: ModelPricing = MODEL_PRICING['claude-sonnet-4'];

/**
 * Match a full model name (e.g. "claude-opus-4-6") to its pricing
 * by checking if the model starts with a known prefix.
 */
export function getModelPricing(modelName: string): ModelPricing {
  for (const [prefix, pricing] of Object.entries(MODEL_PRICING)) {
    if (modelName.startsWith(prefix)) {
      return pricing;
    }
  }
  return DEFAULT_PRICING;
}
