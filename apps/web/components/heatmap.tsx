interface HeatmapProps {
  days: Array<{ date: string; tokens: number }>;
}

export function Heatmap({ days }: HeatmapProps) {
  const maxTokens = Math.max(...days.map((d) => d.tokens), 1);

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm" role="img" aria-label="Activity heatmap showing daily token usage over the last 90 days">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Activity</h3>
      <div className="flex flex-wrap gap-1">
        {days.map((day) => {
          const intensity = day.tokens / maxTokens;
          const level =
            day.tokens === 0
              ? 'bg-muted'
              : intensity < 0.25
                ? 'bg-primary/20'
                : intensity < 0.5
                  ? 'bg-primary/40'
                  : intensity < 0.75
                    ? 'bg-primary/65'
                    : 'bg-primary';

          return (
            <div
              key={day.date}
              className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm heatmap-cell ${level}`}
              title={`${day.date}: ${formatTokens(day.tokens)} tokens`}
              role="presentation"
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
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
