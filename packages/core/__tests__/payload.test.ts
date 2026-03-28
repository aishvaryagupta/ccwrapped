import { describe, expect, it } from 'vitest';
import type { DailyDate, ParsedEntry } from '../src/types.js';
import {
  buildMachineId,
  buildSyncPayload,
  calculateEntryCost,
  filterDaysForSync,
} from '../src/payload.js';

// ---------------------------------------------------------------------------
// Helper to create ParsedEntry
// ---------------------------------------------------------------------------

function makeEntry(overrides: Partial<ParsedEntry> = {}): ParsedEntry {
  return {
    timestamp: new Date('2026-03-25T10:00:00.000Z'),
    date: '2026-03-25' as DailyDate,
    sessionId: 'session-1',
    projectId: 'project-a',
    model: 'claude-sonnet-4-20250514',
    usage: {
      inputTokens: 100,
      outputTokens: 50,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 0,
    },
    dedupeKey: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// calculateEntryCost
// ---------------------------------------------------------------------------

describe('calculateEntryCost', () => {
  it('calculates cost for sonnet model', () => {
    const entry = makeEntry({
      usage: {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
        cacheCreationInputTokens: 0,
        cacheReadInputTokens: 0,
      },
    });
    // Sonnet: input $3/M + output $15/M = $18
    expect(calculateEntryCost(entry)).toBeCloseTo(18, 2);
  });

  it('calculates cost for opus model', () => {
    const entry = makeEntry({
      model: 'claude-opus-4-6',
      usage: {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
        cacheCreationInputTokens: 0,
        cacheReadInputTokens: 0,
      },
    });
    // Opus 4.6: input $5/M + output $25/M = $30
    expect(calculateEntryCost(entry)).toBeCloseTo(30, 2);
  });

  it('includes cache token costs', () => {
    const entry = makeEntry({
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationInputTokens: 1_000_000,
        cacheReadInputTokens: 1_000_000,
      },
    });
    // Sonnet: cacheCreation $3.75/M + cacheRead $0.30/M = $4.05
    expect(calculateEntryCost(entry)).toBeCloseTo(4.05, 2);
  });

  it('returns 0 for null model', () => {
    const entry = makeEntry({ model: null });
    expect(calculateEntryCost(entry)).toBe(0);
  });

  it('uses default pricing for unknown model', () => {
    const entry = makeEntry({
      model: 'claude-unknown-99',
      usage: {
        inputTokens: 1_000_000,
        outputTokens: 0,
        cacheCreationInputTokens: 0,
        cacheReadInputTokens: 0,
      },
    });
    // Falls back to sonnet pricing: $3/M
    expect(calculateEntryCost(entry)).toBeCloseTo(3, 2);
  });
});

// ---------------------------------------------------------------------------
// buildSyncPayload
// ---------------------------------------------------------------------------

describe('buildSyncPayload', () => {
  it('groups entries by date and produces correct DaySummary', () => {
    const entries = [
      makeEntry({ date: '2026-03-25' as DailyDate }),
      makeEntry({
        date: '2026-03-25' as DailyDate,
        usage: {
          inputTokens: 200,
          outputTokens: 80,
          cacheCreationInputTokens: 0,
          cacheReadInputTokens: 0,
        },
      }),
      makeEntry({ date: '2026-03-26' as DailyDate }),
    ];

    const payload = buildSyncPayload(entries, 'machine-1', '0.1.0');

    expect(payload.days).toHaveLength(2);
    expect(payload.days[0].date).toBe('2026-03-25');
    expect(payload.days[0].inputTokens).toBe(300); // 100 + 200
    expect(payload.days[0].outputTokens).toBe(130); // 50 + 80
    expect(payload.days[1].date).toBe('2026-03-26');
    expect(payload.days[1].inputTokens).toBe(100);
  });

  it('aggregates model breakdowns correctly', () => {
    const entries = [
      makeEntry({ model: 'claude-opus-4-6' }),
      makeEntry({ model: 'claude-opus-4-6' }),
      makeEntry({ model: 'claude-sonnet-4-20250514' }),
    ];

    const payload = buildSyncPayload(entries, 'machine-1', '0.1.0');
    const breakdowns = payload.days[0].modelBreakdowns;

    expect(breakdowns).toHaveLength(2);

    const opus = breakdowns.find((b) => b.modelName === 'claude-opus-4-6');
    const sonnet = breakdowns.find(
      (b) => b.modelName === 'claude-sonnet-4-20250514',
    );

    expect(opus).toBeDefined();
    expect(opus!.inputTokens).toBe(200); // 100 + 100
    expect(sonnet).toBeDefined();
    expect(sonnet!.inputTokens).toBe(100);
  });

  it('counts unique sessions per day', () => {
    const entries = [
      makeEntry({ sessionId: 'sess-a' }),
      makeEntry({ sessionId: 'sess-a' }),
      makeEntry({ sessionId: 'sess-b' }),
    ];

    const payload = buildSyncPayload(entries, 'machine-1', '0.1.0');
    expect(payload.days[0].sessionCount).toBe(2);
  });

  it('counts unique projects per day', () => {
    const entries = [
      makeEntry({ projectId: 'proj-a' }),
      makeEntry({ projectId: 'proj-a' }),
      makeEntry({ projectId: 'proj-b' }),
    ];

    const payload = buildSyncPayload(entries, 'machine-1', '0.1.0');
    expect(payload.days[0].projectCount).toBe(2);
  });

  it('handles entries with null sessionId', () => {
    const entries = [
      makeEntry({ sessionId: 'sess-a' }),
      makeEntry({ sessionId: null }),
      makeEntry({ sessionId: null }),
    ];

    const payload = buildSyncPayload(entries, 'machine-1', '0.1.0');
    // sess-a (1 known) + 2 unknown = 3
    expect(payload.days[0].sessionCount).toBe(3);
  });

  it('excludes null model from breakdowns but includes in totals', () => {
    const entries = [
      makeEntry({ model: null }),
      makeEntry({ model: 'claude-sonnet-4-20250514' }),
    ];

    const payload = buildSyncPayload(entries, 'machine-1', '0.1.0');
    expect(payload.days[0].inputTokens).toBe(200); // both entries counted
    expect(payload.days[0].modelBreakdowns).toHaveLength(1); // only sonnet
  });

  it('produces empty days array for empty input', () => {
    const payload = buildSyncPayload([], 'machine-1', '0.1.0');
    expect(payload.days).toHaveLength(0);
    expect(payload.schema_version).toBe(2);
    expect(payload.client_version).toBe('0.1.0');
    expect(payload.machine_id).toBe('machine-1');
  });

  it('sorts days in ascending date order', () => {
    const entries = [
      makeEntry({ date: '2026-03-27' as DailyDate }),
      makeEntry({ date: '2026-03-25' as DailyDate }),
      makeEntry({ date: '2026-03-26' as DailyDate }),
    ];

    const payload = buildSyncPayload(entries, 'machine-1', '0.1.0');
    expect(payload.days.map((d) => d.date)).toEqual([
      '2026-03-25',
      '2026-03-26',
      '2026-03-27',
    ]);
  });

  it('calculates costUSD correctly', () => {
    const entries = [
      makeEntry({
        model: 'claude-sonnet-4-20250514',
        usage: {
          inputTokens: 1_000_000,
          outputTokens: 0,
          cacheCreationInputTokens: 0,
          cacheReadInputTokens: 0,
        },
      }),
    ];

    const payload = buildSyncPayload(entries, 'machine-1', '0.1.0');
    // Sonnet input: $3/M × 1M = $3
    expect(payload.days[0].costUSD).toBeCloseTo(3, 2);
  });

  it('handles a single entry (minimal case)', () => {
    const entries = [makeEntry()];
    const payload = buildSyncPayload(entries, 'machine-1', '0.1.0');

    expect(payload.days).toHaveLength(1);
    expect(payload.days[0].sessionCount).toBe(1);
    expect(payload.days[0].projectCount).toBe(1);
    expect(payload.days[0].modelBreakdowns).toHaveLength(1);
  });

  it('sorts model breakdowns by total tokens descending', () => {
    const entries = [
      makeEntry({
        model: 'claude-haiku-4-5-20251001',
        usage: {
          inputTokens: 10,
          outputTokens: 5,
          cacheCreationInputTokens: 0,
          cacheReadInputTokens: 0,
        },
      }),
      makeEntry({
        model: 'claude-opus-4-6',
        usage: {
          inputTokens: 10000,
          outputTokens: 5000,
          cacheCreationInputTokens: 0,
          cacheReadInputTokens: 0,
        },
      }),
    ];

    const payload = buildSyncPayload(entries, 'machine-1', '0.1.0');
    expect(payload.days[0].modelBreakdowns[0].modelName).toBe(
      'claude-opus-4-6',
    );
  });
});

// ---------------------------------------------------------------------------
// buildMachineId
// ---------------------------------------------------------------------------

describe('buildMachineId', () => {
  it('returns a 12-character hex string', () => {
    const id = buildMachineId();
    expect(id).toHaveLength(12);
    expect(id).toMatch(/^[0-9a-f]{12}$/);
  });

  it('returns deterministic output', () => {
    expect(buildMachineId()).toBe(buildMachineId());
  });
});

// ---------------------------------------------------------------------------
// filterDaysForSync
// ---------------------------------------------------------------------------

describe('filterDaysForSync', () => {
  const basePayload = {
    schema_version: 1,
    client_version: '0.1.0',
    machine_id: 'test',
  };

  it('removes days exceeding MAX_TOTAL_TOKENS_PER_DAY', () => {
    const result = filterDaysForSync({
      ...basePayload,
      days: [
        {
          date: '2026-03-25',
          inputTokens: 501_000_000,
          outputTokens: 0,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          costUSD: 10,
          sessionCount: 1,
          projectCount: 1,
          modelBreakdowns: [],
        },
      ],
    });

    expect(result.payload.days).toHaveLength(0);
    expect(result.filtered).toHaveLength(1);
    expect(result.filtered[0].reason).toContain('total tokens');
  });

  it('removes days with costUSD > 50', () => {
    const result = filterDaysForSync({
      ...basePayload,
      days: [
        {
          date: '2026-03-25',
          inputTokens: 100,
          outputTokens: 50,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          costUSD: 550,
          sessionCount: 1,
          projectCount: 1,
          modelBreakdowns: [],
        },
      ],
    });

    expect(result.payload.days).toHaveLength(0);
    expect(result.filtered[0].reason).toContain('cost');
  });

  it('removes days with costUSD < 0', () => {
    const result = filterDaysForSync({
      ...basePayload,
      days: [
        {
          date: '2026-03-25',
          inputTokens: 100,
          outputTokens: 50,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          costUSD: -1,
          sessionCount: 1,
          projectCount: 1,
          modelBreakdowns: [],
        },
      ],
    });

    expect(result.payload.days).toHaveLength(0);
  });

  it('limits to MAX_BACKFILL_DAYS most recent days', () => {
    const days = Array.from({ length: 35 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, '0')}`,
      inputTokens: 100,
      outputTokens: 50,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      costUSD: 1,
      sessionCount: 1,
      projectCount: 1,
      modelBreakdowns: [],
    }));

    const result = filterDaysForSync({ ...basePayload, days });

    expect(result.payload.days).toHaveLength(30);
    // Should keep the most recent 30, dropping the first 5
    expect(result.payload.days[0].date).toBe('2026-01-06');
    expect(result.filtered).toHaveLength(5);
  });

  it('returns unmodified payload when all days valid', () => {
    const days = [
      {
        date: '2026-03-25',
        inputTokens: 100,
        outputTokens: 50,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        costUSD: 5,
        sessionCount: 1,
        projectCount: 1,
        modelBreakdowns: [],
      },
    ];

    const result = filterDaysForSync({ ...basePayload, days });

    expect(result.payload.days).toHaveLength(1);
    expect(result.filtered).toHaveLength(0);
  });
});
