export default function LeaderboardLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div className="h-8 w-48 bg-muted rounded-md" />
        <div className="h-6 w-28 bg-muted rounded-full" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-1 mb-8 bg-muted rounded-lg p-1 w-fit animate-fade-in animation-delay-50">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-9 w-20 bg-background/50 rounded-md" />
        ))}
      </div>

      {/* Table skeleton — staggered rows (50ms between items) */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        {/* Header row */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-border animate-fade-in animation-delay-100">
          <div className="w-12 h-3 bg-muted/40 rounded" />
          <div className="flex-1 h-3 bg-muted/40 rounded w-12" />
          <div className="h-3 w-16 bg-muted/40 rounded" />
          <div className="h-3 w-16 bg-muted/40 rounded hidden sm:block" />
        </div>

        {/* Data rows */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3.5 border-b border-border/50 animate-slide-up"
            style={{ animationDelay: `${150 + i * 50}ms` }}
          >
            <div className="w-6 h-5 bg-muted rounded" />
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="h-4 w-24 bg-muted rounded flex-1 max-w-[8rem]" />
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden sm:block w-24 h-1.5 bg-muted rounded-full" />
              <div className="h-4 w-14 bg-muted rounded" />
            </div>
            <div className="h-4 w-8 bg-muted rounded hidden sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
