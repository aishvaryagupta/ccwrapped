# devwrapped

**Your Claude Code stats, visualized and shared.**

A social stats tracker for Claude Code. Install a plugin, auto-sync your usage, get a beautiful shareable card and leaderboard ranking — with zero daily effort.

Think **Spotify Wrapped meets WakaTime** — for Claude Code.

## Quick Start

### Plugin (recommended — auto-syncs forever)

```bash
# Inside Claude Code
/plugin marketplace add devwrapped-org/devwrapped-plugin
/plugin install devwrapped
```

Then authenticate once:

```bash
npx devwrapped auth
```

Done. Every session auto-syncs in the background.

### CLI (manual fallback)

```bash
# View local stats
npx devwrapped

# Sync to devwrapped.dev
npx devwrapped sync

# Open your profile
npx devwrapped card
```

## CLI Commands

| Command | Description |
|---|---|
| `devwrapped` | Show local usage summary |
| `devwrapped auth` | Authenticate with GitHub |
| `devwrapped auth --logout` | Remove stored credentials |
| `devwrapped sync` | Sync stats to devwrapped.dev |
| `devwrapped sync --minimal` | Upload tokens only (no model/session data) |
| `devwrapped card` | Open your profile in browser |
| `devwrapped card --copy` | Copy profile URL to clipboard |
| `devwrapped status` | Show sync status and config |

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
devwrapped/                     Turborepo monorepo
├── packages/core/              Shared JSONL parser, payload builder, types
├── apps/plugin/                Claude Code plugin (auto-sync via hooks)
├── apps/cli/                   CLI tool (npx devwrapped)
└── apps/web/                   Next.js on Vercel (devwrapped.dev)
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
- Auth via GitHub OAuth Device Flow (works in SSH/containers)
- State file at `~/.config/devwrapped/state.json` (chmod 0600)
- All source code is open for audit

## License

MIT
