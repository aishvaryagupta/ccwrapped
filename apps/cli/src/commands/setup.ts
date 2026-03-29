import {
  getClaudeSettingsPath,
  isCcwrappedHookInstalled,
  installCcwrappedHook,
  uninstallCcwrappedHook,
} from '@ccwrapped/core';
import { bold, dim, green, red, yellow } from '../ui.js';

export async function run(flags: string[]): Promise<void> {
  if (flags.includes('--check')) {
    return showStatus();
  }

  if (flags.includes('--remove')) {
    return removeHook();
  }

  return installHook();
}

function showStatus(): void {
  const installed = isCcwrappedHookInstalled();
  const path = getClaudeSettingsPath();

  if (installed) {
    console.log(green('Auto-sync is enabled.'));
    console.log(dim(`  Hook in: ${path}`));
  } else {
    console.log(yellow('Auto-sync is not configured.'));
    console.log(dim('  Run "npx ccwrapdev setup" to enable.'));
  }
}

function removeHook(): void {
  if (!isCcwrappedHookInstalled()) {
    console.log(dim('Auto-sync hook is not installed. Nothing to remove.'));
    return;
  }

  const ok = uninstallCcwrappedHook();
  if (ok) {
    console.log(green('Auto-sync hook removed.'));
  } else {
    console.log(red('Failed to update settings file.'));
    process.exitCode = 1;
  }
}

function installHook(): void {
  const result = installCcwrappedHook();

  if (result.alreadyPresent) {
    console.log(green('Auto-sync is already enabled.'));
    return;
  }

  if (result.installed) {
    console.log(green('Auto-sync enabled!'));
    console.log(dim('  Stats will sync after every Claude Code session.'));
    console.log(dim(`  Hook written to: ${getClaudeSettingsPath()}`));
  } else {
    console.log(red('Failed to write hook to ~/.claude/settings.json'));
    console.log(dim('You can set up auto-sync manually with:'));
    console.log(bold('  /plugin install ccwrapped'));
    process.exitCode = 1;
  }
}
