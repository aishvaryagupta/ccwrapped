import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatTokens } from '@ccwrapped/core';
import { fetchLeaderboard } from '@/lib/queries';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Leaderboard — ccwrapped',
  description: 'Top Claude Code users ranked by token usage.',
};

interface Props {
  searchParams: Promise<{ period?: string }>;
}

const MEDALS = ['🥇', '🥈', '🥉'] as const;

export default async function LeaderboardPage({ searchParams }: Props) {
  const { period: rawPeriod } = await searchParams;
  const period = (['daily', 'weekly', 'monthly'] as const).includes(
    rawPeriod as 'daily' | 'weekly' | 'monthly',
  )
    ? (rawPeriod as 'daily' | 'weekly' | 'monthly')
    : 'weekly';

  const entries = await fetchLeaderboard(period);

  const periodLabels: Record<string, string> = {
    daily: 'Today',
    weekly: 'This week',
    monthly: 'This month',
  };

  const maxTokens = entries.length > 0 ? entries[0].totalTokens : 1;

  return (
    <div className="max-w-[80ch] mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold uppercase">Leaderboard</h1>
        {entries.length > 0 && (
          <Badge variant="secondary" className="gap-1.5">
            <Users className="size-3.5" />
            {entries.length} developer{entries.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Period tabs */}
      <nav className="flex gap-0 mb-8 w-fit" aria-label="Time period">
        {(['daily', 'weekly', 'monthly'] as const).map((p) => (
          <Link
            key={p}
            href={`/leaderboard?period=${p}`}
            className={`px-4 py-2 text-sm font-medium border-2 border-foreground -ml-[2px] first:ml-0 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
              period === p
                ? 'bg-foreground text-background'
                : 'bg-background text-muted-foreground hover:text-foreground'
            }`}
            aria-current={period === p ? 'page' : undefined}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </Link>
        ))}
      </nav>

      {entries.length === 0 ? (
        <div className="border-2 border-foreground bg-card p-12 text-center" role="status">
          <p className="text-lg font-medium mb-2">No data yet</p>
          <p className="text-sm text-muted-foreground mb-6">
            Be the first on the board! Run one command and start coding.
          </p>
          <code className="inline-block bg-muted border-2 border-foreground px-4 py-2 text-sm font-mono text-primary">
            npx ccwrapdev
          </code>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="border-2 border-foreground bg-card overflow-hidden">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Developer leaderboard ranked by token usage — {periodLabels[period].toLowerCase()}
              </caption>
              <thead>
                <tr className="border-b-2 border-foreground text-muted-foreground text-left text-xs uppercase tracking-wider">
                  <th scope="col" className="px-4 py-3 w-16">Rank</th>
                  <th scope="col" className="px-4 py-3">User</th>
                  <th scope="col" className="px-4 py-3">
                    <span className="hidden sm:inline">Tokens</span>
                    <span className="sm:hidden">Usage</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right hidden sm:table-cell w-24">
                    Sessions
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const isTop3 = entry.rank <= 3;
                  const barWidth = maxTokens > 0 ? (entry.totalTokens / maxTokens) * 100 : 0;

                  return (
                    <tr
                      key={entry.username}
                      data-hover-guard=""
                      className={`border-b border-border transition-colors hover:bg-accent/50 ${
                        isTop3 ? 'bg-primary/[0.03]' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        {isTop3 ? (
                          <span className="text-lg" role="img" aria-label={`Rank ${entry.rank}`}>
                            {MEDALS[entry.rank - 1]}
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-mono tabular-nums">
                            {entry.rank}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/${entry.username}`}
                          className="flex items-center gap-3 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {entry.avatarUrl && (
                            <Image
                              src={entry.avatarUrl}
                              alt=""
                              width={32}
                              height={32}
                              className="border border-border"
                            />
                          )}
                          <span className={`font-medium ${isTop3 ? 'text-foreground' : ''}`}>
                            @{entry.username}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="hidden sm:block flex-1 h-1.5 bg-muted overflow-hidden max-w-[120px]">
                            <div
                              className="h-full bg-primary/60"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className="font-mono tabular-nums text-right min-w-[4rem]">
                            {formatTokens(entry.totalTokens)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right text-muted-foreground tabular-nums hidden sm:table-cell">
                        {entry.totalSessions}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-muted-foreground mt-4 text-center">
            {periodLabels[period]}
          </p>
        </>
      )}

      {/* CTA */}
      <div className="mt-10 text-center text-sm text-muted-foreground">
        Not on the board?{' '}
        <code className="text-primary bg-muted border-2 border-foreground px-2 py-1 font-mono">
          npx ccwrapdev
        </code>
      </div>
    </div>
  );
}
