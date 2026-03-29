import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Docs',
  description:
    'Getting started with ccwrapped — setup, commands, auto-sync, privacy, and troubleshooting.',
};

const TOC = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'commands', label: 'Commands Reference' },
  { id: 'auto-sync', label: 'Auto-Sync Setup' },
  { id: 'privacy', label: 'Privacy & Security' },
  { id: 'local-stats', label: 'Local Stats' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
] as const;

const COMMANDS = [
  { cmd: 'npx ccwrapdev', purpose: 'Scan + sync stats (no auth needed)', auth: false },
  { cmd: 'npx ccwrapdev --local', purpose: 'View local stats (offline)', auth: false },
  { cmd: 'npx ccwrapdev sync', purpose: 'Manual sync to ccwrapped.dev', auth: false },
  { cmd: 'npx ccwrapdev sync --minimal', purpose: 'Sync without model data', auth: false },
  { cmd: 'npx ccwrapdev setup', purpose: 'Enable auto-sync hook', auth: false },
  { cmd: 'npx ccwrapdev setup --check', purpose: 'Check auto-sync status', auth: false },
  { cmd: 'npx ccwrapdev setup --remove', purpose: 'Disable auto-sync hook', auth: false },
  { cmd: 'npx ccwrapdev card', purpose: 'Open profile in browser', auth: false },
  { cmd: 'npx ccwrapdev card --copy', purpose: 'Copy profile URL to clipboard', auth: false },
  { cmd: 'npx ccwrapdev status', purpose: 'Show config overview', auth: false },
  { cmd: 'npx ccwrapdev auth --logout', purpose: 'Clear stored auth credentials', auth: false },
] as const;

const FAQ = [
  {
    q: 'No Claude Code logs found',
    a: 'ccwrapped looks in ~/.config/claude/projects/ and ~/.claude/projects/ for session transcripts. Make sure you have used Claude Code at least once. If your config is in a custom location, set the CLAUDE_CONFIG_DIR environment variable.',
  },
  {
    q: 'I have the plugin AND the auto-sync hook',
    a: 'That\'s fine. Both can coexist safely. Each sync checks if the session was already uploaded, so you\'ll never get duplicate data.',
  },
  {
    q: 'How do I use the plugin instead?',
    a: 'Inside Claude Code, run: /plugin marketplace add https://github.com/aishvaryagupta/ccwrapped-plugin.git then /plugin install ccwrapped@ccwrapped-marketplace. Then authenticate with npx ccwrapdev auth.',
  },
  {
    q: 'I use multiple machines',
    a: 'ccwrapped detects when a sync comes from a different machine and shows a warning. Both machines can sync to the same profile — data is merged by date.',
  },
  {
    q: 'Auto-sync stopped working',
    a: 'Run npx ccwrapdev setup --check to verify the hook is installed. Then run npx ccwrapdev status to check your auth and last sync time. If your token expired, run npx ccwrapdev auth.',
  },
  {
    q: 'How do I remove my credentials?',
    a: 'Run npx ccwrapdev auth --logout to clear all stored tokens from this machine. To also remove the auto-sync hook, run npx ccwrapdev setup --remove.',
  },
] as const;

