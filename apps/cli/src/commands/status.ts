import { getConfigDir, isCcwrappedHookInstalled, readState } from '@ccwrapped/core';
import { bold, dim, green, red, yellow } from '../ui.js';

export async function run(_flags: string[]): Promise<void> {
  const state = readState();

  console.log(bold('ccwrapped status'));
  console.log();

  // Profile
  if (state.username) {
    console.log(`  Profile:    ${green(`@${state.username}`)}`);
  } else if (state.sync_token) {
    console.log(`  Profile:    ${yellow('Unclaimed')}  ${dim('Claim at your profile page')}`);
  } else {
    console.log(`  Profile:    ${red('Not synced')}`);
  }

  // Sync token
  if (state.sync_token) {
    console.log(`  Sync:       ${green('Connected')}`);
  } else {
    console.log(`  Sync:       ${dim('Not set up')}`);
  }

  // Last sync
  if (state.last_sync) {
    const date = new Date(state.last_sync);
    console.log(`  Last sync:  ${date.toISOString().replace('T', ' ').slice(0, 19)} UTC`);
  } else {
    console.log(`  Last sync:  ${dim('Never')}`);
  }

  // Sessions
  console.log(`  Sessions:   ${state.synced_sessions.length} tracked`);

  // Machine ID
  console.log(`  Machine:    ${state.machine_id}`);

  // Auto-sync
  if (isCcwrappedHookInstalled()) {
    console.log(`  Auto-sync:  ${green('Enabled')}`);
  } else {
    console.log(`  Auto-sync:  ${yellow('Not configured')}  ${dim('Run "npx ccwrapdev setup"')}`);
  }

  // Config path
  console.log(`  Config:     ${getConfigDir()}`);
}
