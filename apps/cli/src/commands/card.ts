import { spawn } from 'node:child_process';
import { platform } from 'node:os';
import { readState, getAuthToken } from '@ccwrapped/core';
import { openUrl } from '../browser.js';
import { green, red } from '../ui.js';

export async function run(flags: string[]): Promise<void> {
  const state = readState();

  if (!getAuthToken() || !state.username) {
    console.log(red('No profile yet.'));
    console.log('Run "ccwrapped auth" then "ccwrapped sync" to set up your profile.');
    process.exitCode = 1;
    return;
  }

  const url = `https://ccwrapped.dev/${state.username}`;

  if (flags.includes('--copy')) {
    copyToClipboard(url);
    console.log(green('Card URL copied to clipboard!'));
    console.log(url);
  } else {
    openUrl(url);
    console.log(`Opening ${url} ...`);
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
