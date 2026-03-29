import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="max-w-[80ch] mx-auto px-4">
      {/* Hero */}
      <section className="py-24 sm:py-36 text-center" aria-labelledby="hero-heading">
        <h1
          id="hero-heading"
          className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1] uppercase"
        >
          Your Claude Code stats.
          <br />
          Visualized. Shared. Ranked.
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          See how much you ship with AI. One command. No sign-up.
          Auto-sync forever. Get a beautiful card to share.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <code className="bg-card border-2 border-foreground px-6 py-3 text-sm font-mono text-primary select-all">
            npx ccwrapdev
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
      <section className="py-20 border-t-2 border-foreground" aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-2xl sm:text-3xl font-bold text-center mb-14 uppercase">
          How it works
        </h2>
        <ol className="grid sm:grid-cols-3 gap-6 sm:gap-8" role="list">
          <Step
            number="1"
            title="Run one command"
            description="Run npx ccwrapdev in your terminal. No sign-up, no auth. Your stats sync instantly."
          />
          <Step
            number="2"
            title="Use Claude Code normally"
            description="Every session, your stats auto-sync in the background. No code or chats leave your machine."
          />
          <Step
            number="3"
            title="Share your card"
            description="Open your profile, copy the card URL, and share it on Twitter. Others see it and install too."
          />
        </ol>
      </section>

      {/* Privacy */}
      <section className="py-20 border-t-2 border-foreground" aria-labelledby="privacy-heading">
        <div className="max-w-[80ch] mx-auto">
          <div className="text-center mb-10">
            <h2 id="privacy-heading" className="text-2xl sm:text-3xl font-bold mb-4 uppercase">Privacy first</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Only daily token totals leave your machine. No code, no chats, no
              file paths, no project names. Ever.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <PrivacyCard
              title="What we collect"
              items={['Daily token counts', 'Session count', 'Model split', 'Cost estimate']}
              variant="positive"
            />
            <PrivacyCard
              title="What we never see"
              items={['Your code', 'Your conversations', 'File paths', 'Project names']}
              variant="negative"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t-2 border-foreground text-center" aria-labelledby="cta-heading">
        <h2 id="cta-heading" className="text-2xl sm:text-3xl font-bold mb-2 uppercase">
          Get started in 30 seconds
        </h2>
        <p className="text-muted-foreground mb-8">
          Run this in your terminal and you're done.
        </p>
        <div className="flex flex-col gap-3 text-sm font-mono text-muted-foreground max-w-md mx-auto text-left bg-card border-2 border-foreground p-6" role="region" aria-label="Installation commands">
          <p className="text-muted-foreground"># In your terminal</p>
          <p className="text-foreground">
            <span className="text-primary" aria-hidden="true">$</span> npx ccwrapdev
          </p>
          <div className="border-t-2 border-foreground my-4" />
          <p className="text-muted-foreground"># Or use the Claude Code plugin</p>
          <p className="text-foreground">
            <span className="text-primary" aria-hidden="true">$</span> /plugin marketplace add
            https://github.com/aishvaryagupta/ccwrapped-plugin.git
          </p>
          <p className="text-foreground">
            <span className="text-primary" aria-hidden="true">$</span> /plugin install ccwrapped@ccwrapped-marketplace
          </p>
        </div>
      </section>
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
    <li className="list-none border-2 border-foreground bg-card p-6 text-center">
      <div className="text-2xl font-bold font-mono text-primary mb-2" aria-hidden="true">
        {number}.
      </div>
      <h3 className="font-semibold mb-2 uppercase">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </li>
  );
}

function PrivacyCard({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: 'positive' | 'negative';
}) {
  return (
    <div className="border-2 border-foreground bg-card p-6">
      <h3 className="font-semibold mb-4 uppercase">{title}</h3>
      <ul className="flex flex-col gap-2" aria-label={title}>
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
