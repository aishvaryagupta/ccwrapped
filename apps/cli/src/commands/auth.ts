import { clearState, readState } from '@ccwrapped/core';
import { dim, green, yellow } from '../ui.js';

export async function run(flags: string[]): Promise<void> {
  if (flags.includes('--logout')) {
    clearState();
    console.log(green('Logged out. Local data cleared.'));
    console.log(dim('Your sync token and profile are preserved.'));
    return;
  }

  const state = readState();
  if (state.username) {
    console.log(green(`Profile: @${state.username}`));
  } else if (state.sync_token) {
    console.log(yellow('Profile not yet claimed.'));
  }

  console.log();
  console.log('Authentication is now handled on the web.');
  console.log('Visit your profile page to claim a username with Google.');
  console.log();
  console.log(dim('Run "npx ccwrapdev" to sync your stats.'));
}
