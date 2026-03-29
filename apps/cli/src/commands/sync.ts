import {
  API_BASE_URL,
  CLIENT_VERSION,
  buildMachineId,
  buildSyncPayload,
  fetchSyncMetadata,
  filterDaysForSync,
  getSyncToken,
  postSyncPayload,
  readState,
  scanAllFiles,
  setSyncToken,
  writeState,
  type SyncAuth,
} from '@ccwrapped/core';
import { bold, dim, formatCost, formatTokens, green, red, yellow } from '../ui.js';

export async function run(flags: string[]): Promise<void> {
  const minimal = flags.includes('--minimal');

  const syncToken = getSyncToken();
  if (!syncToken) {
    console.log(yellow('No sync token found.'));
    console.log('Run "npx ccwrapdev" first to set up.');
    process.exitCode = 1;
    return;
  }

  console.log(bold('ccwrapped sync'));
  console.log();

  // Scan all files
  console.log('Scanning Claude Code logs...');
  const entries = await scanAllFiles();

  if (entries.length === 0) {
    console.log(yellow('No usage data found.'));
    return;
  }

  // Build payload
  const state = readState();
  const machineId = state.machine_id || buildMachineId();
  let payload = buildSyncPayload(entries, machineId, CLIENT_VERSION);

  // Minimal mode: strip model breakdowns and counts
  if (minimal) {
    payload = {
      ...payload,
      days: payload.days.map((day) => ({
        ...day,
        modelBreakdowns: [],
        sessionCount: 0,
        projectCount: 0,
      })),
    };
  }

  // Filter
  const { payload: filtered, filtered: dropped } = filterDaysForSync(payload);

  if (dropped.length > 0) {
    console.log(yellow(`Filtered ${dropped.length} day(s):`));
    for (const d of dropped) {
      console.log(`  ${d.date}: ${d.reason}`);
    }
    console.log();
  }

  if (filtered.days.length === 0) {
    console.log('No days to sync after filtering.');
    return;
  }

  // Conflict detection
  const todayDate = new Date().toISOString().slice(0, 10);
  const auth: SyncAuth = { syncToken };
  const metadata = await fetchSyncMetadata(API_BASE_URL, todayDate, auth);
  if (metadata.ok && metadata.data.machine_id && metadata.data.machine_id !== machineId) {
    console.log(yellow('Warning: Last sync was from a different machine.'));
    console.log(dim(`  Last: ${metadata.data.machine_id}  This: ${machineId}`));
    console.log();
  }

  // Upload
  const totalTokens = filtered.days.reduce(
    (s, d) => s + d.inputTokens + d.outputTokens,
    0,
  );
  const totalCost = filtered.days.reduce((s, d) => s + d.costUSD, 0);

  console.log(`Syncing ${filtered.days.length} day(s)...`);
  const result = await postSyncPayload(API_BASE_URL, filtered, auth);

  if (!result.ok) {
    const messages: Record<string, string> = {
      network: 'Could not reach ccwrapped.dev.',
      auth: 'Sync token invalid. Run "npx ccwrapdev" to re-sync.',
      server: 'Server error. Try again later.',
      validation: 'Invalid payload.',
    };
    console.log(red(result.message ?? messages[result.error] ?? 'Sync failed.'));
    process.exitCode = 1;
    return;
  }

  // Store username if returned
  if (result.data.username) {
    const updatedState = readState();
    updatedState.username = result.data.username;
    writeState(updatedState);
  }

  // Mark sessions as synced
  const sessionIds = [...new Set(entries.map((e) => e.sessionId).filter(Boolean))] as string[];
  const updatedState = readState();
  const existing = new Set(updatedState.synced_sessions);
  for (const sid of sessionIds) {
    if (!existing.has(sid)) updatedState.synced_sessions.push(sid);
  }
  updatedState.last_sync = new Date().toISOString();
  writeState(updatedState);

  console.log();
  console.log(green(`Synced ${filtered.days.length} day(s)`));
  console.log(`  ${formatTokens(totalTokens)} tokens  ${formatCost(totalCost)}`);

  const currentState = readState();
  if (currentState.username) {
    console.log();
    console.log(`View your profile: https://ccwrapped.dev/${currentState.username}`);
  } else if (result.data.profile_url) {
    console.log();
    console.log(`View your stats: ${result.data.profile_url}`);
  }
}
