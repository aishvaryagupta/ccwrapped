import {
  API_BASE_URL,
  CLIENT_VERSION,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  buildMachineId,
  buildSyncPayload,
  fetchLivePricing,
  fetchSyncMetadata,
  filterDaysForSync,
  getValidToken,
  isCcwrappedHookInstalled,
  installCcwrappedHook,
  pollForToken,
  postSyncPayload,
  readState,
  scanAllFiles,
  setAuthToken,
  setUsername,
  startDeviceFlow,
  writeState,
  type DaySummary,
} from '@ccwrapped/core';
import { createInterface } from 'node:readline';
import { openUrl } from '../browser.js';
import { bold, dim, formatCost, formatTokens, green, red, yellow, printTable } from '../ui.js';
import { promptForUsername } from './prompt-username.js';

export async function run(flags: string[]): Promise<void> {
  if (flags.includes('--local')) {
    return showLocalStats();
  }

  // 1. Auth
  let token = await getValidToken(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  if (!token) {
    console.log(bold('ccwrapped') + dim(' — setup'));
    console.log();

    if (!GOOGLE_CLIENT_ID) {
      console.log(yellow('Authentication is not yet configured.'));
      return;
    }

    const deviceCode = await startDeviceFlow(GOOGLE_CLIENT_ID);
    if (!deviceCode) {
      console.log(red('Failed to start authentication. Check your network.'));
      process.exitCode = 1;
      return;
    }

    console.log(`! First, copy your one-time code: ${bold(deviceCode.user_code)}`);
    console.log();
    console.log(`Opening ${deviceCode.verification_url} ...`);
    openUrl(deviceCode.verification_url);
    console.log();
    console.log('Waiting for authorization...');

    const result = await pollForToken(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      deviceCode.device_code,
      deviceCode.interval,
    );

    if (!result.ok) {
      const messages: Record<string, string> = {
        expired: 'Code expired. Run again.',
        denied: 'Authorization denied.',
        network: 'Network error during authorization.',
        not_configured: 'Auth not configured.',
      };
      console.log(red(messages[result.error] ?? 'Unknown error.'));
      process.exitCode = 1;
      return;
    }

    setAuthToken(result.token, result.refreshToken, result.expiresIn);
    token = result.token;
    console.log(green(`Authenticated as ${result.email}`));
    console.log();
  }

  // 2. Username
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

  // 3. Scan
  console.log('Scanning Claude Code logs...');
  const entries = await scanAllFiles();

  if (entries.length === 0) {
    console.log(yellow('No usage data found.'));
    console.log(dim('Checked ~/.config/claude/projects/ and ~/.claude/projects/'));
    return;
  }

  // 4. Build + filter
  const machineId = state.machine_id || buildMachineId();
  const payload = buildSyncPayload(entries, machineId, CLIENT_VERSION);
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

  // 5. Conflict detection
  const todayDate = new Date().toISOString().slice(0, 10);
  const metadata = await fetchSyncMetadata(API_BASE_URL, token, todayDate);
  if (metadata.ok && metadata.data.machine_id && metadata.data.machine_id !== machineId) {
    console.log(yellow('Warning: Last sync was from a different machine.'));
    console.log(dim(`  Last: ${metadata.data.machine_id}  This: ${machineId}`));
    console.log();
  }

  // 6. Upload
  const totalTokens = filtered.days.reduce(
    (s, d) => s + d.inputTokens + d.outputTokens, 0,
  );
  const totalCost = filtered.days.reduce((s, d) => s + d.costUSD, 0);

  console.log(`Syncing ${filtered.days.length} day(s)...`);
  const result = await postSyncPayload(API_BASE_URL, token, filtered);

  if (!result.ok) {
    const fallback: Record<string, string> = {
      network: 'Could not reach ccwrapped.dev.',
      auth: 'Auth failed. Run "ccwrapped auth" to re-authenticate.',
      server: 'Server error. Try again later.',
      validation: 'Invalid payload.',
    };
    console.log(red(result.message ?? fallback[result.error] ?? 'Sync failed.'));
    process.exitCode = 1;
    return;
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

  // 7. Done
  console.log();
  console.log(green(`Synced ${filtered.days.length} day(s)`));
  console.log(`  ${formatTokens(totalTokens)} tokens  ${formatCost(totalCost)}`);

  const currentState = readState();
  if (currentState.username) {
    const url = `https://ccwrapped.dev/${currentState.username}`;
    console.log();
    console.log(`View your profile: ${url}`);
    openUrl(url);
  }

  // 8. Auto-sync setup
  if (!isCcwrappedHookInstalled()) {
    console.log();
    console.log(bold('Auto-sync'));
    console.log('Automatically sync stats after every Claude Code session?');
    console.log(dim('Adds a hook to ~/.claude/settings.json'));
    console.log();

    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise<string>((resolve) => {
      rl.question('Set up auto-sync? (Y/n) ', resolve);
    });
    rl.close();

    if (answer.trim().toLowerCase() !== 'n') {
      const result = installCcwrappedHook();
      if (result.installed) {
        console.log(green('Auto-sync enabled! Stats will sync after every session.'));
      } else {
        console.log(yellow('Could not write to ~/.claude/settings.json.'));
        console.log(dim('Run "npx ccwrapdev setup" to try again.'));
      }
    } else {
      console.log(dim('Skipped. Run "npx ccwrapdev setup" anytime to enable.'));
    }
  }
}

// ---------------------------------------------------------------------------
// Local stats (--local flag, old default behavior)
// ---------------------------------------------------------------------------

async function showLocalStats(): Promise<void> {
  const entries = await scanAllFiles();

  if (entries.length === 0) {
    console.log(bold('ccwrapped') + dim(' — Your Claude Code Stats'));
    console.log();
    console.log('  No Claude Code usage data found.');
    console.log();
    console.log(dim('  Checked ~/.config/claude/projects/ and ~/.claude/projects/'));
    return;
  }

  let livePricing;
  try {
    livePricing = await fetchLivePricing();
    console.log(dim(`Loaded pricing for ${livePricing.size} models`));
  } catch {
    console.log(dim('Using offline pricing (could not fetch live data)'));
  }

  const payload = buildSyncPayload(entries, buildMachineId(), '0.1.0', livePricing);
  const days = payload.days;

  console.log(bold('ccwrapped') + dim(' — Your Claude Code Stats'));
  console.log();

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10);

  const todayDay = days.find((d) => d.date === today);
  const weekDays = days.filter((d) => d.date >= weekAgo);

  const summaryRows: string[][] = [];

  if (todayDay) summaryRows.push(makeSummaryRow('Today', todayDay));
  if (weekDays.length > 0) summaryRows.push(makeSummaryRow('Last 7 days', aggregate(weekDays)));
  if (days.length > 0) summaryRows.push(makeSummaryRow('All time', aggregate(days)));

  printTable(
    ['Period', 'Input', 'Output', 'Cache Create', 'Cache Read', 'Total', 'Cost'],
    summaryRows,
    [14, 10, 10, 14, 14, 10, 8],
  );

  const allModels = new Map<string, number>();
  for (const day of days) {
    for (const mb of day.modelBreakdowns) {
      const total = mb.inputTokens + mb.outputTokens;
      allModels.set(mb.modelName, (allModels.get(mb.modelName) ?? 0) + total);
    }
  }

  if (allModels.size > 0) {
    const totalTokens = [...allModels.values()].reduce((a, b) => a + b, 0);
    console.log();
    console.log(bold('Models'));
    for (const [model, tokens] of [...allModels.entries()].sort((a, b) => b[1] - a[1])) {
      const pct = totalTokens > 0 ? Math.round((tokens / totalTokens) * 100) : 0;
      console.log(`  ${model}  ${formatTokens(tokens)}  ${dim(`${pct}%`)}`);
    }
  }

  console.log();
  console.log(dim('Sync your stats: npx ccwrapdev'));
}

function makeSummaryRow(label: string, day: DaySummary): string[] {
  const totalTokens = day.inputTokens + day.outputTokens + day.cacheCreationTokens + day.cacheReadTokens;
  return [
    label,
    formatTokens(day.inputTokens),
    formatTokens(day.outputTokens),
    formatTokens(day.cacheCreationTokens),
    formatTokens(day.cacheReadTokens),
    formatTokens(totalTokens),
    formatCost(day.costUSD),
  ];
}

function aggregate(days: DaySummary[]): DaySummary {
  let inputTokens = 0;
  let outputTokens = 0;
  let cacheCreationTokens = 0;
  let cacheReadTokens = 0;
  let costUSD = 0;

  for (const day of days) {
    inputTokens += day.inputTokens;
    outputTokens += day.outputTokens;
    cacheCreationTokens += day.cacheCreationTokens;
    cacheReadTokens += day.cacheReadTokens;
    costUSD += day.costUSD;
  }

  return {
    date: '',
    inputTokens,
    outputTokens,
    cacheCreationTokens,
    cacheReadTokens,
    costUSD,
    sessionCount: days.reduce((s, d) => s + d.sessionCount, 0),
    projectCount: days.reduce((s, d) => s + d.projectCount, 0),
    modelBreakdowns: [],
  };
}

