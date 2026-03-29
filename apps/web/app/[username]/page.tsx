import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProfileContent } from '@/components/profile-content';
import { fetchUserProfile, fetchUserStats } from '@/lib/queries';

export const revalidate = 300;

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username: rawUsername } = await params;
  const username = rawUsername.replace(/^@/, '');
  return {
    title: `@${username} — ccwrapped`,
    description: `Claude Code usage stats for @${username}`,
    openGraph: {
      title: `@${username} — ccwrapped`,
      description: `Claude Code usage stats for @${username}`,
      images: [`/api/card/${username}.png`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `@${username} — ccwrapped`,
      images: [`/api/card/${username}.png`],
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username: rawUsername } = await params;
  const username = rawUsername.replace(/^@/, '');
  const user = await fetchUserProfile(username);
  if (!user) notFound();

  const stats = await fetchUserStats(user.id);

  return <ProfileContent user={user} stats={stats} />;
}
