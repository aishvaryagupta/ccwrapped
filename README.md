# ccwrapped

**Your Claude Code stats, visualized and shared.**

A social stats tracker for Claude Code. Install a plugin, auto-sync your usage, get a beautiful shareable card and leaderboard ranking — with zero daily effort.

Think **Spotify Wrapped meets WakaTime** — for Claude Code.

## Quick Start

### Plugin (recommended — auto-syncs forever)

```bash
# Inside Claude Code
/plugin marketplace add aishvaryagupta/ccwrapped-plugin
/plugin install ccwrapped
```

Then authenticate once:

```bash
npx ccwrapped auth
```

Done. Every session auto-syncs in the background.

### CLI (manual fallback)

```bash
# View local stats
npx ccwrapped

# Sync to ccwrapped.dev
npx ccwrapped sync

# Open your profile
npx ccwrapped card
```

## CLI Commands

| Command | Description |
|---|---|
| `ccwrapped` | Show local usage summary |
| `ccwrapped auth` | Authenticate with Google |
| `ccwrapped auth --logout` | Remove stored credentials |
| `ccwrapped sync` | Sync stats to ccwrapped.dev |
| `ccwrapped sync --minimal` | Upload tokens only (no model/session data) |
| `ccwrapped card` | Open your profile in browser |
| `ccwrapped card --copy` | Copy profile URL to clipboard |
| `ccwrapped status` | Show sync status and config |

## What Gets Uploaded

Only aggregated daily totals. **Never** your code, chats, file paths, or project names.

| Uploaded | NOT uploaded |
|---|---|
| Daily token counts | Your code |
| Session count per day | Your conversations |
| Model breakdown (Opus/Sonnet/Haiku) | File paths |
| Estimated cost | Project names |

## Architecture

```
ccwrapped/                     Turborepo monorepo
├── packages/core/              Shared JSONL parser, payload builder, types
├── apps/plugin/                Claude Code plugin (auto-sync via hooks)
├── apps/cli/                   CLI tool (npx ccwrapped)
└── apps/web/                   Next.js on Vercel (ccwrapped.dev)
    ├── POST /api/sync          Receive + validate + store daily stats
    ├── GET /api/card/[user]    OG card image (Satori, edge-cached 1hr)
    ├── /                       Landing page
    ├── /[username]             Profile page (ISR 5min)
    └── /leaderboard            Ranked leaderboard (ISR 5min)
```

**Stack:** TypeScript, Next.js 15, Supabase (PostgreSQL), Vercel, Tailwind CSS

## Development

```bash
# Install dependencies
yarn install

# Run all tests
yarn test

# Typecheck
yarn typecheck

# Build all packages
yarn build

# Run web app locally
cd apps/web && yarn dev
```

## Privacy

- Only aggregated numbers leave your machine
- Auth via Google OAuth Device Flow (works in SSH/containers)
- State file at `~/.config/ccwrapped/state.json` (chmod 0600)
- All source code is open for audit

## License

MIT
