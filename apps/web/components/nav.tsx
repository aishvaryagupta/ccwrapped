import Link from 'next/link';

export function Nav() {
  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-violet-400">
          devwrapped
        </Link>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <Link href="/leaderboard" className="hover:text-gray-100 transition-colors">
            Leaderboard
          </Link>
        </div>
      </div>
    </nav>
  );
}
