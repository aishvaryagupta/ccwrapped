import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH, USERNAME_PATTERN } from './consts.js';

const RESERVED_USERNAMES = new Set([
  'about',
  'admin',
  'api',
  'app',
  'auth',
  'blog',
  'callback',
  'card',
  'claim',
  'dashboard',
  'docs',
  'error',
  'help',
  'home',
  'leaderboard',
  'login',
  'logout',
  'not-found',
  'pricing',
  'privacy',
  'profile',
  'settings',
  'signup',
  'status',
  'support',
  'sync',
  'terms',
  'user',
  'users',
  'username',
  'www',
]);

export function validateUsername(
  username: string,
): { valid: true; normalized: string } | { valid: false; reason: string } {
  const normalized = username.toLowerCase().trim();

  if (normalized.length < USERNAME_MIN_LENGTH) {
    return { valid: false, reason: `Must be at least ${USERNAME_MIN_LENGTH} characters.` };
  }

  if (normalized.length > USERNAME_MAX_LENGTH) {
    return { valid: false, reason: `Must be at most ${USERNAME_MAX_LENGTH} characters.` };
  }

  if (!USERNAME_PATTERN.test(normalized)) {
    return { valid: false, reason: 'Only letters, numbers, and hyphens allowed. Cannot start or end with a hyphen.' };
  }

  if (RESERVED_USERNAMES.has(normalized)) {
    return { valid: false, reason: 'That username is reserved.' };
  }

  return { valid: true, normalized };
}
