import { exec } from 'node:child_process';
import { platform } from 'node:os';
import { readState } from '@devwrapped/core';
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
    const cmd = platform() === 'darwin' ? 'pbcopy' : 'xclip -selection clipboard';
    exec(`echo -n ${JSON.stringify(url)} | ${cmd}`);
    console.log(green('Card URL copied to clipboard!'));
    console.log(url);
  } else {
    const openCmd = platform() === 'darwin' ? 'open' : 'xdg-open';
    exec(`${openCmd} ${JSON.stringify(url)}`);
    console.log(`Opening ${url} ...`);
  }
}
