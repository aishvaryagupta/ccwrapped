import Link from 'next/link';

export default function UserNotFound() {
  return (
    <div className="max-w-[80ch] mx-auto px-4 py-32 text-center">
      <h1 className="text-2xl font-bold mb-4 uppercase">User not found</h1>
      <p className="text-muted-foreground mb-8">
        This user hasn't synced their stats yet, or the username is incorrect.
      </p>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Want your own profile? Install the plugin:
        </p>
        <code className="inline-block bg-card border-2 border-foreground px-4 py-2 text-sm font-mono text-primary">
          /plugin install ccwrapped@ccwrapped-marketplace
        </code>
      </div>
      <div className="mt-8">
        <Link
          href="/"
          className="text-primary hover:text-primary/80 transition-colors text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
