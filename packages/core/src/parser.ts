import { createReadStream, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import fg from 'fast-glob';
import { safeParse } from 'valibot';
import {
  CLAUDE_CONFIG_DIR_ENV,
  CLAUDE_PROJECTS_DIR,
  DEFAULT_CONFIG_PATHS,
  JSONL_GLOB,
} from './consts.js';
import {
  type DailyDate,
  DailyDateSchema,
  type ParsedEntry,
  type ScanOptions,
  type UsageEntry,
  UsageEntrySchema,
} from './types.js';

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

export function getClaudePaths(): string[] {
  const paths: string[] = [];

  const envVar = process.env[CLAUDE_CONFIG_DIR_ENV];
  if (envVar) {
    for (const dir of envVar.split(',')) {
      const trimmed = dir.trim();
      if (trimmed) paths.push(trimmed);
    }
  }

  for (const configPath of DEFAULT_CONFIG_PATHS) {
    if (existsSync(join(configPath, CLAUDE_PROJECTS_DIR))) {
      paths.push(configPath);
    }
  }

  return [...new Set(paths)];
}

export function extractProjectFromPath(filePath: string): string {
  const segments = filePath.split(/[/\\]/);
  const projectsIdx = segments.lastIndexOf(CLAUDE_PROJECTS_DIR);
  if (projectsIdx !== -1 && projectsIdx + 1 < segments.length) {
    return segments[projectsIdx + 1];
  }
  return 'unknown';
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

function createDedupeKey(
  messageId: string | undefined,
  requestId: string | undefined,
): string | null {
  if (messageId && requestId) {
    return `${messageId}:${requestId}`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Date extraction
// ---------------------------------------------------------------------------

function extractDateUTC(isoTimestamp: string): DailyDate | null {
  const dateStr = isoTimestamp.slice(0, 10);
  const result = safeParse(DailyDateSchema, dateStr);
  if (result.success) {
    return result.output;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Tool metrics extraction
// ---------------------------------------------------------------------------

const FILE_PATH_TOOLS = new Set(['Read', 'Write', 'Edit']);

function extractToolMetrics(
  content: UsageEntry['message']['content'],
): { toolCounts: Record<string, number>; filesTouched: string[]; linesWritten: number } | null {
  if (!content || content.length === 0) return null;

  const toolCounts: Record<string, number> = {};
  const files = new Set<string>();
  let linesWritten = 0;

  for (const block of content) {
    if (block.type !== 'tool_use' || !block.name) continue;

    toolCounts[block.name] = (toolCounts[block.name] ?? 0) + 1;

    if (FILE_PATH_TOOLS.has(block.name) && block.input?.file_path) {
      files.add(block.input.file_path);
    }

    if (block.name === 'Write' && block.input?.content) {
      linesWritten += block.input.content.split('\n').length;
    }

    if (block.name === 'Edit' && block.input?.new_string) {
      const newLines = block.input.new_string.split('\n').length;
      const oldLines = block.input.old_string?.split('\n').length ?? 0;
      linesWritten += Math.max(0, newLines - oldLines);
    }
  }

  if (Object.keys(toolCounts).length === 0) return null;

  return { toolCounts, filesTouched: [...files], linesWritten };
}

// ---------------------------------------------------------------------------
// Single-file parser (plugin hook path)
// ---------------------------------------------------------------------------

export async function parseTranscriptFile(
  filePath: string,
): Promise<ParsedEntry[]> {
  const entries: ParsedEntry[] = [];
  const seen = new Set<string>();
  const projectId = extractProjectFromPath(filePath);

  const stream = createReadStream(filePath, { encoding: 'utf-8' });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line.trim()) continue;

    let raw: unknown;
    try {
      raw = JSON.parse(line);
    } catch {
      continue;
    }

    const result = safeParse(UsageEntrySchema, raw);
    if (!result.success) continue;

    const entry = result.output;
    const dedupeKey = createDedupeKey(entry.message.id, entry.requestId);

    if (dedupeKey) {
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
    }

    const date = extractDateUTC(entry.timestamp);
    if (!date) continue;

    const usage = entry.message.usage;
    const toolMetrics = extractToolMetrics(entry.message.content);

    entries.push({
      timestamp: new Date(entry.timestamp),
      date,
      sessionId: entry.sessionId ?? null,
      projectId,
      model: entry.message.model ?? null,
      usage: {
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        cacheCreationInputTokens: usage.cache_creation_input_tokens ?? 0,
        cacheReadInputTokens: usage.cache_read_input_tokens ?? 0,
      },
      dedupeKey,
      toolCounts: toolMetrics?.toolCounts ?? null,
      filesTouched: toolMetrics?.filesTouched ?? null,
      linesWritten: toolMetrics?.linesWritten ?? null,
    });
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Full scan (CLI backfill path)
// ---------------------------------------------------------------------------

export async function scanAllFiles(
  options?: ScanOptions,
): Promise<ParsedEntry[]> {
  const claudePaths =
    options?.claudePaths ?? getClaudePaths();

  if (claudePaths.length === 0) {
    return [];
  }

  const projectsDirs: string[] = [];
  for (const configPath of claudePaths) {
    const projDir = join(configPath, CLAUDE_PROJECTS_DIR);
    if (existsSync(projDir)) {
      projectsDirs.push(projDir);
    }
  }

  if (projectsDirs.length === 0) {
    return [];
  }

  // Glob for all JSONL files
  const allFiles: string[] = [];
  for (const dir of projectsDirs) {
    // Only match .jsonl files directly inside project subdirectories
    const files = await fg(JSONL_GLOB, {
      cwd: dir,
      absolute: true,
      onlyFiles: true,
      followSymbolicLinks: false,
    });
    allFiles.push(...files);
  }

  // Parse all files and deduplicate globally
  const globalSeen = new Set<string>();
  const allEntries: ParsedEntry[] = [];

  for (const file of allFiles) {
    const entries = await parseTranscriptFile(file);
    for (const entry of entries) {
      if (entry.dedupeKey) {
        if (globalSeen.has(entry.dedupeKey)) continue;
        globalSeen.add(entry.dedupeKey);
      }
      allEntries.push(entry);
    }
  }

  // Apply date filters
  const since = options?.since;
  const until = options?.until;

  if (!since && !until) return allEntries;

  return allEntries.filter((entry) => {
    if (since && entry.date < since) return false;
    if (until && entry.date > until) return false;
    return true;
  });
}
