interface HeatmapProps {
  days: Array<{ date: string; tokens: number }>;
}

export function Heatmap({ days }: HeatmapProps) {
  const maxTokens = Math.max(...days.map((d) => d.tokens), 1);

  return (
    <div className="bg-gray-900 rounded-lg p-4 sm:p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Activity</h3>
      <div className="flex flex-wrap gap-1">
        {days.map((day) => {
          const intensity = day.tokens / maxTokens;
          const level =
            day.tokens === 0
              ? 'bg-gray-800'
              : intensity < 0.25
                ? 'bg-violet-900/60'
                : intensity < 0.5
                  ? 'bg-violet-700/70'
                  : intensity < 0.75
                    ? 'bg-violet-500/80'
                    : 'bg-violet-400';

          return (
            <div
              key={day.date}
              className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm ${level}`}
              title={`${day.date}: ${formatTokens(day.tokens)} tokens`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>{days[0]?.date ?? ''}</span>
        <span>{days[days.length - 1]?.date ?? ''}</span>
      </div>
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
