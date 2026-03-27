import {
  buildMachineId,
  buildSyncPayload,
  fetchLivePricing,
  scanAllFiles,
  type DaySummary,
} from '@ccwrapped/core';
import { bold, dim, formatCost, formatTokens, printTable } from '../ui.js';

export async function run(_flags: string[]): Promise<void> {
  const entries = await scanAllFiles();

  if (entries.length === 0) {
    console.log(bold('ccwrapped') + dim(' — Your Claude Code Stats'));
    console.log();
    console.log('  No Claude Code usage data found.');
    console.log();
    console.log(dim('  Checked ~/.config/claude/projects/ and ~/.claude/projects/'));
    console.log(dim('  If you use Claude Code, logs are created automatically.'));
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

  // Today / this week / all time
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10);

  const todayDay = days.find((d) => d.date === today);
  const weekDays = days.filter((d) => d.date >= weekAgo);

  const summaryRows: string[][] = [];

  if (todayDay) {
    summaryRows.push(makeSummaryRow('Today', todayDay));
  }

  if (weekDays.length > 0) {
    summaryRows.push(makeSummaryRow('Last 7 days', aggregate(weekDays)));
  }

  if (days.length > 0) {
    summaryRows.push(makeSummaryRow('All time', aggregate(days)));
  }

  printTable(
    ['Period', 'Input', 'Output', 'Cache Create', 'Cache Read', 'Total', 'Cost'],
    summaryRows,
    [14, 10, 10, 14, 14, 10, 8],
  );

  // Model breakdown
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
  console.log(dim('Sync your stats: ccwrapped sync'));
  console.log(dim('Install the plugin for auto-sync: /plugin install ccwrapped'));
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
