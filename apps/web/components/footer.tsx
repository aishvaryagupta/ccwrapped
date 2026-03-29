import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t-2 border-foreground mt-auto">
      <div className="max-w-[80ch] mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/"
            className="font-bold uppercase tracking-wider text-sm text-foreground hover:underline hover:underline-offset-4 hover:decoration-2 transition-colors"
          >
            CCWRAPPED
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/docs"
              className="uppercase tracking-wider font-bold text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4 hover:decoration-2 transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/leaderboard"
              className="uppercase tracking-wider font-bold text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4 hover:decoration-2 transition-colors"
            >
              Leaderboard
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
