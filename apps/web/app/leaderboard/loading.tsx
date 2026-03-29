export default function LeaderboardLoading() {
  return (
    <div className="max-w-[80ch] mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 w-48 bg-muted animate-pulse" />
        <div className="h-6 w-28 bg-muted animate-pulse" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-0 mb-8 w-fit">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-9 w-20 border-2 border-border -ml-[2px] first:ml-0 bg-muted/50 animate-pulse" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="border-2 border-border bg-card overflow-hidden">
        {/* Header row */}
        <div className="flex items-center gap-4 px-4 py-3 border-b-2 border-border">
          <div className="w-12 h-3 bg-muted/40 animate-pulse" />
          <div className="flex-1 h-3 bg-muted/40 w-12 animate-pulse" />
          <div className="h-3 w-16 bg-muted/40 animate-pulse" />
          <div className="h-3 w-16 bg-muted/40 hidden sm:block animate-pulse" />
        </div>

        {/* Data rows */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3.5 border-b border-border/50"
          >
            <div className="w-6 h-5 bg-muted animate-pulse" />
            <div className="size-8 bg-muted animate-pulse" />
            <div className="h-4 w-24 bg-muted flex-1 max-w-[8rem] animate-pulse" />
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden sm:block w-24 h-1.5 bg-muted animate-pulse" />
              <div className="h-4 w-14 bg-muted animate-pulse" />
            </div>
            <div className="h-4 w-8 bg-muted hidden sm:block animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
