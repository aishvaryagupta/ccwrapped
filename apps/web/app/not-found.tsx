import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-32 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground/40 mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">Page not found</p>
      <Link
        href="/"
        className="text-primary hover:text-primary/80 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        Back to home
      </Link>
    </div>
  );
}