export default function DocsPage() {
  return (
    <div className="max-w-[80ch] mx-auto px-4 py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight mb-10">
        Documentation
      </h1>

      {/* Table of contents */}
      <nav className="border-2 border-foreground bg-card p-6 mb-14" aria-label="Table of contents">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          On this page
        </h2>
        <ol className="flex flex-col gap-2 text-sm">
          {TOC.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="text-primary hover:underline underline-offset-4 decoration-2 transition-colors"
              >
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* Getting Started */}
      <section id="getting-started" className="scroll-mt-16 mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold uppercase mb-6">Getting Started</h2>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          One command. No sign-up. No auth. Run it in your terminal.
        </p>
        <CodeBlock>npx ccwrapdev</CodeBlock>
        <p className="text-muted-foreground mt-6 mb-4 leading-relaxed">
          Here's what happens when you run it for the first time:
        </p>
        <ol className="flex flex-col gap-3">
          <NumberedStep n={1} title="Your stats are scanned">
            ccwrapped reads your local Claude Code logs and shows a summary
            (tokens, cost, sessions) in the terminal.
          </NumberedStep>
          <NumberedStep n={2} title="Stats are synced">
            Daily totals are uploaded to ccwrapped.dev. No account needed —
            you get an anonymous profile URL instantly.
          </NumberedStep>
          <NumberedStep n={3} title="Your profile opens in the browser">
            See your stats visualized on the web. Heatmap, model breakdown,
            cost charts — all there.
          </NumberedStep>
          <NumberedStep n={4} title="Auto-sync is enabled">
            You're asked &quot;Set up auto-sync? (Y/n)&quot;. Press Enter. From now
            on, stats sync automatically after every Claude Code session.
          </NumberedStep>
          <NumberedStep n={5} title="Claim a username (optional)">
            Visit your profile and click &quot;Claim with Google&quot; to get a
            custom URL like ccwrapped.dev/alice.
          </NumberedStep>
        </ol>
        <p className="text-muted-foreground mt-6 text-sm leading-relaxed">
          That's it. You never need to run this again — auto-sync handles everything.
        </p>
      </section>

      {/* Commands Reference */}
      <section id="commands" className="scroll-mt-16 border-t-2 border-foreground pt-14 mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold uppercase mb-6">Commands Reference</h2>
        <div className="border-2 border-foreground bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-foreground text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Command</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3 hidden sm:table-cell">Auth?</th>
              </tr>
            </thead>
            <tbody>
              {COMMANDS.map(({ cmd, purpose, auth }) => (
                <tr key={cmd} className="border-b border-foreground/10 last:border-b-0">
                  <td className="px-4 py-3 font-mono text-primary whitespace-nowrap">{cmd}</td>
                  <td className="px-4 py-3 text-muted-foreground">{purpose}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                    {auth ? 'Yes' : 'No'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Auto-Sync Setup */}
      <section id="auto-sync" className="scroll-mt-16 border-t-2 border-foreground pt-14 mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold uppercase mb-6">Auto-Sync Setup</h2>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          Auto-sync adds a hook to <code className="text-primary">~/.claude/settings.json</code> that
          runs after every Claude Code session. Your stats are uploaded silently in the background.
        </p>

        <h3 className="font-semibold uppercase text-sm mb-3 mt-8">Enable auto-sync</h3>
        <CodeBlock>npx ccwrapdev setup</CodeBlock>

        <h3 className="font-semibold uppercase text-sm mb-3 mt-8">Check status</h3>
        <CodeBlock>npx ccwrapdev setup --check</CodeBlock>

        <h3 className="font-semibold uppercase text-sm mb-3 mt-8">Remove auto-sync</h3>
        <CodeBlock>npx ccwrapdev setup --remove</CodeBlock>

        <p className="text-muted-foreground mt-6 text-sm leading-relaxed">
          If you used <code className="text-primary">npx ccwrapdev</code> for the first time and accepted
          the auto-sync prompt, it's already enabled. You can verify
          with <code className="text-primary">npx ccwrapdev setup --check</code>.
        </p>
      </section>

      {/* Privacy & Security */}
      <section id="privacy" className="scroll-mt-16 border-t-2 border-foreground pt-14 mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold uppercase mb-6">Privacy & Security</h2>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          ccwrapped reads your Claude Code logs locally, aggregates daily totals, and uploads
          only the summary. Your code, conversations, and file paths never leave your machine.
        </p>
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div className="border-2 border-foreground bg-card p-6">
            <h3 className="font-semibold mb-4 uppercase">What we collect</h3>
            <ul className="flex flex-col gap-2" aria-label="What we collect">
              {['Daily token counts', 'Session count', 'Model split', 'Cost estimate'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-xs text-green-400" aria-hidden="true">&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-2 border-foreground bg-card p-6">
            <h3 className="font-semibold mb-4 uppercase">What we never see</h3>
            <ul className="flex flex-col gap-2" aria-label="What we never see">
              {['Your code', 'Your conversations', 'File paths', 'Project names'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-xs text-destructive" aria-hidden="true">&#10007;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          For maximum privacy, use <code className="text-primary">npx ccwrapdev sync --minimal</code> to
          upload only token counts — no model names, no session counts, no project counts.
        </p>
      </section>

      {/* Local Stats */}
      <section id="local-stats" className="scroll-mt-16 border-t-2 border-foreground pt-14 mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold uppercase mb-6">Local Stats</h2>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          View your Claude Code stats without uploading anything. Works offline, no authentication required.
        </p>
        <CodeBlock>npx ccwrapdev --local</CodeBlock>
        <p className="text-muted-foreground mt-6 text-sm leading-relaxed">
          Shows a table with token counts and cost for today, last 7 days, and all time.
          Also shows your model usage breakdown with percentages. No data leaves your machine.
        </p>
      </section>

      {/* Troubleshooting */}
      <section id="troubleshooting" className="scroll-mt-16 border-t-2 border-foreground pt-14 mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold uppercase mb-6">Troubleshooting</h2>
        <div className="flex flex-col gap-4">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="border-2 border-foreground bg-card p-6">
              <h3 className="font-semibold mb-2 uppercase text-sm">{q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t-2 border-foreground pt-14 text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 uppercase">Ready to get started?</h2>
        <code className="inline-block bg-card border-2 border-foreground px-6 py-3 text-sm font-mono text-primary select-all">
          npx ccwrapdev
        </code>
        <p className="mt-6 text-sm text-muted-foreground">
          Questions? Check the{' '}
          <Link
            href="https://github.com/aishvaryagupta/ccwrapped"
            className="text-primary hover:underline underline-offset-4 decoration-2 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub repo
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="bg-card border-2 border-foreground p-4 font-mono text-sm">
      <span className="text-primary" aria-hidden="true">$ </span>
      <span className="text-foreground select-all">{children}</span>
    </div>
  );
}

function NumberedStep({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4 border-2 border-foreground bg-card p-4">
      <span className="text-xl font-bold font-mono text-primary shrink-0" aria-hidden="true">
        {n}.
      </span>
      <div>
        <h3 className="font-semibold uppercase text-sm mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
      </div>
    </li>
  );
}
