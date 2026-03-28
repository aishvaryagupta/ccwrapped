import * as readline from 'node:readline/promises';
import {
  API_BASE_URL,
  CLIENT_VERSION,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  buildMachineId,
  buildSyncPayload,
  claimUsername,
  fetchSyncMetadata,
  filterDaysForSync,
  getValidToken,
  postSyncPayload,
  readState,
  scanAllFiles,
  setUsername,
  validateUsername,
  writeState,
} from '@ccwrapped/core';
import { bold, dim, formatCost, formatTokens, green, red, yellow } from '../ui.js';

export async function run(flags: string[]): Promise<void> {
  const minimal = flags.includes('--minimal');

  // Check auth (auto-refreshes expired tokens)
  const token = await getValidToken(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  if (!token) {
    console.log(red('Not authenticated.'));
    console.log('Run "ccwrapped auth" first.');
    process.exitCode = 1;
    return;
  }

  console.log(bold('ccwrapped sync'));
  console.log();

  // Username picking on first sync
  const state = readState();
  if (!state.username) {
    const claimed = await promptForUsername(token);
    if (!claimed) {
      process.exitCode = 1;
      return;
    }
    setUsername(claimed);
    console.log(green(`Username set: @${claimed}`));
    console.log();
  }

  // Scan all files
  console.log('Scanning Claude Code logs...');
  const entries = await scanAllFiles();

  if (entries.length === 0) {
    console.log(yellow('No usage data found.'));
    return;
  }

  // Build payload
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
      network: 'Could not reach ccwrapped.dev. The API may not be available yet.',
      auth: 'Authentication failed. Run "ccwrapped auth" to re-authenticate.',
      server: 'Server error. Try again later.',
      validation: 'Invalid payload.',
    };
    console.log(red(messages[result.error] ?? 'Sync failed.'));
    process.exitCode = 1;
    return;
  }

  // Mark all sessions as synced (batch write)
  const sessionIds = [...new Set(entries.map((e) => e.sessionId).filter(Boolean))] as string[];
  const updatedState = readState();
  const existing = new Set(updatedState.synced_sessions);
  for (const sid of sessionIds) {
    if (!existing.has(sid)) {
      updatedState.synced_sessions.push(sid);
    }
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
  }
}

async function promptForUsername(token: string): Promise<string | null> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const MAX_ATTEMPTS = 3;

  try {
    console.log(bold('Pick a username for your profile'));
    console.log(dim('3-30 characters, letters, numbers, and hyphens.'));
    console.log();

    let attempts = 0;
    while (attempts < MAX_ATTEMPTS) {
      let input: string;
      try {
        input = await rl.question('Username: ');
      } catch {
        return null;
      }

      if (!input.trim()) {
        console.log(dim('Username cannot be empty.'));
        continue;
      }

      attempts++;

      const validation = validateUsername(input);
      if (!validation.valid) {
        console.log(red(validation.reason));
        continue;
      }

      const result = await claimUsername(API_BASE_URL, token, validation.normalized);
      if (result.ok) {
        return result.data.username;
      }

      console.log(red(result.message ?? 'Could not claim username.'));
    }

    console.log(red('Too many attempts. Run "ccwrapped sync" to try again.'));
    return null;
  } finally {
    rl.close();
  }
}
