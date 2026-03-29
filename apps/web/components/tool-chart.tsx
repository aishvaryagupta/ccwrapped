interface ToolChartProps {
  tools: Array<{ name: string; count: number; percentage: number }>;
}

export function ToolChart({ tools }: ToolChartProps) {
  return (
    <div
      className="border-2 border-foreground bg-card p-4 sm:p-6"
      role="img"
      aria-label="Tool usage breakdown chart"
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Tool Usage
      </h3>
      <div className="flex flex-col gap-3">
        {tools.map((tool, i) => (
          <div key={tool.name}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-foreground font-medium">{tool.name}</span>
              <span className="text-muted-foreground tabular-nums">{formatCount(tool.count)}</span>
            </div>
            <div className="h-2 bg-muted overflow-hidden">
              <div
                className="h-full animate-grow-width"
                style={{
                  width: `${Math.max(tool.percentage, 1)}%`,
                  opacity: 1 - i * 0.1,
                  backgroundColor: 'var(--color-foreground)',
                  animationDelay: `${i * 60}ms`,
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
