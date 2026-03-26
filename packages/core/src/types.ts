import {
  type InferOutput,
  array,
  brand,
  integer,
  minLength,
  minValue,
  number,
  object,
  optional,
  pipe,
  regex,
  string,
} from 'valibot';

// ---------------------------------------------------------------------------
// Branded types
// ---------------------------------------------------------------------------

export const ModelNameSchema = pipe(string(), minLength(1), brand('ModelName'));
export type ModelName = InferOutput<typeof ModelNameSchema>;

export const DailyDateSchema = pipe(
  string(),
  regex(/^\d{4}-\d{2}-\d{2}$/),
  brand('DailyDate'),
);
export type DailyDate = InferOutput<typeof DailyDateSchema>;

export const SessionIdSchema = pipe(
  string(),
  minLength(1),
  brand('SessionId'),
);
export type SessionId = InferOutput<typeof SessionIdSchema>;

// ---------------------------------------------------------------------------
// Raw JSONL entry schema (Claude Code assistant messages with usage)
// ---------------------------------------------------------------------------

export const UsageEntrySchema = object({
  sessionId: optional(string()),
  timestamp: pipe(string(), minLength(10)),
  requestId: optional(string()),
  message: object({
    id: optional(string()),
    model: optional(string()),
    usage: object({
      input_tokens: number(),
      output_tokens: number(),
      cache_creation_input_tokens: optional(number()),
      cache_read_input_tokens: optional(number()),
    }),
  }),
});
export type UsageEntry = InferOutput<typeof UsageEntrySchema>;

// ---------------------------------------------------------------------------
// Internal intermediate type (between parser and payload builder)
// ---------------------------------------------------------------------------

export interface ParsedEntry {
  timestamp: Date;
  date: DailyDate;
  sessionId: string | null;
  projectId: string;
  model: string | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationInputTokens: number;
    cacheReadInputTokens: number;
  };
  dedupeKey: string | null;
}

// ---------------------------------------------------------------------------
// Output types (sync payload sent to API)
// ---------------------------------------------------------------------------

export const ModelBreakdownSchema = object({
  modelName: string(),
  inputTokens: pipe(number(), integer(), minValue(0)),
  outputTokens: pipe(number(), integer(), minValue(0)),
  cacheCreationTokens: pipe(number(), integer(), minValue(0)),
  cacheReadTokens: pipe(number(), integer(), minValue(0)),
});
export type ModelBreakdown = InferOutput<typeof ModelBreakdownSchema>;

export const DaySummarySchema = object({
  date: pipe(string(), regex(/^\d{4}-\d{2}-\d{2}$/)),
  inputTokens: pipe(number(), integer(), minValue(0)),
  outputTokens: pipe(number(), integer(), minValue(0)),
  cacheCreationTokens: pipe(number(), integer(), minValue(0)),
  cacheReadTokens: pipe(number(), integer(), minValue(0)),
  costUSD: number(),
  sessionCount: pipe(number(), integer(), minValue(0)),
  projectCount: pipe(number(), integer(), minValue(0)),
  modelBreakdowns: array(ModelBreakdownSchema),
});
export type DaySummary = InferOutput<typeof DaySummarySchema>;

export const SyncPayloadSchema = object({
  schema_version: pipe(number(), integer()),
  client_version: string(),
  machine_id: string(),
  days: array(DaySummarySchema),
});
export type SyncPayload = InferOutput<typeof SyncPayloadSchema>;

// ---------------------------------------------------------------------------
// Scanner options
// ---------------------------------------------------------------------------

export interface ScanOptions {
  claudePaths?: string[];
  since?: DailyDate;
  until?: DailyDate;
}

// ---------------------------------------------------------------------------
// State management
// ---------------------------------------------------------------------------

export interface DevwrappedState {
  synced_sessions: string[];
  last_sync: string | null;
  auth_token: string | null;
  github_login: string | null;
  machine_id: string;
}

// ---------------------------------------------------------------------------
// Auth types
// ---------------------------------------------------------------------------

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export type AuthResult =
  | { ok: true; token: string; login: string }
  | { ok: false; error: 'expired' | 'denied' | 'network' | 'not_configured' };

export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
}

// ---------------------------------------------------------------------------
// HTTP result types
// ---------------------------------------------------------------------------

export type HttpResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: 'network' | 'auth' | 'server' | 'validation'; message?: string };

export interface SyncMetadata {
  machine_id: string;
  last_sync: string;
  total_tokens: number;
}

// ---------------------------------------------------------------------------
// Hook input (from Claude Code stdin)
// ---------------------------------------------------------------------------

export interface HookInput {
  session_id: string;
  transcript_path: string;
  cwd?: string;
  hook_event_name?: string;
}
