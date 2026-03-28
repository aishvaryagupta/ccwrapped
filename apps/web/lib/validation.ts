import { safeParse } from 'valibot';
import {
  MAX_BACKFILL_DAYS,
  MAX_COST_USD_PER_DAY,
  MAX_TOTAL_TOKENS_PER_DAY,
  MIN_COST_USD_PER_DAY,
  SyncPayloadSchema,
  type SyncPayload,
} from '@ccwrapped/core';

type ValidationResult =
  | { valid: true; payload: SyncPayload }
  | { valid: false; error: string };

export function validateSyncPayload(body: unknown): ValidationResult {
  const result = safeParse(SyncPayloadSchema, body);
  if (!result.success) {
    return { valid: false, error: 'Invalid payload schema' };
  }

  const payload = result.output;

  const SUPPORTED_VERSIONS = [1, 2];
  if (!SUPPORTED_VERSIONS.includes(payload.schema_version)) {
    return { valid: false, error: `Unsupported schema version: ${payload.schema_version}` };
  }

  if (payload.days.length > MAX_BACKFILL_DAYS) {
    return { valid: false, error: `Too many days: ${payload.days.length} (max ${MAX_BACKFILL_DAYS})` };
  }

  for (const day of payload.days) {
    const totalTokens =
      day.inputTokens + day.outputTokens + day.cacheCreationTokens + day.cacheReadTokens;

    if (totalTokens > MAX_TOTAL_TOKENS_PER_DAY) {
      return {
        valid: false,
        error: `Day ${day.date}: ${totalTokens} tokens exceeds ${MAX_TOTAL_TOKENS_PER_DAY} cap`,
      };
    }

    if (day.costUSD > MAX_COST_USD_PER_DAY) {
      return {
        valid: false,
        error: `Day ${day.date}: cost $${day.costUSD} exceeds $${MAX_COST_USD_PER_DAY} cap`,
      };
    }

    if (day.costUSD < MIN_COST_USD_PER_DAY) {
      return {
        valid: false,
        error: `Day ${day.date}: cost $${day.costUSD} below $${MIN_COST_USD_PER_DAY} minimum`,
      };
    }
  }

  return { valid: true, payload };
}
