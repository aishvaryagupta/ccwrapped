import {
  API_BASE_URL,
  CLIENT_VERSION,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  addSyncedSession,
  buildMachineId,
  buildSyncPayload,
  filterDaysForSync,
  getValidToken,
  isSessionSynced,
  parseTranscriptFile,
  postSyncPayload,
  readState,
} from '@ccwrapped/core';

async function main(): Promise<void> {
  // Read hook input from stdin
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }

  let hookInput: { session_id?: string; transcript_path?: string };
  try {
    hookInput = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
  } catch {
    return;
  }

  const sessionId = hookInput.session_id;
  const transcriptPath = hookInput.transcript_path;
  if (!sessionId || !transcriptPath) return;

  // Idempotency: skip if already synced
  if (isSessionSynced(sessionId)) return;

  // Check auth (auto-refreshes expired tokens)
  const token = await getValidToken(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  if (!token) {
    process.stderr.write(
      'ccwrapped: Run "npx ccwrapped auth" to connect your Google account.\n',
    );
    return;
  }

  // Parse transcript
  const entries = await parseTranscriptFile(transcriptPath);
  if (entries.length === 0) return;

  // Build and filter payload
  const state = readState();
  const machineId = state.machine_id || buildMachineId();
  const payload = buildSyncPayload(entries, machineId, CLIENT_VERSION);
  const { payload: filtered } = filterDaysForSync(payload);
  if (filtered.days.length === 0) return;

  // POST to API
  const result = await postSyncPayload(API_BASE_URL, token, filtered);
  if (!result.ok) return;

  // Record synced session
  addSyncedSession(sessionId);
}

// Always exit 0 — never block Claude Code
process.exitCode = 0;
main().catch(() => {});
