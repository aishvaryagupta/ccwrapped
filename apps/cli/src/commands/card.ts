import { spawn } from 'node:child_process';
import { platform } from 'node:os';
import { readState } from '@devwrapped/core';
import { openUrl } from '../browser.js';
import { green, red } from '../ui.js';

export async function run(flags: string[]): Promise<void> {
  const state = readState();

  if (!state.auth_token || !state.github_login) {
    console.log(red('Not authenticated.'));
    console.log('Run "devwrapped auth" first.');
    process.exitCode = 1;
    return;
  }

  const url = `https://devwrapped.dev/@${state.github_login}`;

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
