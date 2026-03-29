'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
  const label = mounted ? nextTheme.toUpperCase() : '-----';

  return (
    <button
      type="button"
      className="border-2 border-foreground px-3 py-1 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-foreground hover:text-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      onClick={() => setTheme(nextTheme)}
      aria-label={mounted ? `Switch to ${nextTheme} mode` : 'Toggle theme'}
      disabled={!mounted}
    >
      {label}
    </button>
  );
}
