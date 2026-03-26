// Constants
export {
  API_BASE_URL,
  CLIENT_VERSION,
  DEFAULT_CONFIG_PATHS,
  DEFAULT_PRICING,
  GITHUB_CLIENT_ID,
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
  AuthResult,
  DailyDate,
  DaySummary,
  DeviceCodeResponse,
  DevwrappedState,
  GitHubUser,
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
  getAuthToken,
  getConfigDir,
  isSessionSynced,
  readState,
  setAuthToken,
  writeState,
} from './state.js';

// HTTP
export { fetchSyncMetadata, postSyncPayload } from './http.js';

// Auth
export { fetchGitHubUser, pollForToken, startDeviceFlow } from './auth.js';
