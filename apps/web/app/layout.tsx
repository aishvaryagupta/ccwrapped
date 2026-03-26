import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Nav } from '@/components/nav';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'devwrapped — Your Claude Code stats, visualized and shared',
  description:
    'Track your Claude Code usage. Beautiful shareable cards, public profiles, and leaderboard rankings.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen antialiased`}
      >
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
