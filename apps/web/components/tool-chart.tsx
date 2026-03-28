interface ToolChartProps {
  tools: Array<{ name: string; count: number; percentage: number }>;
}

export function ToolChart({ tools }: ToolChartProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm" role="img" aria-label="Tool usage breakdown chart">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Tool Usage</h3>
      <div className="space-y-3">
        {tools.map((tool, i) => (
          <div key={tool.name} className="group">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-foreground font-medium transition-colors duration-200 group-hover:text-primary">{tool.name}</span>
              <span className="text-muted-foreground tabular-nums">{formatCount(tool.count)}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bar-fill"
                style={{
                  width: `${Math.max(tool.percentage, 1)}%`,
                  opacity: 1 - i * 0.1,
                  backgroundColor: 'var(--color-primary)',
                  animationDelay: `${100 + i * 120}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
