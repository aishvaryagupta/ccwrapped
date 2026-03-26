import {
  API_BASE_URL,
  CLIENT_VERSION,
  addSyncedSession,
  buildMachineId,
  buildSyncPayload,
  filterDaysForSync,
  getAuthToken,
  isSessionSynced,
  parseTranscriptFile,
  postSyncPayload,
  readState,
} from '@devwrapped/core';

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

  // Check auth
  const token = getAuthToken();
  if (!token) {
    process.stderr.write(
      'devwrapped: Run "npx devwrapped auth" to connect your GitHub account.\n',
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
main().catch(() => {}).finally(() => process.exit(0));
