// Constants
export {
  API_BASE_URL,
  CLIENT_VERSION,
  DEFAULT_CONFIG_PATHS,
  DEFAULT_PRICING,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
  MAX_BACKFILL_DAYS,
  MAX_COST_USD_PER_DAY,
  MAX_TOTAL_TOKENS_PER_DAY,
  MIN_COST_USD_PER_DAY,
  SCHEMA_VERSION,
  getModelPricing,
} from './consts.js';
export type { ModelPricing } from './consts.js';

// Types & schemas
export type {
  DailyDate,
  DaySummary,
  CcwrappedState,
  HookInput,
  HttpResult,
  ModelBreakdown,
  ModelName,
  ParsedEntry,
  ScanOptions,
  SessionId,
  SyncMetadata,
  SyncPayload,
  UsageEntry,
} from './types.js';
export {
  DailyDateSchema,
  DaySummarySchema,
  ModelBreakdownSchema,
  ModelNameSchema,
  SessionIdSchema,
  SyncPayloadSchema,
  UsageEntrySchema,
} from './types.js';

// Parser
export {
  extractProjectFromPath,
  getClaudePaths,
  parseTranscriptFile,
  scanAllFiles,
} from './parser.js';

// Payload
export type { FilterResult } from './payload.js';
export {
  buildMachineId,
  buildSyncPayload,
  calculateEntryCost,
  filterDaysForSync,
} from './payload.js';

// State
export {
  addSyncedSession,
  clearState,
  fullClearState,
  getConfigDir,
  getSyncToken,
  isSessionSynced,
  readState,
  setSyncToken,
  setUsername,
  writeState,
} from './state.js';

// HTTP
export { claimUsername, fetchSyncMetadata, postSyncPayload } from './http.js';
export type { SyncAuth, SyncResponse } from './http.js';

// Username
export { validateUsername } from './username.js';

// Pricing
export { calculateLiveCost, fetchLivePricing, resetPricingCache } from './pricing.js';
export type { LiveModelPricing } from './pricing.js';

// Claude Code settings
export {
  getClaudeSettingsPath,
  isCcwrappedHookInstalled,
  installCcwrappedHook,
  uninstallCcwrappedHook,
} from './claude-settings.js';

// Formatting
export { formatCost, formatTokens } from './format.js';
