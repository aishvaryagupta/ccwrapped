import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Hero */}
      <section className="py-20 sm:py-32 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
          Your Claude Code stats.
          <br />
          <span className="text-violet-400">Visualized. Shared. Ranked.</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
          See how much you ship with AI. Install once, auto-sync forever.
          Get a beautiful card to share.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <code className="bg-gray-900 border border-gray-700 rounded-lg px-6 py-3 text-sm font-mono text-violet-300">
            /plugin install devwrapped
          </code>
          <Link
            href="/leaderboard"
            className="text-sm text-gray-400 hover:text-gray-100 transition-colors"
          >
            View Leaderboard →
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 border-t border-gray-800">
        <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          <Step
            number="1"
            title="Install the plugin"
            description="Two commands inside Claude Code. That's it. One-time setup, auto-syncs forever."
          />
          <Step
            number="2"
            title="Use Claude Code normally"
            description="Every session, the plugin silently syncs your token totals. No code or chats leave your machine."
          />
          <Step
            number="3"
            title="Share your card"
            description="Open your profile, copy the card URL, and share it on Twitter. Others see it and install too."
          />
        </div>
      </section>

      {/* Privacy */}
      <section className="py-16 border-t border-gray-800">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Privacy first</h2>
          <p className="text-gray-400">
            Only daily token totals leave your machine. No code, no chats, no
            file paths, no project names. Ever.
          </p>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <PrivacyItem label="Uploaded" items={['Token counts', 'Session count', 'Model split']} />
            <PrivacyItem
              label="Never uploaded"
              items={['Your code', 'Your chats', 'File paths']}
              negative
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-gray-800 text-center">
        <h2 className="text-2xl font-bold mb-4">Get started in 30 seconds</h2>
        <div className="space-y-3 text-sm font-mono text-gray-300 max-w-md mx-auto text-left bg-gray-900 rounded-lg p-6">
          <p className="text-gray-500"># Inside Claude Code</p>
          <p>
            <span className="text-violet-400">$</span> /plugin marketplace add
            devwrapped-org/devwrapped-plugin
          </p>
          <p>
            <span className="text-violet-400">$</span> /plugin install devwrapped
          </p>
          <p className="text-gray-500 mt-4"># Or try the CLI first</p>
          <p>
            <span className="text-violet-400">$</span> npx devwrapped
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-800 text-center text-sm text-gray-500">
        devwrapped — A Fitbit for your AI coding.
      </footer>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center mx-auto mb-4">
        {number}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}

function PrivacyItem({
  label,
  items,
  negative,
}: {
  label: string;
  items: string[];
  negative?: boolean;
}) {
  return (
    <div className="col-span-2 sm:col-span-2">
      <div
        className={`text-xs font-medium uppercase tracking-wider mb-2 ${negative ? 'text-red-400' : 'text-green-400'}`}
      >
        {label}
      </div>
      <ul className="text-gray-400 text-sm space-y-1">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
