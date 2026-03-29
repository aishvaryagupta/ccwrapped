import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ProfileContent } from '@/components/profile-content';
import { fetchUserByProfileId, fetchUserStats } from '@/lib/queries';

export const revalidate = 300;

interface Props {
  params: Promise<{ profileId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { profileId } = await params;
  return {
    title: 'Anonymous Profile — ccwrapped',
    description: `Claude Code usage stats (profile ${profileId})`,
    robots: { index: false, follow: false },
  };
}

export default async function AnonymousProfilePage({ params }: Props) {
  const { profileId } = await params;
  const user = await fetchUserByProfileId(profileId);
  if (!user) notFound();

  // If user has claimed a username, redirect to the vanity URL
  if (user.username) {
    redirect(`/${user.username}`);
  }

  const stats = await fetchUserStats(user.id);

  const claimBanner = (
    <div className="border-2 border-foreground bg-card p-6 mb-8">
      <h2 className="font-bold uppercase text-sm mb-2">Claim this profile</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Sign in with Google to get a custom URL and share your stats.
      </p>
      <a href={`/api/auth/google?profile_id=${user.id.slice(0, 12)}`}>
        <Button className="gap-2">
          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Claim with Google
        </Button>
      </a>
    </div>
  );

  return <ProfileContent user={user} stats={stats} claimBanner={claimBanner} />;
}
