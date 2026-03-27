'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-32 text-center">
      <h1 className="text-2xl font-bold mb-4">
        Something went wrong
      </h1>
      <p className="text-muted-foreground mb-8">
        We couldn't load this page. Please try again.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2 text-sm font-medium shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        Try again
      </button>
    </div>
  );
}
