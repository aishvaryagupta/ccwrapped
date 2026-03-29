interface ModelChartProps {
  models: Array<{ name: string; tokens: number; percentage: number }>;
}

export function ModelChart({ models }: ModelChartProps) {
  return (
    <div
      className="border-2 border-foreground bg-card p-4 sm:p-6"
      role="img"
      aria-label="Model usage breakdown chart"
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Models
      </h3>
      <div className="flex flex-col gap-3">
        {models.map((model, i) => {
          const shortName = model.name
            .replace(/^claude-/, '')
            .replace(/-\d{8,}$/, '');

          return (
            <div key={model.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground font-medium">{shortName}</span>
                <span className="text-muted-foreground tabular-nums">{model.percentage}%</span>
              </div>
              <div className="h-2 bg-muted overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.max(model.percentage, 1)}%`,
                    opacity: 1 - i * 0.15,
                    backgroundColor: 'var(--color-foreground)',
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
