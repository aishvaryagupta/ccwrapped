import Image from 'next/image';
import { Flame, Calendar, Globe, Download } from 'lucide-react';
import { CopyButton } from '@/components/copy-button';
import { Heatmap } from '@/components/heatmap';
import { ModelChart } from '@/components/model-chart';
import { ToolChart } from '@/components/tool-chart';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatTokens } from '@ccwrapped/core';
import { DAILY_TREND_DAYS, HEATMAP_DAYS, TOP_MODELS_COUNT, TOP_TOOLS_COUNT } from '@/lib/consts';
import type { UserProfile, DayStats } from '@/lib/queries';

interface ProfileContentProps {
  user: UserProfile;
  stats: DayStats[];
  claimBanner?: React.ReactNode;
}

export function ProfileContent({ user, stats, claimBanner }: ProfileContentProps) {
  // Aggregate totals
  let totalInput = 0;
  let totalOutput = 0;
  let totalCacheCreation = 0;
  let totalCacheRead = 0;
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
    totalCacheCreation += day.cacheCreationTokens;
    totalCacheRead += day.cacheReadTokens;
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

  // Build heatmap
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

  // Compute streaks
  const dateSet = new Set(stats.map((d) => d.date));
  let currentStreak = 0;
  {
    const d = new Date(now);
    while (true) {
      const dateStr = d.toISOString().slice(0, 10);
      if (!dateSet.has(dateStr)) break;
      currentStreak++;
      d.setDate(d.getDate() - 1);
    }
  }
  let longestStreak = 0;
  {
    const sortedDates = [...dateSet].sort();
    let run = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = (curr.getTime() - prev.getTime()) / 86400_000;
      if (diffDays === 1) {
        run++;
      } else {
        run = 1;
      }
      if (run > longestStreak) longestStreak = run;
    }
    if (sortedDates.length === 1 && longestStreak === 0) longestStreak = 1;
    if (currentStreak > longestStreak) longestStreak = currentStreak;
  }

  const displayName = user.username ? `@${user.username}` : 'Anonymous Profile';
  const shareUrl = user.username ? `https://ccwrapped.dev/@${user.username}` : null;

  return (
    <div className="max-w-[80ch] mx-auto px-4 py-8 sm:py-12">
      {claimBanner}

      {/* Header */}
      <header className="animate-slide-up flex items-start sm:items-center gap-4 sm:gap-5 mb-10">
        {user.avatarUrl && (
          <Image
            src={user.avatarUrl}
            alt={`${displayName}'s avatar`}
            width={80}
            height={80}
            className="border-2 border-foreground"
            priority
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">{displayName}</h1>
            <Badge variant="secondary" className="text-xs">
              {activeDays} day{activeDays !== 1 ? 's' : ''} active
            </Badge>
            {currentStreak > 0 && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Flame className="size-3" />
                {currentStreak}d streak
              </Badge>
            )}
            {longestStreak > currentStreak && (
              <Badge variant="secondary" className="text-xs">
                Best: {longestStreak}d
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
            <Calendar className="size-3.5" />
            <span>Joined {joinDate}</span>
          </div>
          {(user.githubUrl || user.twitterUrl || user.websiteUrl) && (
            <div className="flex items-center gap-3 mt-2">
              {user.githubUrl && (
                <a href={user.githubUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
                </a>
              )}
              {user.twitterUrl && (
                <a href={user.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
              )}
              {user.websiteUrl && (
                <a href={user.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Website">
                  <Globe className="size-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Usage */}
      <div className="animate-slide-up mb-6" style={{ animationDelay: '60ms' }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">USAGE</h2>
        <div className="border-2 border-foreground grid grid-cols-3 divide-x-2 divide-foreground">
          <StatCard label="Tokens" value={formatTokens(totalTokens)} />
          <StatCard label="Sessions" value={String(totalSessions)} />
          <StatCard label="Projects" value={String(totalProjects)} />
        </div>
      </div>

      {/* Token Breakdown */}
      <div className="animate-slide-up mb-6" style={{ animationDelay: '120ms' }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">TOKENS</h2>
        <div className="border-2 border-foreground grid grid-cols-2 sm:grid-cols-4 divide-x-2 divide-foreground">
          <StatCard label="Input" value={formatTokens(totalInput)} />
          <StatCard label="Output" value={formatTokens(totalOutput)} />
          <StatCard label="Cache Write" value={formatTokens(totalCacheCreation)} className="border-t-2 border-foreground sm:border-t-0" />
          <StatCard label="Cache Read" value={formatTokens(totalCacheRead)} className="border-t-2 border-foreground sm:border-t-0" />
        </div>
      </div>

      {/* Cost */}
      <div className="animate-slide-up mb-6" style={{ animationDelay: '180ms' }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">COST</h2>
        <div className="border-2 border-foreground grid grid-cols-3 divide-x-2 divide-foreground">
          <StatCard label="Today" value={`$${dailyCost.toFixed(2)}`} />
          <StatCard label="Last 7 days" value={`$${weeklyCost.toFixed(2)}`} />
          <StatCard label="Last 30 days" value={`$${monthlyCost.toFixed(2)}`} />
        </div>
      </div>

      {/* Code Output */}
      {(totalFilesTouched > 0 || totalLinesWritten > 0) && (
        <div className="animate-slide-up mb-8" style={{ animationDelay: '240ms' }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">CODE OUTPUT</h2>
          <div className={`border-2 border-foreground grid ${totalFilesTouched > 0 && totalLinesWritten > 0 ? 'grid-cols-2 divide-x-2 divide-foreground' : 'grid-cols-1'}`}>
            {totalFilesTouched > 0 && (
              <StatCard label="Files Touched" value={formatTokens(totalFilesTouched)} />
            )}
            {totalLinesWritten > 0 && (
              <StatCard label="Lines Written" value={formatTokens(totalLinesWritten)} />
            )}
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="animate-slide-up mb-8" style={{ animationDelay: '300ms' }}>
        <Heatmap days={heatmapData} />
      </div>

      {/* Charts */}
      <div className="animate-slide-up grid sm:grid-cols-2 gap-4 mb-8" style={{ animationDelay: '360ms' }}>
        {sortedModels.length > 0 && <ModelChart models={sortedModels} />}
        {sortedTools.length > 0 && <ToolChart tools={sortedTools} />}

        {stats.length > 0 && <DailyTrendChart stats={stats} />}
      </div>

      {/* Share section (only for claimed profiles) */}
      {shareUrl && (
        <div className="animate-slide-up border-2 border-foreground bg-card p-4 sm:p-6" style={{ animationDelay: '420ms' }}>
          <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase">Share your stats</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href={`/api/card/${user.username}.png`} target="_blank" rel="noopener noreferrer">
              <Button className="w-full sm:w-auto gap-2">
                <Download className="size-4" />
                Download Card
              </Button>
            </a>
            <CopyButton text={shareUrl} label="Copy Profile URL" className="gap-2" />
          </div>
        </div>
      )}
    </div>
  );
}

function DailyTrendChart({ stats }: { stats: DayStats[] }) {
  const last30 = stats.slice(-DAILY_TREND_DAYS);
  const maxDay = Math.max(...last30.map((d) => d.inputTokens + d.outputTokens), 1);
  return (
    <div className="border-2 border-foreground bg-card p-4 sm:p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        Daily tokens (last {DAILY_TREND_DAYS} days)
      </h3>
      <div className="flex items-end gap-px h-28">
        {last30.map((day, i) => {
          const tokens = day.inputTokens + day.outputTokens;
          const height = (tokens / maxDay) * 100;
          return (
            <div
              key={day.date}
              className="flex-1 bg-primary/70 hover:bg-primary min-h-[2px] transition-colors animate-grow-height"
              data-hover-guard=""
              style={{
                height: `${Math.max(height, 2)}%`,
                animationDelay: `${i * 10}ms`,
              }}
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
}
