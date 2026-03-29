import {
  API_BASE_URL,
  CLIENT_VERSION,
  buildMachineId,
  buildSyncPayload,
  fetchLivePricing,
  filterDaysForSync,
  getSyncToken,
  isCcwrappedHookInstalled,
  installCcwrappedHook,
  postSyncPayload,
  readState,
  scanAllFiles,
  writeState,
  type DaySummary,
  type SyncAuth,
} from '@ccwrapped/core';
import { createInterface } from 'node:readline';
import { openUrl } from '../browser.js';
import { bold, dim, formatCost, formatTokens, green, red, yellow, printTable } from '../ui.js';

export async function run(flags: string[]): Promise<void> {
  if (flags.includes('--local')) {
    return showLocalStats();
  }

  // 1. Scan
  console.log('Scanning Claude Code logs...');
  const entries = await scanAllFiles();

  if (entries.length === 0) {
    console.log(yellow('No usage data found.'));
    console.log(dim('Checked ~/.config/claude/projects/ and ~/.claude/projects/'));
    return;
  }

  // 2. Show brief terminal stats
  const state = readState();
  const machineId = state.machine_id || buildMachineId();
  const previewPayload = buildSyncPayload(entries, machineId, CLIENT_VERSION);
  const totalTokens = previewPayload.days.reduce((s, d) => s + d.inputTokens + d.outputTokens, 0);
  const totalCost = previewPayload.days.reduce((s, d) => s + d.costUSD, 0);
  const totalSessions = previewPayload.days.reduce((s, d) => s + d.sessionCount, 0);

  console.log();
  console.log(`  ${bold(formatTokens(totalTokens))} tokens  ${bold(String(totalSessions))} sessions  ${bold(formatCost(totalCost))} cost`);
  console.log();

  // 3. Build + filter payload
  const { payload: filtered, filtered: dropped } = filterDaysForSync(previewPayload);

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

  // 4. Sync (with sync_token or anonymous)
  const syncToken = getSyncToken();
  const auth: SyncAuth | undefined = syncToken ? { syncToken } : undefined;

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

  // 5. Guard: first anonymous sync must return a sync_token
  if (!auth && !result.data.sync_token) {
    console.log(red('Sync succeeded but no token was returned. Try again.'));
    process.exitCode = 1;
    return;
  }

  // 6. Single read → mutate all fields → single write
  const postState = readState();

  if (result.data.sync_token) {
    postState.sync_token = result.data.sync_token;
    // Extract profile_id from URL, with guard
    const profileMatch = result.data.profile_url?.match(/\/p\/([a-f0-9-]+)/);
    if (profileMatch) postState.profile_id = profileMatch[1];
  }

  if (result.data.username) {
    postState.username = result.data.username;
  }

  const sessionIds = [...new Set(entries.map((e) => e.sessionId).filter(Boolean))] as string[];
  const existingSessions = new Set(postState.synced_sessions);
  for (const sid of sessionIds) {
    if (!existingSessions.has(sid)) postState.synced_sessions.push(sid);
  }
  postState.last_sync = new Date().toISOString();

  writeState(postState);

  // 7. Done
  console.log();
  console.log(green(`Synced ${filtered.days.length} day(s)`));

  const profileUrl = postState.username
    ? `https://ccwrapped.dev/${postState.username}`
    : result.data.profile_url;

  if (profileUrl) {
    console.log();
    console.log(`View your stats: ${profileUrl}`);
    if (!postState.username) {
      console.log(dim('Claim a username at the link above to get a custom URL.'));
    }
    openUrl(profileUrl);
  }

  // 7. Auto-sync setup
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
      const hookResult = installCcwrappedHook();
      if (hookResult.installed) {
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
// Local stats (--local flag)
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
