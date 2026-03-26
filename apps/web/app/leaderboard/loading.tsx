export default function LeaderboardLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-7 w-32 bg-gray-800 rounded mb-6" />

      {/* Tabs skeleton */}
      <div className="flex gap-1 mb-6 bg-gray-900 rounded-lg p-1 w-fit">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-9 w-20 bg-gray-800 rounded-md" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 border-b border-gray-800/50"
          >
            <div className="w-6 h-4 bg-gray-800 rounded" />
            <div className="w-7 h-7 rounded-full bg-gray-800" />
            <div className="h-4 w-24 bg-gray-800 rounded" />
            <div className="ml-auto h-4 w-16 bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
