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
    case 'hook-sync': {
      const { run } = await import('./commands/hook-sync.js');
      await run();
      break;
    }
    case 'setup': {
      const { run } = await import('./commands/setup.js');
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
      console.log('ccwrapped 0.1.0');
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
  console.log('ccwrapped — Your Claude Code stats, visualized and shared.');
  console.log();
  console.log('Usage: ccwrapped [command] [options]');
  console.log();
  console.log('Commands:');
  console.log('  (default)        Auth + scan + sync + auto-sync setup');
  console.log('  (default) --local  Show local usage summary');
  console.log('  auth             Authenticate with Google');
  console.log('  auth --logout    Remove stored credentials');
  console.log('  sync             Sync stats to ccwrapped.dev');
  console.log('  sync --minimal   Upload tokens only (no model/session data)');
  console.log('  setup            Enable auto-sync after every session');
  console.log('  setup --remove   Remove auto-sync hook');
  console.log('  setup --check    Check auto-sync status');
  console.log('  card             Open your profile in browser');
  console.log('  card --copy      Copy profile URL to clipboard');
  console.log('  status           Show sync status and config');
  console.log('  help             Show this help message');
  console.log();
  console.log('Get started:');
  console.log('  npx ccwrapdev    # One command does everything');
}
