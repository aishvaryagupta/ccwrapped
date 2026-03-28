import { describe, expect, it } from 'vitest';
import { validateSyncPayload } from '../lib/validation.js';

const validPayload = {
  schema_version: 1,
  client_version: '0.1.0',
  machine_id: 'test123',
  days: [
    {
      date: '2026-03-25',
      inputTokens: 100,
      outputTokens: 50,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      costUSD: 1.5,
      sessionCount: 1,
      projectCount: 1,
      modelBreakdowns: [],
    },
  ],
};

describe('validateSyncPayload', () => {
  it('accepts a valid payload', () => {
    const result = validateSyncPayload(validPayload);
    expect(result.valid).toBe(true);
  });

  it('rejects invalid schema', () => {
    const result = validateSyncPayload({ invalid: true });
    expect(result.valid).toBe(false);
  });

  it('rejects wrong schema_version', () => {
    const result = validateSyncPayload({ ...validPayload, schema_version: 99 });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('schema version');
    }
  });

  it('rejects too many days', () => {
    const days = Array.from({ length: 31 }, (_, i) => ({
      ...validPayload.days[0],
      date: `2026-01-${String(i + 1).padStart(2, '0')}`,
    }));
    const result = validateSyncPayload({ ...validPayload, days });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('Too many days');
    }
  });

  it('rejects day with tokens exceeding 500M', () => {
    const result = validateSyncPayload({
      ...validPayload,
      days: [{ ...validPayload.days[0], inputTokens: 501_000_000 }],
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('tokens exceeds');
    }
  });

  it('rejects day with cost > $500', () => {
    const result = validateSyncPayload({
      ...validPayload,
      days: [{ ...validPayload.days[0], costUSD: 550 }],
    });
    expect(result.valid).toBe(false);
  });

  it('rejects day with cost < $0', () => {
    const result = validateSyncPayload({
      ...validPayload,
      days: [{ ...validPayload.days[0], costUSD: -1 }],
    });
    expect(result.valid).toBe(false);
  });

  it('accepts empty days array', () => {
    const result = validateSyncPayload({ ...validPayload, days: [] });
    expect(result.valid).toBe(true);
  });

  it('accepts 30 days exactly', () => {
    const days = Array.from({ length: 30 }, (_, i) => ({
      ...validPayload.days[0],
      date: `2026-01-${String(i + 1).padStart(2, '0')}`,
    }));
    const result = validateSyncPayload({ ...validPayload, days });
    expect(result.valid).toBe(true);
  });
});
