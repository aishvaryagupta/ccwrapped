'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-32 text-center">
      <h1 className="text-2xl font-bold text-gray-100 mb-4">
        Something went wrong
      </h1>
      <p className="text-gray-400 mb-8">
        We couldn't load this page. Please try again.
      </p>
      <button
        onClick={reset}
        className="bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-6 py-2 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
