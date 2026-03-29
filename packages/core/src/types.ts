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

export const ContentBlockSchema = object({
  type: string(),
  name: optional(string()),
  input: optional(
    object({
      file_path: optional(string()),
      content: optional(string()),
      old_string: optional(string()),
      new_string: optional(string()),
    }),
  ),
});

export const UsageEntrySchema = object({
  sessionId: optional(string()),
  timestamp: pipe(string(), minLength(10)),
  requestId: optional(string()),
  message: object({
    id: optional(string()),
    model: optional(string()),
    content: optional(array(ContentBlockSchema)),
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
  toolCounts: Record<string, number> | null;
  filesTouched: string[] | null;
  linesWritten: number | null;
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

export const ToolCountSchema = object({
  toolName: string(),
  count: pipe(number(), integer(), minValue(0)),
});
export type ToolCount = InferOutput<typeof ToolCountSchema>;

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
  toolCounts: optional(array(ToolCountSchema)),
  filesTouched: optional(pipe(number(), integer(), minValue(0))),
  linesWritten: optional(pipe(number(), integer(), minValue(0))),
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

export interface CcwrappedState {
  synced_sessions: string[];
  last_sync: string | null;
  username: string | null;
  machine_id: string;
  sync_token: string | null;
  profile_id: string | null;
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
