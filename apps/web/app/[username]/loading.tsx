export default function ProfileLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Header skeleton */}
      <div className="flex items-center gap-5 mb-10 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-muted animate-pulse" />
        <div>
          <div className="h-7 w-36 bg-muted rounded-md mb-2 animate-pulse" />
          <div className="h-4 w-24 bg-muted/60 rounded animate-pulse" />
        </div>
      </div>

      {/* Stats skeleton — staggered entrance */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-6 animate-slide-up"
            style={{ animationDelay: `${50 + i * 50}ms` }}
          >
            <div className="h-8 w-20 bg-muted rounded-md mb-2" />
            <div className="h-4 w-16 bg-muted/60 rounded" />
          </div>
        ))}
      </div>

      {/* Heatmap skeleton */}
      <div className="rounded-xl border border-border bg-card p-6 mb-8 animate-slide-up animation-delay-300">
        <div className="h-4 w-16 bg-muted rounded mb-4" />
        <div className="flex flex-wrap gap-1">
          {[...Array(90)].map((_, i) => (
            <div
              key={i}
              className="w-3.5 h-3.5 rounded-sm bg-muted animate-pulse"
              style={{ animationDelay: `${(i % 15) * 40}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Two-column skeleton */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-6 animate-slide-up animation-delay-400">
          <div className="h-4 w-16 bg-muted rounded mb-4" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-3">
              <div className="h-3 w-24 bg-muted/60 rounded mb-2" />
              <div className="h-2 bg-muted rounded-full" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: '450ms' }}>
          <div className="h-4 w-32 bg-muted rounded mb-4" />
          <div className="flex items-end gap-px h-28">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-muted rounded-t-sm animate-pulse"
                style={{
                  height: `${20 + Math.random() * 60}%`,
                  animationDelay: `${i * 30}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
