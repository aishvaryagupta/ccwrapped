import { spawn } from 'node:child_process';
import { platform } from 'node:os';
import { readState } from '@ccwrapped/core';
import { openUrl } from '../browser.js';
import { dim, green, red } from '../ui.js';

export async function run(flags: string[]): Promise<void> {
  const state = readState();

  const url = state.username
    ? `https://ccwrapped.dev/${state.username}`
    : state.profile_id
      ? `https://ccwrapped.dev/p/${state.profile_id}`
      : null;

  if (!url) {
    console.log(red('No profile yet.'));
    console.log('Run "npx ccwrapdev" to sync your stats first.');
    process.exitCode = 1;
    return;
  }

  if (flags.includes('--copy')) {
    copyToClipboard(url);
    console.log(green('Card URL copied to clipboard!'));
    console.log(url);
  } else {
    openUrl(url);
    console.log(`Opening ${url} ...`);
  }

  if (!state.username) {
    console.log(dim('Claim a username at your profile page to get a custom URL.'));
  }
}

function copyToClipboard(text: string): void {
  const os = platform();
  let cmd: string;
  let args: string[];

  if (os === 'darwin') {
    cmd = 'pbcopy';
    args = [];
  } else if (os === 'win32') {
    cmd = 'clip';
    args = [];
  } else {
    cmd = 'xclip';
    args = ['-selection', 'clipboard'];
  }

  const proc = spawn(cmd, args, { stdio: ['pipe', 'ignore', 'ignore'] });
  proc.stdin.write(text);
  proc.stdin.end();
}
