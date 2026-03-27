import type { Metadata } from 'next';
import Link from 'next/link';
import { Trophy, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Trophy className="size-6 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold">Leaderboard</h1>
        </div>
        {entries.length > 0 && (
          <Badge variant="secondary" className="gap-1.5">
            <Users className="size-3.5" />
            {entries.length} developer{entries.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Period tabs */}
      <nav className="flex gap-1 mb-8 bg-muted rounded-lg p-1 w-fit" aria-label="Time period">
        {(['daily', 'weekly', 'monthly'] as const).map((p) => (
          <Link
            key={p}
            href={`/leaderboard?period=${p}`}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
              period === p
                ? 'bg-background text-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-current={period === p ? 'page' : undefined}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </Link>
        ))}
      </nav>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm" role="status">
          <Trophy className="size-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">No data yet</p>
          <p className="text-sm text-muted-foreground mb-6">
            Be the first on the board! Install the plugin and start coding.
          </p>
          <code className="inline-block bg-muted border border-border rounded-lg px-4 py-2 text-sm font-mono text-primary">
            /plugin install ccwrapped
          </code>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Developer leaderboard ranked by token usage — {periodLabels[period].toLowerCase()}
              </caption>
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left text-xs uppercase tracking-wider">
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
                      className={`border-b border-border/50 transition-colors hover:bg-accent/50 ${
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
                          className="flex items-center gap-3 hover:text-primary transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {entry.avatarUrl && (
                            <img
                              src={entry.avatarUrl}
                              alt=""
                              width={32}
                              height={32}
                              className={`rounded-full ${isTop3 ? 'ring-2 ring-primary/30' : ''}`}
                            />
                          )}
                          <span className={`font-medium ${isTop3 ? 'text-foreground' : ''}`}>
                            @{entry.username}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="hidden sm:block flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[120px]">
                            <div
                              className="h-full bg-primary/60 rounded-full"
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
        <code className="text-primary bg-muted border border-border rounded px-2 py-1 font-mono">
          /plugin install ccwrapped
        </code>
      </div>
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
