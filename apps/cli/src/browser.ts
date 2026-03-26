import { execFile } from 'node:child_process';
import { platform } from 'node:os';

export function openUrl(url: string): void {
  const os = platform();
  if (os === 'darwin') {
    execFile('open', [url]);
  } else if (os === 'win32') {
    execFile('cmd', ['/c', 'start', '', url]);
  } else {
    execFile('xdg-open', [url]);
  }
}
