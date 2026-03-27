import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  extractProjectFromPath,
  parseTranscriptFile,
  scanAllFiles,
} from '../src/parser.js';

const FIXTURES = join(import.meta.dirname, 'fixtures');

// ---------------------------------------------------------------------------
// parseTranscriptFile
// ---------------------------------------------------------------------------

describe('parseTranscriptFile', () => {
  it('parses a valid single-session JSONL file', async () => {
    const entries = await parseTranscriptFile(
      join(FIXTURES, 'single-session.jsonl'),
    );

    expect(entries).toHaveLength(2);

    // First assistant entry
    expect(entries[0].usage.inputTokens).toBe(100);
    expect(entries[0].usage.outputTokens).toBe(50);
    expect(entries[0].usage.cacheCreationInputTokens).toBe(5000);
    expect(entries[0].usage.cacheReadInputTokens).toBe(2000);
    expect(entries[0].model).toBe('claude-sonnet-4-20250514');
    expect(entries[0].sessionId).toBe('session-aaa');
    expect(entries[0].date).toBe('2026-03-25');
    expect(entries[0].dedupeKey).toBe('msg-001:req-001');

    // Second assistant entry
    expect(entries[1].usage.inputTokens).toBe(200);
    expect(entries[1].usage.outputTokens).toBe(80);
  });

  it('handles multi-model sessions', async () => {
    const entries = await parseTranscriptFile(
      join(FIXTURES, 'multi-model.jsonl'),
    );

    expect(entries).toHaveLength(3);

    const models = entries.map((e) => e.model);
    expect(models).toContain('claude-opus-4-6');
    expect(models).toContain('claude-sonnet-4-20250514');
    expect(models).toContain('claude-haiku-4-5-20251001');
  });

  it('returns empty array for empty file', async () => {
    const entries = await parseTranscriptFile(
      join(FIXTURES, 'empty.jsonl'),
    );
    expect(entries).toHaveLength(0);
  });

  it('skips malformed lines without throwing', async () => {
    const entries = await parseTranscriptFile(
      join(FIXTURES, 'malformed.jsonl'),
    );

    // Only 2 valid assistant entries with usage should be parsed
    expect(entries).toHaveLength(2);
    expect(entries[0].usage.inputTokens).toBe(300);
    expect(entries[1].usage.inputTokens).toBe(400);
  });

  it('deduplicates entries with same messageId:requestId', async () => {
    const entries = await parseTranscriptFile(
      join(FIXTURES, 'duplicates.jsonl'),
    );

    // 3 lines but msg-030:req-030 appears twice, so only 2 unique entries
    expect(entries).toHaveLength(2);
    expect(entries[0].dedupeKey).toBe('msg-030:req-030');
    expect(entries[1].dedupeKey).toBe('msg-031:req-031');
  });

  it('handles missing optional fields gracefully', async () => {
    const entries = await parseTranscriptFile(
      join(FIXTURES, 'malformed.jsonl'),
    );

    // The second valid entry has no cache tokens
    const lastEntry = entries[1];
    expect(lastEntry.usage.cacheCreationInputTokens).toBe(0);
    expect(lastEntry.usage.cacheReadInputTokens).toBe(0);
  });

  it('extracts UTC date from ISO timestamp correctly', async () => {
    const entries = await parseTranscriptFile(
      join(FIXTURES, 'single-session.jsonl'),
    );

    // Timestamp is 2026-03-25T10:00:05.000Z → date should be 2026-03-25
    expect(entries[0].date).toBe('2026-03-25');
  });
});

// ---------------------------------------------------------------------------
// extractProjectFromPath
// ---------------------------------------------------------------------------

