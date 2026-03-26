interface ModelChartProps {
  models: Array<{ name: string; tokens: number; percentage: number }>;
}

export function ModelChart({ models }: ModelChartProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-4 sm:p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Models</h3>
      <div className="space-y-3">
        {models.map((model) => {
          const shortName = model.name
            .replace(/^claude-/, '')
            .replace(/-\d{8,}$/, '');

          return (
            <div key={model.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">{shortName}</span>
                <span className="text-gray-500">{model.percentage}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all"
                  style={{ width: `${Math.max(model.percentage, 1)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
