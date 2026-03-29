import {
  API_BASE_URL,
  CLIENT_VERSION,
  MAX_SYNCED_SESSIONS,
  buildSyncPayload,
  fetchSyncMetadata,
  filterDaysForSync,
  getSyncToken,
  postSyncPayload,
  readState,
  scanAllFiles,
  writeState,
  type SyncAuth,
} from '@ccwrapped/core';
import { SYNC_ERROR_MESSAGES, bold, dim, formatCost, formatTokens, green, red, yellow } from '../ui.js';

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
  let payload = buildSyncPayload(entries, state.machine_id, CLIENT_VERSION);

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
  if (metadata.ok && metadata.data.machine_id && metadata.data.machine_id !== state.machine_id) {
    console.log(yellow('Warning: Last sync was from a different machine.'));
    console.log(dim(`  Last: ${metadata.data.machine_id}  This: ${state.machine_id}`));
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
    console.log(red(result.message ?? SYNC_ERROR_MESSAGES[result.error] ?? 'Sync failed.'));
    process.exitCode = 1;
    return;
  }

  // Single read → mutate all fields → single write
  const postState = readState();

  if (result.data.username) {
    postState.username = result.data.username;
  }

  const sessionIds = [...new Set(entries.map((e) => e.sessionId).filter(Boolean))] as string[];
  const existing = new Set(postState.synced_sessions);
  for (const sid of sessionIds) {
    if (!existing.has(sid)) postState.synced_sessions.push(sid);
  }
  if (postState.synced_sessions.length > MAX_SYNCED_SESSIONS) {
    postState.synced_sessions = postState.synced_sessions.slice(-MAX_SYNCED_SESSIONS);
  }
  postState.last_sync = new Date().toISOString();

  writeState(postState);

  console.log();
  console.log(green(`Synced ${filtered.days.length} day(s)`));
  console.log(`  ${formatTokens(totalTokens)} tokens  ${formatCost(totalCost)}`);

  if (postState.username) {
    console.log();
    console.log(`View your profile: https://ccwrapped.dev/${postState.username}`);
  } else if (result.data.profile_url) {
    console.log();
    console.log(`View your stats: ${result.data.profile_url}`);
  }
}