describe('extractProjectFromPath', () => {
  it('extracts project ID from Claude projects path', () => {
    const path =
      '/Users/user/.claude/projects/-Users-user-code-myproject/session-123.jsonl';
    expect(extractProjectFromPath(path)).toBe(
      '-Users-user-code-myproject',
    );
  });

  it('returns "unknown" for paths without projects segment', () => {
    expect(extractProjectFromPath('/some/random/path.jsonl')).toBe('unknown');
  });

  it('handles nested projects directory', () => {
    const path =
      '/home/user/.config/claude/projects/my-project/sub/file.jsonl';
    expect(extractProjectFromPath(path)).toBe('my-project');
  });
});

// ---------------------------------------------------------------------------
// scanAllFiles
// ---------------------------------------------------------------------------

describe('scanAllFiles', () => {
  const tempDir = join(tmpdir(), `ccwrapped-test-${Date.now()}`);
  const projectsDir = join(tempDir, 'projects');
  const projectA = join(projectsDir, 'project-a');
  const projectB = join(projectsDir, 'project-b');

  beforeAll(() => {
    mkdirSync(projectA, { recursive: true });
    mkdirSync(projectB, { recursive: true });

    // Project A — session with 2 entries on 2026-03-24
    writeFileSync(
      join(projectA, 'session-1.jsonl'),
      [
        JSON.stringify({
          type: 'assistant',
          timestamp: '2026-03-24T10:00:00.000Z',
          sessionId: 'sess-1',
          requestId: 'req-100',
          message: {
            id: 'msg-100',
            model: 'claude-sonnet-4-20250514',
            usage: { input_tokens: 100, output_tokens: 50 },
          },
        }),
        JSON.stringify({
          type: 'assistant',
          timestamp: '2026-03-25T10:00:00.000Z',
          sessionId: 'sess-1',
          requestId: 'req-101',
          message: {
            id: 'msg-101',
            model: 'claude-sonnet-4-20250514',
            usage: { input_tokens: 200, output_tokens: 80 },
          },
        }),
      ].join('\n'),
    );

    // Project B — session with 1 entry on 2026-03-25
    writeFileSync(
      join(projectB, 'session-2.jsonl'),
      JSON.stringify({
        type: 'assistant',
        timestamp: '2026-03-25T14:00:00.000Z',
        sessionId: 'sess-2',
        requestId: 'req-200',
        message: {
          id: 'msg-200',
          model: 'claude-opus-4-6',
          usage: {
            input_tokens: 500,
            output_tokens: 200,
            cache_creation_input_tokens: 1000,
            cache_read_input_tokens: 500,
          },
        },
      }),
    );
  });

  afterAll(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('discovers JSONL files across multiple project directories', async () => {
    const entries = await scanAllFiles({ claudePaths: [tempDir] });
    expect(entries).toHaveLength(3);
  });

  it('assigns correct project IDs', async () => {
    const entries = await scanAllFiles({ claudePaths: [tempDir] });
    const projectIds = [...new Set(entries.map((e) => e.projectId))];
    expect(projectIds).toContain('project-a');
    expect(projectIds).toContain('project-b');
  });

  it('applies date filtering with since', async () => {
    const entries = await scanAllFiles({
      claudePaths: [tempDir],
      since: '2026-03-25' as any,
    });
    expect(entries).toHaveLength(2);
    expect(entries.every((e) => e.date >= '2026-03-25')).toBe(true);
  });

  it('applies date filtering with until', async () => {
    const entries = await scanAllFiles({
      claudePaths: [tempDir],
      until: '2026-03-24' as any,
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].date).toBe('2026-03-24');
  });

  it('applies date filtering with since and until', async () => {
    const entries = await scanAllFiles({
      claudePaths: [tempDir],
      since: '2026-03-25' as any,
      until: '2026-03-25' as any,
    });
    expect(entries).toHaveLength(2);
    expect(entries.every((e) => e.date === '2026-03-25')).toBe(true);
  });

  it('returns empty array when no paths exist', async () => {
    const entries = await scanAllFiles({
      claudePaths: ['/nonexistent/path'],
    });
    expect(entries).toHaveLength(0);
  });
});
