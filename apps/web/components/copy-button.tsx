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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md bg-secondary text-secondary-foreground px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
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
