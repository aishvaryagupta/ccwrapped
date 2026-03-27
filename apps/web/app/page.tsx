import Link from 'next/link';
import { Terminal, Zap, Share2, ShieldCheck, ShieldX, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Hero */}
      <section className="py-24 sm:py-36 text-center relative" aria-labelledby="hero-heading">
        {/* Subtle radial glow behind hero */}
        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <h1
          id="hero-heading"
          className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1] animate-fade-in"
        >
          Your Claude Code stats.
          <br />
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Visualized. Shared. Ranked.
          </span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in animation-delay-100">
          See how much you ship with AI. Install once, auto-sync forever.
          Get a beautiful card to share.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in animation-delay-200">
          <code className="bg-card border border-border rounded-lg px-6 py-3 text-sm font-mono text-primary select-all">
            /plugin install ccwrapped
          </code>
          <Link href="/leaderboard">
            <Button variant="ghost" className="gap-2 text-muted-foreground">
              View Leaderboard
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t border-border" aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-2xl sm:text-3xl font-bold text-center mb-14">
          How it works
        </h2>
        <ol className="grid sm:grid-cols-3 gap-6 sm:gap-8" role="list">
          <Step
            icon={<Terminal className="size-5" />}
            number="1"
            title="Install the plugin"
            description="Two commands inside Claude Code. That's it. One-time setup, auto-syncs forever."
          />
          <Step
            icon={<Zap className="size-5" />}
            number="2"
            title="Use Claude Code normally"
            description="Every session, the plugin silently syncs your token totals. No code or chats leave your machine."
          />
          <Step
            icon={<Share2 className="size-5" />}
            number="3"
            title="Share your card"
            description="Open your profile, copy the card URL, and share it on Twitter. Others see it and install too."
          />
        </ol>
      </section>

      {/* Privacy */}
      <section className="py-20 border-t border-border" aria-labelledby="privacy-heading">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 id="privacy-heading" className="text-2xl sm:text-3xl font-bold mb-4">Privacy first</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Only daily token totals leave your machine. No code, no chats, no
              file paths, no project names. Ever.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <PrivacyCard
              icon={<ShieldCheck className="size-5 text-green-400" />}
              title="What we collect"
              items={['Daily token counts', 'Session count', 'Model split', 'Cost estimate']}
              variant="positive"
            />
            <PrivacyCard
              icon={<ShieldX className="size-5 text-destructive" />}
              title="What we never see"
              items={['Your code', 'Your conversations', 'File paths', 'Project names']}
              variant="negative"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border text-center" aria-labelledby="cta-heading">
        <h2 id="cta-heading" className="text-2xl sm:text-3xl font-bold mb-2">
          Get started in 30 seconds
        </h2>
        <p className="text-muted-foreground mb-8">
          Run these commands inside Claude Code and you're done.
        </p>
        <div className="space-y-3 text-sm font-mono text-muted-foreground max-w-md mx-auto text-left bg-card border border-border rounded-xl p-6 shadow-sm" role="region" aria-label="Installation commands">
          <p className="text-muted-foreground"># Inside Claude Code</p>
          <p className="text-foreground">
            <span className="text-primary" aria-hidden="true">$</span> /plugin marketplace add
            ccwrapped-org/ccwrapped-plugin
          </p>
          <p className="text-foreground">
            <span className="text-primary" aria-hidden="true">$</span> /plugin install ccwrapped
          </p>
          <div className="border-t border-border my-4" />
          <p className="text-muted-foreground"># Or try the CLI first</p>
          <p className="text-foreground">
            <span className="text-primary" aria-hidden="true">$</span> npx ccwrapped
          </p>
        </div>
      </section>
    </div>
  );
}

function Step({
  icon,
  number,
  title,
  description,
}: {
  icon: React.ReactNode;
  number: string;
  title: string;
  description: string;
}) {
  return (
    <li className="list-none rounded-xl border border-border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md">
      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4" aria-hidden="true">
        {icon}
      </div>
      <div className="text-xs font-medium text-muted-foreground mb-1">Step {number}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </li>
  );
}

function PrivacyCard({
  icon,
  title,
  items,
  variant,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  variant: 'positive' | 'negative';
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <ul className="space-y-2" aria-label={title}>
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span
              className={`text-xs ${variant === 'positive' ? 'text-green-400' : 'text-destructive'}`}
              aria-hidden="true"
            >
              {variant === 'positive' ? '✓' : '✗'}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
