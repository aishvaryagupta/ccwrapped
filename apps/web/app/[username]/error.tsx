'use client';

import Link from 'next/link';

export default function ProfileError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-[80ch] mx-auto px-4 py-32 text-center">
      <h1 className="text-2xl font-bold mb-4 uppercase">
        Could not load this profile
      </h1>
      <p className="text-muted-foreground mb-8">
        Something went wrong while fetching the stats. This might be a temporary issue.
      </p>
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center border-2 border-foreground bg-primary text-primary-foreground px-6 py-2 text-sm font-medium transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center border-2 border-foreground bg-background px-6 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
