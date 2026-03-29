import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUserId } from '@/lib/session';
import { getSupabaseAdmin } from '@/lib/supabase';
import { ClaimForm } from './claim-form';

export const metadata: Metadata = {
  title: 'Claim Your Profile',
  robots: { index: false, follow: false },
};

export default async function ClaimPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect('/');

  const { data: user } = await getSupabaseAdmin()
    .from('users')
    .select('id, username, email, display_name, avatar_url')
    .eq('id', userId)
    .single();

  if (!user) redirect('/');

  // Already has username — go to profile
  if (user.username) redirect(`/${user.username}`);

  return (
    <div className="max-w-[80ch] mx-auto px-4 py-16 sm:py-24">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-2xl sm:text-3xl font-bold uppercase mb-2">Claim your profile</h1>
        <p className="text-muted-foreground mb-8">
          Choose a username for your public profile URL.
        </p>

        {user.avatar_url && (
          <div className="flex justify-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatar_url}
              alt=""
              className="size-16 border-2 border-foreground"
            />
          </div>
        )}

        {user.email && (
          <p className="text-sm text-muted-foreground mb-8">
            Signed in as {user.email}
          </p>
        )}

        <ClaimForm />
      </div>
    </div>
  );
}
