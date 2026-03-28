import { createHash } from 'node:crypto';
import { hostname } from 'node:os';
import { parse } from 'valibot';
import {
  MAX_BACKFILL_DAYS,
  MAX_COST_USD_PER_DAY,
  MAX_TOTAL_TOKENS_PER_DAY,
  MIN_COST_USD_PER_DAY,
  SCHEMA_VERSION,
  getModelPricing,
} from './consts.js';
import { type LiveModelPricing, calculateLiveCost } from './pricing.js';
import {
  type DaySummary,
  type ModelBreakdown,
  type ParsedEntry,
  type SyncPayload,
  SyncPayloadSchema,
} from './types.js';

// ---------------------------------------------------------------------------
// Cost calculation
// ---------------------------------------------------------------------------

export function calculateEntryCost(
  entry: ParsedEntry,
  livePricing?: Map<string, LiveModelPricing>,
): number {
  if (!entry.model) return 0;

  const { inputTokens, outputTokens, cacheCreationInputTokens, cacheReadInputTokens } =
    entry.usage;

  if (livePricing) {
    const cost = calculateLiveCost(
      entry.model,
      inputTokens,
      outputTokens,
      cacheCreationInputTokens,
      cacheReadInputTokens,
      livePricing,
    );
    if (cost != null) return cost;
  }

  // Fallback to hardcoded pricing
  const pricing = getModelPricing(entry.model);
  return (
    (inputTokens * pricing.input) / 1_000_000 +
    (outputTokens * pricing.output) / 1_000_000 +
    (cacheCreationInputTokens * pricing.cacheCreation) / 1_000_000 +
    (cacheReadInputTokens * pricing.cacheRead) / 1_000_000
  );
}

// ---------------------------------------------------------------------------
// Machine ID
// ---------------------------------------------------------------------------

export function buildMachineId(): string {
  return createHash('sha256').update(hostname()).digest('hex').slice(0, 12);
}

// ---------------------------------------------------------------------------
// Payload builder
// ---------------------------------------------------------------------------

