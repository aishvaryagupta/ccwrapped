import * as readline from 'node:readline/promises';
import { API_BASE_URL, claimUsername, validateUsername } from '@ccwrapped/core';
import { bold, dim, red } from '../ui.js';

export async function promptForUsername(token: string): Promise<string | null> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const MAX_ATTEMPTS = 3;

  try {
    console.log(bold('Pick a username for your profile'));
    console.log(dim('3-30 characters, letters, numbers, and hyphens.'));
    console.log();

    let attempts = 0;
    while (attempts < MAX_ATTEMPTS) {
      let input: string;
      try {
        input = await rl.question('Username: ');
      } catch {
        return null;
      }

      if (!input.trim()) {
        console.log(dim('Username cannot be empty.'));
        continue;
      }

      attempts++;

      const validation = validateUsername(input);
      if (!validation.valid) {
        console.log(red(validation.reason));
        continue;
      }

      const result = await claimUsername(API_BASE_URL, token, validation.normalized);
      if (result.ok) return result.data.username;

      console.log(red(result.message ?? 'Could not claim username.'));
    }

    console.log(red('Too many attempts. Run again to try.'));
    return null;
  } finally {
    rl.close();
  }
}
