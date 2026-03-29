'use client';

import { useState } from 'react';
import { Link as LinkIcon, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({ text, label = 'Copy Profile URL', className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API unavailable (e.g. non-HTTPS) — silently fail
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center justify-center gap-2 border-2 border-foreground bg-secondary text-secondary-foreground px-4 py-2 text-sm font-medium uppercase tracking-wider transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        className,
      )}
      aria-label={copied ? 'Copied to clipboard' : label}
    >
      {copied ? (
        <>
          <Check className="size-4" />
          Copied!
        </>
      ) : (
        <>
          <LinkIcon className="size-4" />
          {label}
        </>
      )}
    </button>
  );
}
