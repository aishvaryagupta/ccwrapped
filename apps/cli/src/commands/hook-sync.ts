import {
  API_BASE_URL,
  CLIENT_VERSION,
  addSyncedSession,
  buildMachineId,
  buildSyncPayload,
  filterDaysForSync,
  getSyncToken,
  isSessionSynced,
  parseTranscriptFile,
  postSyncPayload,
  readState,
} from '@ccwrapped/core';

export async function run(): Promise<void> {
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

  if (isSessionSynced(sessionId)) return;

  const syncToken = getSyncToken();
  if (!syncToken) return;

  const entries = await parseTranscriptFile(transcriptPath);
  if (entries.length === 0) return;

  const state = readState();
  const machineId = state.machine_id || buildMachineId();
  const payload = buildSyncPayload(entries, machineId, CLIENT_VERSION);
  const { payload: filtered } = filterDaysForSync(payload);
  if (filtered.days.length === 0) return;

  const result = await postSyncPayload(API_BASE_URL, filtered, { syncToken });
  if (!result.ok) return;

  addSyncedSession(sessionId);
}
