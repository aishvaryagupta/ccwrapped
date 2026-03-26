import Link from 'next/link';

export default function UserNotFound() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-32 text-center">
      <h1 className="text-2xl font-bold text-gray-100 mb-4">User not found</h1>
      <p className="text-gray-400 mb-8">
        This user hasn't synced their stats yet, or the username is incorrect.
      </p>
      <div className="space-y-3">
        <p className="text-sm text-gray-500">
          Want your own profile? Install the plugin:
        </p>
        <code className="inline-block bg-gray-900 rounded-lg px-4 py-2 text-sm font-mono text-violet-300">
          /plugin install devwrapped
        </code>
      </div>
      <div className="mt-8">
        <Link
          href="/"
          className="text-violet-400 hover:text-violet-300 transition-colors text-sm"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
