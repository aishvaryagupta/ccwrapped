import Link from 'next/link';
import { GitHubIcon } from '@/components/icons';

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link
              href="/"
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              ccwrapped
            </Link>
            <span className="hidden sm:inline" aria-hidden="true">&middot;</span>
            <span className="hidden sm:inline">A Fitbit for your AI coding</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link
              href="/leaderboard"
              className="hover:text-foreground transition-colors"
            >
              Leaderboard
            </Link>
            <a
              href="https://github.com/ccwrapped"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <GitHubIcon className="size-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
