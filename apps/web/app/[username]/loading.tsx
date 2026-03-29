export default function ProfileLoading() {
  return (
    <div className="max-w-[80ch] mx-auto px-4 py-8 sm:py-12">
      {/* Header skeleton */}
      <div className="flex items-center gap-5 mb-10">
        <div className="size-20 bg-muted animate-pulse" />
        <div>
          <div className="h-7 w-36 bg-muted mb-2 animate-pulse" />
          <div className="h-4 w-24 bg-muted/60 animate-pulse" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="border-2 border-border bg-card p-6"
          >
            <div className="h-8 w-20 bg-muted mb-2 animate-pulse" />
            <div className="h-4 w-16 bg-muted/60 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Heatmap skeleton */}
      <div className="border-2 border-border bg-card p-6 mb-8">
        <div className="h-4 w-16 bg-muted mb-4 animate-pulse" />
        <div className="flex flex-wrap gap-1">
          {[...Array(90)].map((_, i) => (
            <div
              key={i}
              className="w-3.5 h-3.5 bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Two-column skeleton */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="border-2 border-border bg-card p-6">
          <div className="h-4 w-16 bg-muted mb-4 animate-pulse" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-3">
              <div className="h-3 w-24 bg-muted/60 mb-2 animate-pulse" />
              <div className="h-2 bg-muted animate-pulse" />
            </div>
          ))}
        </div>
        <div className="border-2 border-border bg-card p-6">
          <div className="h-4 w-32 bg-muted mb-4 animate-pulse" />
          <div className="flex items-end gap-px h-28">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-muted animate-pulse"
                style={{
                  height: `${20 + Math.random() * 60}%`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
