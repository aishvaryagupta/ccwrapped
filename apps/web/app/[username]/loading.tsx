export default function ProfileLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-gray-800" />
        <div>
          <div className="h-6 w-32 bg-gray-800 rounded mb-2" />
          <div className="h-4 w-24 bg-gray-800/60 rounded" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-lg p-6">
            <div className="h-8 w-20 bg-gray-800 rounded mb-2" />
            <div className="h-4 w-16 bg-gray-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Heatmap skeleton */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6">
        <div className="h-4 w-16 bg-gray-800 rounded mb-4" />
        <div className="flex flex-wrap gap-1">
          {[...Array(90)].map((_, i) => (
            <div key={i} className="w-3.5 h-3.5 rounded-sm bg-gray-800" />
          ))}
        </div>
      </div>

      {/* Model chart skeleton */}
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="h-4 w-16 bg-gray-800 rounded mb-4" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="mb-3">
            <div className="h-3 w-24 bg-gray-800/60 rounded mb-2" />
            <div className="h-2 bg-gray-800 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
