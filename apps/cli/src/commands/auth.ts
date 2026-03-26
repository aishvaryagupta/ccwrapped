import {
  GITHUB_CLIENT_ID,
  clearState,
  getAuthToken,
  pollForToken,
  readState,
  setAuthToken,
  startDeviceFlow,
} from '@devwrapped/core';
import { openUrl } from '../browser.js';
import { bold, green, red, yellow } from '../ui.js';

export async function run(flags: string[]): Promise<void> {
  if (flags.includes('--logout')) {
    clearState();
    console.log(green('Logged out. Credentials removed.'));
    return;
  }

  // Check if already authenticated
  const token = getAuthToken();
  if (token) {
    const state = readState();
    console.log(green(`Already authenticated as @${state.github_login ?? 'unknown'}.`));
    console.log('Use --logout to reset.');
    return;
  }

  // Check if client ID is configured
  if (!GITHUB_CLIENT_ID) {
    console.log(yellow('Authentication is not yet configured.'));
    console.log('A GitHub OAuth App needs to be created first.');
    console.log('See docs/todo.md for setup instructions.');
    return;
  }

  // Start Device Flow
  console.log(bold('devwrapped auth'));
  console.log();

  const deviceCode = await startDeviceFlow(GITHUB_CLIENT_ID);
  if (!deviceCode) {
    console.log(red('Failed to start authentication. Check your network.'));
    process.exitCode = 1;
    return;
  }

  console.log(`! First, copy your one-time code: ${bold(deviceCode.user_code)}`);
  console.log();
  console.log(`Opening ${deviceCode.verification_uri} ...`);

  openUrl(deviceCode.verification_uri);

  console.log();
  console.log('Waiting for authorization...');

  const result = await pollForToken(
    GITHUB_CLIENT_ID,
    deviceCode.device_code,
    deviceCode.interval,
  );

  if (!result.ok) {
    const messages: Record<string, string> = {
      expired: 'Code expired. Run "devwrapped auth" again.',
      denied: 'Authorization denied.',
      network: 'Network error during authorization.',
      not_configured: 'Auth not configured.',
    };
    console.log(red(messages[result.error] ?? 'Unknown error.'));
    process.exitCode = 1;
    return;
  }

  setAuthToken(result.token, result.login);
  console.log();
  console.log(green(`Authentication complete. Welcome, @${result.login}!`));
  console.log('Your stats will auto-sync from now on.');
}
