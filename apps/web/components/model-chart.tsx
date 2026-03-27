interface ModelChartProps {
  models: Array<{ name: string; tokens: number; percentage: number }>;
}

export function ModelChart({ models }: ModelChartProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm" role="img" aria-label="Model usage breakdown chart">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Models</h3>
      <div className="space-y-3">
        {models.map((model, i) => {
          const shortName = model.name
            .replace(/^claude-/, '')
            .replace(/-\d{8,}$/, '');

          return (
            <div key={model.name} className="group">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground font-medium transition-colors duration-200 group-hover:text-primary">{shortName}</span>
                <span className="text-muted-foreground tabular-nums">{model.percentage}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bar-fill"
                  style={{
                    width: `${Math.max(model.percentage, 1)}%`,
                    opacity: 1 - i * 0.15,
                    backgroundColor: 'var(--color-primary)',
                    animationDelay: `${100 + i * 120}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
