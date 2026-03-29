import { formatTokens } from '@ccwrapped/core';

interface HeatmapProps {
  days: Array<{ date: string; tokens: number }>;
}

export function Heatmap({ days }: HeatmapProps) {
  const maxTokens = Math.max(...days.map((d) => d.tokens), 1);

  return (
    <div
      className="border-2 border-foreground bg-card p-4 sm:p-6"
      role="img"
      aria-label="Activity heatmap showing daily token usage over the last 90 days"
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Activity
      </h3>
      <div className="flex flex-wrap gap-1">
        {days.map((day) => {
          const intensity = day.tokens / maxTokens;
          const level =
            day.tokens === 0
              ? 'bg-muted'
              : intensity < 0.25
                ? 'bg-foreground/20'
                : intensity < 0.5
                  ? 'bg-foreground/40'
                  : intensity < 0.75
                    ? 'bg-foreground/65'
                    : 'bg-foreground';

          return (
            <div
              key={day.date}
              className={`size-3 sm:size-3.5 ${level}`}
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
