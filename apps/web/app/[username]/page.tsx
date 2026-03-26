import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CopyButton } from '@/components/copy-button';
import { Heatmap } from '@/components/heatmap';
import { ModelChart } from '@/components/model-chart';
import { StatCard } from '@/components/stat-card';
import { fetchUserProfile, fetchUserStats } from '@/lib/queries';

export const revalidate = 300;

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username} — devwrapped`,
    description: `Claude Code usage stats for @${username}`,
    openGraph: {
      title: `@${username} — devwrapped`,
      description: `Claude Code usage stats for @${username}`,
      images: [`/api/card/${username}.png`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `@${username} — devwrapped`,
      images: [`/api/card/${username}.png`],
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const user = await fetchUserProfile(username);
  if (!user) notFound();

  const stats = await fetchUserStats(user.id);

  // Aggregate totals
  let totalInput = 0;
  let totalOutput = 0;
  let totalSessions = 0;
  let totalProjects = 0;
  let totalCost = 0;
  const models = new Map<string, number>();

  for (const day of stats) {
    totalInput += day.inputTokens;
    totalOutput += day.outputTokens;
    totalSessions += day.sessionCount;
    totalProjects += day.projectCount;
    totalCost += day.costUsd;

    for (const mb of day.modelBreakdowns) {
      const t = mb.inputTokens + mb.outputTokens;
      models.set(mb.modelName, (models.get(mb.modelName) ?? 0) + t);
    }
  }

  const totalTokens = totalInput + totalOutput;
  const modelTotal = [...models.values()].reduce((s, v) => s + v, 0);
  const sortedModels = [...models.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, tokens]) => ({
      name,
      tokens,
      percentage: modelTotal > 0 ? Math.round((tokens / modelTotal) * 100) : 0,
    }));

  // Build heatmap (last 90 days)
  const now = new Date();
  const daysByDate = new Map(stats.map((d) => [d.date, d]));
  const heatmapData = Array.from({ length: 90 }, (_, i) => {
    const date = new Date(now.getTime() - (89 - i) * 86400_000)
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {user.avatarUrl && (
          <img
            src={user.avatarUrl}
            alt={user.githubLogin}
            width={64}
            height={64}
            className="rounded-full"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">@{user.githubLogin}</h1>
          <p className="text-sm text-gray-400">Joined {joinDate}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Tokens" value={formatTokens(totalTokens)} />
        <StatCard label="Sessions" value={String(totalSessions)} />
        <StatCard label="Projects" value={String(totalProjects)} />
        <StatCard label="Cost" value={`$${totalCost.toFixed(2)}`} />
      </div>

      {/* Heatmap */}
      <div className="mb-6">
        <Heatmap days={heatmapData} />
      </div>

      {/* Model breakdown */}
      {sortedModels.length > 0 && (
        <div className="mb-6">
          <ModelChart models={sortedModels} />
        </div>
      )}

      {/* Daily trend (simple bars) */}
      {stats.length > 0 && (() => {
        const last30 = stats.slice(-30);
        const maxDay = Math.max(
          ...last30.map((d) => d.inputTokens + d.outputTokens),
          1,
        );
        return (
          <div className="bg-gray-900 rounded-lg p-4 sm:p-6 mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-4">
              Daily tokens (last 30 days)
            </h3>
            <div className="flex items-end gap-px h-24">
              {last30.map((day) => {
                const tokens = day.inputTokens + day.outputTokens;
                const height = (tokens / maxDay) * 100;
                return (
                  <div
                    key={day.date}
                    className="flex-1 bg-violet-500/70 rounded-t-sm min-h-[2px]"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${day.date}: ${formatTokens(tokens)}`}
                  />
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3 text-sm">
        <a
          href={`/api/card/${user.githubLogin}.png`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-4 py-2 text-center transition-colors"
        >
          Download Card
        </a>
        <CopyButton text={`https://devwrapped.dev/@${user.githubLogin}`} />
      </div>
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
