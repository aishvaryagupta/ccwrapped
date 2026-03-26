import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchLeaderboard } from '@/lib/queries';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Leaderboard — devwrapped',
  description: 'Top Claude Code users ranked by token usage.',
};

interface Props {
  searchParams: Promise<{ period?: string }>;
}

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>

      {/* Period tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 rounded-lg p-1 w-fit">
        {(['daily', 'weekly', 'monthly'] as const).map((p) => (
          <Link
            key={p}
            href={`/leaderboard?period=${p}`}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              period === p
                ? 'bg-violet-600 text-white'
                : 'text-gray-400 hover:text-gray-100'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </Link>
        ))}
      </div>

      <p className="text-sm text-gray-400 mb-4">{periodLabels[period]}</p>

      {entries.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">No data yet</p>
          <p className="text-sm">Be the first on the board!</p>
          <code className="mt-4 inline-block bg-gray-900 rounded-lg px-4 py-2 text-sm font-mono text-violet-300">
            /plugin install devwrapped
          </code>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-left">
                  <th className="px-4 py-3 w-12">#</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3 text-right">Tokens</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">
                    Sessions
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.githubLogin}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-500 font-mono">
                      {entry.rank}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/${entry.githubLogin}`}
                        className="flex items-center gap-3 hover:text-violet-400 transition-colors"
                      >
                        {entry.avatarUrl && (
                          <img
                            src={entry.avatarUrl}
                            alt=""
                            width={28}
                            height={28}
                            className="rounded-full"
                          />
                        )}
                        <span className="font-medium">
                          @{entry.githubLogin}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatTokens(entry.totalTokens)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 hidden sm:table-cell">
                      {entry.totalSessions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-gray-500 mt-4 text-center">
            {entries.length} developers ranked {periodLabels[period].toLowerCase()}
          </p>
        </>
      )}

      {/* CTA */}
      <div className="mt-8 text-center text-sm text-gray-500">
        Not on the board?{' '}
        <code className="text-violet-300 bg-gray-900 rounded px-2 py-1">
          /plugin install devwrapped
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
