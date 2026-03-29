'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/leaderboard', label: 'Leaderboard' },
] as const;

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="border-b-2 border-foreground bg-background sticky top-0 z-50"
      aria-label="Main navigation"
    >
      <div className="max-w-[80ch] mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-bold uppercase tracking-wider text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          CCWRAPPED
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-4">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                pathname === href
                  ? 'text-foreground underline underline-offset-4 decoration-2'
                  : 'text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4 hover:decoration-2'
              }`}
              aria-current={pathname === href ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}
          <ThemeToggle />
        </div>

        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="sm:hidden border-2 border-foreground p-2 text-foreground hover:bg-foreground hover:text-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 rounded-none border-l-2 border-foreground">
            <SheetHeader>
              <SheetTitle className="text-left font-bold uppercase tracking-wider text-foreground">
                CCWRAPPED
              </SheetTitle>
            </SheetHeader>
            <div className="mt-8 flex flex-col gap-4">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`text-sm font-bold uppercase tracking-wider transition-colors ${
                    pathname === href
                      ? 'text-foreground underline underline-offset-4 decoration-2'
                      : 'text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4 hover:decoration-2'
                  }`}
                >
                  {label}
                </Link>
              ))}
              <div className="border-t-2 border-foreground pt-4">
                <ThemeToggle />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
