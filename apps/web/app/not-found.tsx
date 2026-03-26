import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-32 text-center">
      <h1 className="text-6xl font-bold text-gray-600 mb-4">404</h1>
      <p className="text-xl text-gray-400 mb-8">Page not found</p>
      <Link
        href="/"
        className="text-violet-400 hover:text-violet-300 transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
