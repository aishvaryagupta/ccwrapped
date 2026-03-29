import { cookies } from 'next/headers';
import { verifySignedValue } from './cookies';

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ccwrapped_session')?.value;
  if (!sessionCookie) return null;

  const value = verifySignedValue(sessionCookie);
  if (!value) return null;

  const [userId, expiryStr] = value.split(':');
  if (!userId || !expiryStr) return null;

  const expiry = Number(expiryStr);
  if (Number.isNaN(expiry) || Date.now() / 1000 > expiry) return null;

  return userId;
}