export function buildSyncPayload(
  entries: ParsedEntry[],
  machineId: string,
  clientVersion: string,
  livePricing?: Map<string, LiveModelPricing>,
): SyncPayload {
  // Group entries by date
  const byDate = new Map<string, ParsedEntry[]>();
  for (const entry of entries) {
    const existing = byDate.get(entry.date);
    if (existing) {
      existing.push(entry);
    } else {
      byDate.set(entry.date, [entry]);
    }
  }

  // Build day summaries
  const days: DaySummary[] = [];

  for (const [date, dayEntries] of byDate) {
    let inputTokens = 0;
    let outputTokens = 0;
    let cacheCreationTokens = 0;
    let cacheReadTokens = 0;
    let costUSD = 0;

    const sessions = new Set<string>();
    let unknownSessionCount = 0;
    const projects = new Set<string>();
    const modelAgg = new Map<
      string,
      { input: number; output: number; cacheCreation: number; cacheRead: number }
    >();
    const dayToolCounts = new Map<string, number>();
    const dayFiles = new Set<string>();
    let dayLinesWritten = 0;

    for (const entry of dayEntries) {
      inputTokens += entry.usage.inputTokens;
      outputTokens += entry.usage.outputTokens;
      cacheCreationTokens += entry.usage.cacheCreationInputTokens;
      cacheReadTokens += entry.usage.cacheReadInputTokens;
      costUSD += calculateEntryCost(entry, livePricing);

      if (entry.sessionId) {
        sessions.add(entry.sessionId);
      } else {
        unknownSessionCount++;
      }

      projects.add(entry.projectId);

      if (entry.model) {
        const existing = modelAgg.get(entry.model);
        if (existing) {
          existing.input += entry.usage.inputTokens;
          existing.output += entry.usage.outputTokens;
          existing.cacheCreation += entry.usage.cacheCreationInputTokens;
          existing.cacheRead += entry.usage.cacheReadInputTokens;
        } else {
          modelAgg.set(entry.model, {
            input: entry.usage.inputTokens,
            output: entry.usage.outputTokens,
            cacheCreation: entry.usage.cacheCreationInputTokens,
            cacheRead: entry.usage.cacheReadInputTokens,
          });
        }
      }

      if (entry.toolCounts) {
        for (const [tool, count] of Object.entries(entry.toolCounts)) {
          dayToolCounts.set(tool, (dayToolCounts.get(tool) ?? 0) + count);
        }
      }
      if (entry.filesTouched) {
        for (const fp of entry.filesTouched) dayFiles.add(fp);
      }
      if (entry.linesWritten != null) {
        dayLinesWritten += entry.linesWritten;
      }
    }

    // Build model breakdowns sorted by total tokens descending
    const modelBreakdowns: ModelBreakdown[] = [...modelAgg.entries()]
      .map(([modelName, agg]) => ({
        modelName,
        inputTokens: agg.input,
        outputTokens: agg.output,
        cacheCreationTokens: agg.cacheCreation,
        cacheReadTokens: agg.cacheRead,
      }))
      .sort(
        (a, b) =>
          b.inputTokens +
          b.outputTokens +
          b.cacheCreationTokens +
          b.cacheReadTokens -
          (a.inputTokens +
            a.outputTokens +
            a.cacheCreationTokens +
            a.cacheReadTokens),
      );

    days.push({
      date,
      inputTokens,
      outputTokens,
      cacheCreationTokens,
      cacheReadTokens,
      costUSD: Math.round(costUSD * 10000) / 10000,
      sessionCount: sessions.size + unknownSessionCount,
      projectCount: projects.size,
      modelBreakdowns,
      ...(dayToolCounts.size > 0 && {
        toolCounts: [...dayToolCounts.entries()]
          .map(([toolName, count]) => ({ toolName, count }))
          .sort((a, b) => b.count - a.count),
      }),
      ...(dayFiles.size > 0 && { filesTouched: dayFiles.size }),
      ...(dayLinesWritten > 0 && { linesWritten: dayLinesWritten }),
    });
  }

  // Sort days ascending
  days.sort((a, b) => a.date.localeCompare(b.date));

  const payload: SyncPayload = {
    schema_version: SCHEMA_VERSION,
    client_version: clientVersion,
    machine_id: machineId,
    days,
  };

  // Validate against schema
  return parse(SyncPayloadSchema, payload);
}

// ---------------------------------------------------------------------------
// Sync filter (enforce caps before upload)
// ---------------------------------------------------------------------------

export interface FilterResult {
  payload: SyncPayload;
  filtered: Array<{ date: string; reason: string }>;
}

export function filterDaysForSync(payload: SyncPayload): FilterResult {
  const filtered: Array<{ date: string; reason: string }> = [];

  let validDays = payload.days.filter((day) => {
    const totalTokens =
      day.inputTokens +
      day.outputTokens +
      day.cacheCreationTokens +
      day.cacheReadTokens;

    if (totalTokens > MAX_TOTAL_TOKENS_PER_DAY) {
      filtered.push({
        date: day.date,
        reason: `total tokens ${totalTokens} exceeds cap ${MAX_TOTAL_TOKENS_PER_DAY}`,
      });
      return false;
    }

    if (day.costUSD > MAX_COST_USD_PER_DAY) {
      filtered.push({
        date: day.date,
        reason: `cost $${day.costUSD} exceeds cap $${MAX_COST_USD_PER_DAY}`,
      });
      return false;
    }

    if (day.costUSD < MIN_COST_USD_PER_DAY) {
      filtered.push({
        date: day.date,
        reason: `cost $${day.costUSD} below minimum $${MIN_COST_USD_PER_DAY}`,
      });
      return false;
    }

    return true;
  });

  // Keep only the most recent MAX_BACKFILL_DAYS
  if (validDays.length > MAX_BACKFILL_DAYS) {
    const dropped = validDays.slice(0, validDays.length - MAX_BACKFILL_DAYS);
    for (const day of dropped) {
      filtered.push({
        date: day.date,
        reason: `exceeds ${MAX_BACKFILL_DAYS}-day backfill limit`,
      });
    }
    validDays = validDays.slice(validDays.length - MAX_BACKFILL_DAYS);
  }

  return {
    payload: {
      ...payload,
      days: validDays,
    },
    filtered,
  };
}
