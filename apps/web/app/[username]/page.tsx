import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Coins, Hash, FolderOpen, DollarSign, Download, Calendar, FileCode, PenLine } from 'lucide-react';
import { CopyButton } from '@/components/copy-button';
import { Heatmap } from '@/components/heatmap';
import { ModelChart } from '@/components/model-chart';
import { ToolChart } from '@/components/tool-chart';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatTokens } from '@ccwrapped/core';
import { DAILY_TREND_DAYS, HEATMAP_DAYS, TOP_MODELS_COUNT, TOP_TOOLS_COUNT } from '@/lib/consts';
import { fetchUserProfile, fetchUserStats } from '@/lib/queries';

export const revalidate = 300;

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username: rawUsername } = await params;
  const username = rawUsername.replace(/^@/, '');
  return {
    title: `@${username} — ccwrapped`,
    description: `Claude Code usage stats for @${username}`,
    openGraph: {
      title: `@${username} — ccwrapped`,
      description: `Claude Code usage stats for @${username}`,
      images: [`/api/card/${username}.png`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `@${username} — ccwrapped`,
      images: [`/api/card/${username}.png`],
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username: rawUsername } = await params;
  const username = rawUsername.replace(/^@/, '');
  const user = await fetchUserProfile(username);
  if (!user) notFound();

  const stats = await fetchUserStats(user.id);

  // Aggregate totals
  let totalInput = 0;
  let totalOutput = 0;
  let totalSessions = 0;
  let totalProjects = 0;
  let totalCost = 0;
  let totalFilesTouched = 0;
  let totalLinesWritten = 0;
  const models = new Map<string, number>();
  const toolAgg = new Map<string, number>();

  for (const day of stats) {
    totalInput += day.inputTokens;
    totalOutput += day.outputTokens;
    totalSessions += day.sessionCount;
    totalProjects += day.projectCount;
    totalCost += day.costUsd;
    totalFilesTouched += day.filesTouched ?? 0;
    totalLinesWritten += day.linesWritten ?? 0;

    for (const mb of day.modelBreakdowns) {
      const t = mb.inputTokens + mb.outputTokens;
      models.set(mb.modelName, (models.get(mb.modelName) ?? 0) + t);
    }

    for (const tu of (day.toolUsage ?? [])) {
      toolAgg.set(tu.toolName, (toolAgg.get(tu.toolName) ?? 0) + tu.count);
    }
  }

  const totalTokens = totalInput + totalOutput;
  const modelTotal = [...models.values()].reduce((s, v) => s + v, 0);
  const sortedModels = [...models.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_MODELS_COUNT)
    .map(([name, tokens]) => ({
      name,
      tokens,
      percentage: modelTotal > 0 ? Math.round((tokens / modelTotal) * 100) : 0,
    }));

  const toolTotal = [...toolAgg.values()].reduce((s, v) => s + v, 0);
  const sortedTools = [...toolAgg.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_TOOLS_COUNT)
    .map(([name, count]) => ({
      name,
      count,
      percentage: toolTotal > 0 ? Math.round((count / toolTotal) * 100) : 0,
    }));

  // Cost breakdown by period
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgoStr = new Date(now.getTime() - 7 * 86400_000).toISOString().slice(0, 10);
  const monthAgoStr = new Date(now.getTime() - 30 * 86400_000).toISOString().slice(0, 10);

  let dailyCost = 0;
  let weeklyCost = 0;
  let monthlyCost = 0;
  for (const day of stats) {
    if (day.date === todayStr) dailyCost += day.costUsd;
    if (day.date >= weekAgoStr) weeklyCost += day.costUsd;
    if (day.date >= monthAgoStr) monthlyCost += day.costUsd;
  }

  // Build heatmap (last 90 days)
  const daysByDate = new Map(stats.map((d) => [d.date, d]));
  const heatmapData = Array.from({ length: HEATMAP_DAYS }, (_, i) => {
    const date = new Date(now.getTime() - (HEATMAP_DAYS - 1 - i) * 86400_000)
      .toISOString()
      .slice(0, 10);
    const day = daysByDate.get(date);
    return {
      date,
      tokens: day ? day.inputTokens + day.outputTokens : 0,
    };
  });

  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const activeDays = stats.length;

  return (
    <div className="max-w-[80ch] mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <header className="flex items-start sm:items-center gap-4 sm:gap-5 mb-10">
        {user.avatarUrl && (
          <Image
            src={user.avatarUrl}
            alt={`${user.username}'s avatar`}
            width={80}
            height={80}
            className="border-2 border-foreground"
            priority
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">@{user.username}</h1>
            <Badge variant="secondary" className="text-xs">
              {activeDays} day{activeDays !== 1 ? 's' : ''} active
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
            <Calendar className="size-3.5" />
            <span>Joined {joinDate}</span>
          </div>
        </div>
      </header>

      {/* Usage */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">USAGE</h2>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Tokens"
            value={formatTokens(totalTokens)}
            icon={<Coins className="size-5" />}
            tooltip="Total input + output tokens consumed across all Claude Code sessions"
          />
          <StatCard
            label="Sessions"
            value={String(totalSessions)}
            icon={<Hash className="size-5" />}
            tooltip="Number of individual Claude Code conversations or sessions"
          />
          <StatCard
            label="Projects"
            value={String(totalProjects)}
            icon={<FolderOpen className="size-5" />}
            tooltip="Number of distinct project directories where Claude Code was used"
          />
        </div>
      </div>

      {/* Cost */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">COST</h2>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Today"
            value={`$${dailyCost.toFixed(2)}`}
            icon={<DollarSign className="size-5" />}
            tooltip="Estimated API cost for today based on token usage and model pricing"
          />
          <StatCard
            label="Last 7 days"
            value={`$${weeklyCost.toFixed(2)}`}
            icon={<DollarSign className="size-5" />}
            tooltip="Estimated API cost over the last 7 days"
          />
          <StatCard
            label="Last 30 days"
            value={`$${monthlyCost.toFixed(2)}`}
            icon={<DollarSign className="size-5" />}
            tooltip="Estimated API cost over the last 30 days"
          />
        </div>
      </div>

      {/* Code Output */}
      {(totalFilesTouched > 0 || totalLinesWritten > 0) && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">CODE OUTPUT</h2>
          <div className="grid grid-cols-2 gap-3">
            {totalFilesTouched > 0 && (
              <StatCard
                label="Files Touched"
                value={formatTokens(totalFilesTouched)}
                icon={<FileCode className="size-5" />}
                tooltip="Number of unique files read, written, or edited by Claude Code"
              />
            )}
            {totalLinesWritten > 0 && (
              <StatCard
                label="Lines Written"
                value={formatTokens(totalLinesWritten)}
                icon={<PenLine className="size-5" />}
                tooltip="Lines of code written or added via Write and Edit tool calls"
              />
            )}
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="mb-8">
        <Heatmap days={heatmapData} />
      </div>

      {/* Charts: Model breakdown + Tool usage + Daily trend */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {/* Model breakdown */}
        {sortedModels.length > 0 && (
          <ModelChart models={sortedModels} />
        )}

        {/* Tool usage */}
        {sortedTools.length > 0 && (
          <ToolChart tools={sortedTools} />
        )}

        {/* Daily trend */}
        {stats.length > 0 && (() => {
          const last30 = stats.slice(-DAILY_TREND_DAYS);
          const maxDay = Math.max(
            ...last30.map((d) => d.inputTokens + d.outputTokens),
            1,
          );
          return (
            <div className="border-2 border-foreground bg-card p-4 sm:p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Daily tokens (last {DAILY_TREND_DAYS} days)
              </h3>
              <div className="flex items-end gap-px h-28">
                {last30.map((day) => {
                  const tokens = day.inputTokens + day.outputTokens;
                  const height = (tokens / maxDay) * 100;
                  return (
                    <div
                      key={day.date}
                      className="flex-1 bg-primary/70 hover:bg-primary min-h-[2px] transition-colors"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${day.date}: ${formatTokens(tokens)}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>{last30[0]?.date ?? ''}</span>
                <span>{last30[last30.length - 1]?.date ?? ''}</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Share section */}
      <div className="border-2 border-foreground bg-card p-4 sm:p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase">Share your stats</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={`/api/card/${user.username}.png`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="w-full sm:w-auto gap-2">
              <Download className="size-4" />
              Download Card
            </Button>
          </a>
          <CopyButton
            text={`https://ccwrapped.dev/@${user.username}`}
            label="Copy Profile URL"
            className="gap-2"
          />
        </div>
      </div>
    </div>
  );
}
