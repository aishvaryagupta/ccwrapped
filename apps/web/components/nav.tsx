'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Trophy } from 'lucide-react';
import { GitHubIcon } from '@/components/icons';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
] as const;

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50"
      aria-label="Main navigation"
    >
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-bold text-primary rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          ccwrapped
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring nav-link-underline',
                pathname === href
                  ? 'text-foreground bg-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
              )}
              aria-current={pathname === href ? 'page' : undefined}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
          <Separator orientation="vertical" className="mx-2 h-5" />
          <a
            href="https://github.com/ccwrapped"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center size-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="GitHub"
          >
            <GitHubIcon className="size-4" />
          </a>
          <ThemeToggle />
        </div>

        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle className="text-left text-primary">
                ccwrapped
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 flex flex-col gap-1">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors',
                    pathname === href
                      ? 'text-foreground bg-accent'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                  )}
                >
                  <Icon className="size-5" />
                  {label}
                </Link>
              ))}
              <Separator className="my-3" />
              <a
                href="https://github.com/ccwrapped"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                <GitHubIcon className="size-5" />
                GitHub
              </a>
              <Separator className="my-3" />
              <div className="px-3">
                <ThemeToggle />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
