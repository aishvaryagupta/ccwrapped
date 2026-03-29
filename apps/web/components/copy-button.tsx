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
        "relative inline-flex items-center justify-center gap-2 border-2 border-foreground bg-secondary text-secondary-foreground px-4 py-2 text-sm font-medium uppercase tracking-wider transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring overflow-hidden",
        className,
      )}
      aria-label={copied ? 'Copied to clipboard' : label}
    >
      {/* Idle state */}
      <span
        className="inline-flex items-center gap-2 transition-[opacity,filter] duration-200"
        style={{
          opacity: copied ? 0 : 1,
          filter: copied ? 'blur(4px)' : 'blur(0px)',
        }}
        aria-hidden={copied}
      >
        <LinkIcon className="size-4" />
        {label}
      </span>

      {/* Copied state */}
      <span
        className="absolute inset-0 inline-flex items-center justify-center gap-2 transition-[opacity,filter] duration-200"
        style={{
          opacity: copied ? 1 : 0,
          filter: copied ? 'blur(0px)' : 'blur(4px)',
        }}
        aria-hidden={!copied}
      >
        <Check className="size-4" />
        Copied!
      </span>
    </button>
  );
}
