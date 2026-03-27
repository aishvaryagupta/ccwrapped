import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  clearState,
  getValidToken,
  readState,
  pollForToken,
  setAuthToken,
  startDeviceFlow,
} from '@ccwrapped/core';
import { openUrl } from '../browser.js';
import { bold, green, red, yellow } from '../ui.js';

export async function run(flags: string[]): Promise<void> {
  if (flags.includes('--logout')) {
    clearState();
    console.log(green('Logged out. Credentials removed.'));
    return;
  }

  // Check if already authenticated (validates token, refreshes if needed)
  const existingToken = await getValidToken(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  if (existingToken) {
    const state = readState();
    console.log(green(`Already authenticated${state.username ? ` as @${state.username}` : ''}.`));
    console.log('Use --logout to reset.');
    return;
  }

  // Check if client ID is configured
  if (!GOOGLE_CLIENT_ID) {
    console.log(yellow('Authentication is not yet configured.'));
    console.log('A Google OAuth App needs to be created first.');
    console.log('See docs/todo.md for setup instructions.');
    return;
  }

  // Start Device Flow
  console.log(bold('ccwrapped auth'));
  console.log();

  const deviceCode = await startDeviceFlow(GOOGLE_CLIENT_ID);
  if (!deviceCode) {
    console.log(red('Failed to start authentication. Check your network.'));
    process.exitCode = 1;
    return;
  }

  console.log(`! First, copy your one-time code: ${bold(deviceCode.user_code)}`);
  console.log();
  console.log(`Opening ${deviceCode.verification_url} ...`);

  openUrl(deviceCode.verification_url);

  console.log();
  console.log('Waiting for authorization...');

  const result = await pollForToken(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    deviceCode.device_code,
    deviceCode.interval,
  );

  if (!result.ok) {
    const messages: Record<string, string> = {
      expired: 'Code expired. Run "ccwrapped auth" again.',
      denied: 'Authorization denied.',
      network: 'Network error during authorization.',
      not_configured: 'Auth not configured.',
    };
    console.log(red(messages[result.error] ?? 'Unknown error.'));
    process.exitCode = 1;
    return;
  }

  setAuthToken(result.token, result.refreshToken, result.expiresIn);
  console.log();
  console.log(green(`Authentication complete. Welcome, ${result.email}!`));
  console.log('Run "ccwrapped sync" to pick a username and upload your stats.');
}
