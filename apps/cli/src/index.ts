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
    default:
      console.error(`Unknown command: ${command}`);
      console.error();
      console.error('Usage: devwrapped [command]');
      console.error();
      console.error('Commands:');
      console.error('  (default)    Show local usage summary');
      console.error('  auth         Authenticate with GitHub');
      console.error('  sync         Sync stats to devwrapped.dev');
      console.error('  card         Open your profile card');
      console.error('  status       Show sync status');
      process.exitCode = 1;
  }
} catch (err) {
  console.error('Error:', (err as Error).message);
  process.exitCode = 1;
}
