import { getConfigDir, readState } from '@devwrapped/core';
import { bold, dim, green, red } from '../ui.js';

export async function run(_flags: string[]): Promise<void> {
  const state = readState();

  console.log(bold('devwrapped status'));
  console.log();

  // Auth
  if (state.auth_token) {
    console.log(`  Auth:       ${green(`@${state.github_login ?? 'unknown'}`)}`);
  } else {
    console.log(`  Auth:       ${red('Not authenticated')}`);
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

  // Config path
  console.log(`  Config:     ${getConfigDir()}`);
}
