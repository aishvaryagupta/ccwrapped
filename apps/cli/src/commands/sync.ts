import {
  API_BASE_URL,
  CLIENT_VERSION,
  addSyncedSession,
  buildMachineId,
  buildSyncPayload,
  fetchSyncMetadata,
  filterDaysForSync,
  getAuthToken,
  postSyncPayload,
  readState,
  scanAllFiles,
} from '@devwrapped/core';
import { bold, dim, formatCost, formatTokens, green, red, yellow } from '../ui.js';

export async function run(flags: string[]): Promise<void> {
  const minimal = flags.includes('--minimal');

  // Check auth
  const token = getAuthToken();
  if (!token) {
    console.log(red('Not authenticated.'));
    console.log('Run "devwrapped auth" first.');
    process.exitCode = 1;
    return;
  }

  console.log(bold('devwrapped sync'));
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
  const metadata = await fetchSyncMetadata(API_BASE_URL, token, todayDate);
  if (metadata.ok && metadata.data.machine_id && metadata.data.machine_id !== machineId) {
    console.log(yellow(`Warning: Last sync was from a different machine.`));
    console.log(dim(`  Last sync machine: ${metadata.data.machine_id}`));
    console.log(dim(`  This machine:      ${machineId}`));
    console.log(dim('  Syncing will overwrite. Proceed with caution.'));
    console.log();
  }

  // Upload
  const totalTokens = filtered.days.reduce(
    (s, d) => s + d.inputTokens + d.outputTokens,
    0,
  );
  const totalCost = filtered.days.reduce((s, d) => s + d.costUSD, 0);

  console.log(`Syncing ${filtered.days.length} day(s)...`);
  const result = await postSyncPayload(API_BASE_URL, token, filtered);

  if (!result.ok) {
    const messages: Record<string, string> = {
      network: 'Could not reach devwrapped.dev. The API may not be available yet.',
      auth: 'Authentication failed. Run "devwrapped auth" to re-authenticate.',
      server: 'Server error. Try again later.',
      validation: 'Invalid payload.',
    };
    console.log(red(messages[result.error] ?? 'Sync failed.'));
    process.exitCode = 1;
    return;
  }

  // Mark all sessions as synced
  const sessionIds = [...new Set(entries.map((e) => e.sessionId).filter(Boolean))] as string[];
  for (const sid of sessionIds) {
    addSyncedSession(sid);
  }

  console.log();
  console.log(green(`Synced ${filtered.days.length} day(s)`));
  console.log(`  ${formatTokens(totalTokens)} tokens  ${formatCost(totalCost)}`);

  if (result.ok && result.data.profile_url) {
    console.log();
    console.log(`View your profile: ${result.data.profile_url}`);
  } else {
    const login = state.github_login;
    if (login) {
      console.log();
      console.log(`View your profile: https://devwrapped.dev/@${login}`);
    }
  }
}
