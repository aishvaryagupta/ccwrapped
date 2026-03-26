#!/usr/bin/env node

const command = process.argv[2];
const flags = process.argv.slice(3);

try {
  switch (command) {
    case undefined:
    case '': {
      const { run } = await import('./commands/default.js');
      await run(flags);
      break;
    }
    case 'auth': {
      const { run } = await import('./commands/auth.js');
      await run(flags);
      break;
    }
    case 'sync': {
      const { run } = await import('./commands/sync.js');
      await run(flags);
      break;
    }
    case 'card': {
      const { run } = await import('./commands/card.js');
      await run(flags);
      break;
    }
    case 'status': {
      const { run } = await import('./commands/status.js');
      await run(flags);
      break;
    }
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    case '--version':
    case '-v':
      console.log('devwrapped 0.1.0');
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error();
      printHelp();
      process.exitCode = 1;
  }
} catch (err) {
  const message = (err as Error).message;
  if (message.includes('ENOENT') || message.includes('no such file')) {
    console.error('Error: Could not read Claude Code logs.');
    console.error('Make sure Claude Code is installed and you have used it at least once.');
  } else if (message.includes('EACCES') || message.includes('permission')) {
    console.error('Error: Permission denied reading Claude Code logs.');
    console.error('Check file permissions on ~/.config/claude/projects/');
  } else {
    console.error('Error:', message);
  }
  process.exitCode = 1;
}

function printHelp() {
  console.log('devwrapped — Your Claude Code stats, visualized and shared.');
  console.log();
  console.log('Usage: devwrapped [command] [options]');
  console.log();
  console.log('Commands:');
  console.log('  (default)    Show local usage summary');
  console.log('  auth         Authenticate with GitHub');
  console.log('  auth --logout   Remove stored credentials');
  console.log('  sync         Sync stats to devwrapped.dev');
  console.log('  sync --minimal  Upload tokens only (no model/session data)');
  console.log('  card         Open your profile in browser');
  console.log('  card --copy     Copy profile URL to clipboard');
  console.log('  status       Show sync status and config');
  console.log('  help         Show this help message');
  console.log();
  console.log('Get started:');
  console.log('  1. devwrapped auth     # Connect your GitHub account');
  console.log('  2. devwrapped sync     # Upload your stats');
  console.log('  3. devwrapped card     # View your profile');
  console.log();
  console.log('Or install the plugin for auto-sync:');
  console.log('  /plugin install devwrapped');
}
