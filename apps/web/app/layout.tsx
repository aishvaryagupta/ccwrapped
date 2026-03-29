import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500', '600', '800'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'ccwrapped — Your Claude Code stats, visualized and shared',
    template: '%s — ccwrapped',
  },
  description:
    'Track your Claude Code usage. Beautiful shareable cards, public profiles, and leaderboard rankings.',
  metadataBase: new URL('https://ccwrapped.dev'),
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ccwrapped.dev',
    siteName: 'ccwrapped',
    title: 'ccwrapped — Your Claude Code stats, visualized and shared',
    description:
      'Track your Claude Code usage. Beautiful shareable cards, public profiles, and leaderboard rankings.',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${jetbrainsMono.className} min-h-screen flex flex-col`}
      >
        <ThemeProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:text-sm"
          >
            Skip to main content
          </a>
          <Nav />
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
