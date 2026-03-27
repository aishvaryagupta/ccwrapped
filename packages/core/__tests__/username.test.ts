import { describe, expect, it } from 'vitest';
import { validateUsername } from '../src/username.js';

describe('validateUsername', () => {
  it('accepts valid usernames', () => {
    expect(validateUsername('alice')).toEqual({ valid: true, normalized: 'alice' });
    expect(validateUsername('bob-123')).toEqual({ valid: true, normalized: 'bob-123' });
    expect(validateUsername('a1b')).toEqual({ valid: true, normalized: 'a1b' });
  });

  it('normalizes to lowercase', () => {
    expect(validateUsername('Alice')).toEqual({ valid: true, normalized: 'alice' });
    expect(validateUsername('BOB')).toEqual({ valid: true, normalized: 'bob' });
  });

  it('trims whitespace', () => {
    expect(validateUsername('  alice  ')).toEqual({ valid: true, normalized: 'alice' });
  });

  it('rejects too short', () => {
    const result = validateUsername('ab');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toContain('at least 3');
  });

  it('rejects too long', () => {
    const result = validateUsername('a'.repeat(31));
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toContain('at most 30');
  });

  it('rejects leading hyphen', () => {
    const result = validateUsername('-alice');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toContain('hyphen');
  });

  it('rejects trailing hyphen', () => {
    const result = validateUsername('alice-');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toContain('hyphen');
  });

  it('rejects special characters', () => {
    expect(validateUsername('alice@bob').valid).toBe(false);
    expect(validateUsername('alice.bob').valid).toBe(false);
    expect(validateUsername('alice bob').valid).toBe(false);
    expect(validateUsername('alice_bob').valid).toBe(false);
  });

  it('rejects reserved usernames', () => {
    const result = validateUsername('admin');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toContain('reserved');

    expect(validateUsername('api').valid).toBe(false);
    expect(validateUsername('leaderboard').valid).toBe(false);
    expect(validateUsername('Admin').valid).toBe(false); // case-insensitive
  });

  it('accepts usernames at boundary lengths', () => {
    expect(validateUsername('abc')).toEqual({ valid: true, normalized: 'abc' });
    expect(validateUsername('a'.repeat(30))).toEqual({ valid: true, normalized: 'a'.repeat(30) });
  });
});
