# Competitor Research: ccwrapped vs Code Card

**Date:** 2026-03-29

| Category | **ccwrapped** | **Code Card** |
|---|---|---|
| **Website** | ccwrapped.dev | codecard.dev |
| **Tagline** | Auto-sync Claude Code usage stats | Your AI Coding Stats, Beautifully Shared |

## Data Collection

| | **ccwrapped** | **Code Card** |
|---|---|---|
| **Source** | Claude Code JSONL transcript files | Claude Code, Codex, and OpenClaw session files |
| **What's read** | `~/.config/claude/projects/**/*.jsonl` | Same Claude logs + Codex + OpenClaw logs |
| **Data points** | Tokens (input/output/cache), sessions, projects, models, cost, lines written, tool usage | Tokens, sessions, prompts, models, cost, lines written, files touched, tool usage, projects, languages |
| **Granularity** | Daily aggregates only | Per-session level (richer detail) |
| **Code sent?** | Never — aggregates only | Never — aggregates only |

## Sync Mechanism

| | **ccwrapped** | **Code Card** |
|---|---|---|
| **Auto-sync** | SessionEnd hook via `~/.claude/settings.json` (or plugin) | PostToolUse hook (Claude Code), manual for others |
| **Manual sync** | `npx ccwrapdev sync` | `npx code-card` |
| **Auth for sync** | None — uses anonymous `sync_token` | Device code auth required |
| **Trigger** | Automatic after every session | Automatic for Claude Code, manual for Codex/OpenClaw |
| **Behavior** | Silent, async, non-blocking (30s timeout) | Similar — background sync |
| **Deduplication** | Session ID tracking (last 500) | Unknown |

## Installation & Onboarding

| | **ccwrapped** | **Code Card** |
|---|---|---|
| **Setup** | 1 command (`npx ccwrapdev`) — zero auth, zero sign-up | 1 command (`npx code-card`) |
| **Auth method** | None required — anonymous sync token; optional Google OAuth on web for claiming username | Device code → browser link |
| **Plugin needed?** | No — npx runs directly; plugin available as optional alternative | No — npx runs directly |
| **Node requirement** | Node 20+ | Node 18+ |
| **Friction** | Lowest — no auth, no account, just run and get stats | Lower — single npx command but still requires auth |

### Auth Flow Detail

**ccwrapped (Sync First, Claim Later):**
1. User runs `npx ccwrapdev` — no auth step at all
2. CLI scans local logs, shows stats in terminal, syncs anonymously
3. Server issues a `sync_token` stored in `~/.config/ccwrapped/state.json`
4. User gets an anonymous profile at `ccwrapped.dev/p/{id}`
5. Optionally, user claims a username on the web via Google OAuth (e.g. `ccwrapped.dev/alice`)

**Code Card:**
1. User runs `npx code-card`
2. CLI reads local session files and likely initiates a device code flow (device code → browser link)
3. Despite "no OAuth" marketing, profile URLs (`codecard.dev/[username]`) require identity — some auth step exists but is downplayed in their messaging

**Implication:** ccwrapped now has the simplest onboarding — truly zero auth. The user sees stats and gets a profile before any identity is involved. Code Card still requires some form of auth before a profile can be created.

## Profile & Dashboard Features

| Feature | **ccwrapped** | **Code Card** |
|---|---|---|
| **Profile page** | `/[username]` | `/[username]` |
| **Stat cards** | Tokens, sessions, projects, cost, lines written | Sessions, prompts, tokens, cost, lines written, files touched, language, streak |
| **Activity heatmap** | Full year GitHub-style | Full year GitHub-style |
| **Model breakdown** | Top 5 models chart | Model usage bar (Opus, Sonnet, Haiku, GPT) |
| **Token breakdown** | Yes (Input/Output/Cache breakdown) | Input/Output/Cache Read/Cache Write |
| **Platform breakdown** | No (Claude Code only) | Yes (Claude Code / Codex / OpenClaw split) |
| **Tool usage chart** | Yes (Bash, Read, Edit, Write, Glob, etc.) | Yes (Bash, Read, Edit, Write, Glob, etc.) |
| **Top projects** | No | Yes (anonymized, ranked by sessions) |
| **Streaks** | Yes (current + longest streak) | Yes (current + longest streak) |
| **Badges** | No | Yes (3 visible badges) |
| **Shareable OG card** | Yes (Satori, 1hr cache) | Yes (auto-generated social cards) |
| **Share button** | Copy URL | Share Profile button |
| **Social links** | Yes (GitHub, Twitter, Website) | GitHub, Twitter, Website |
| **Privacy controls** | No (all public) | Yes (toggle visibility per section) |
| **Leaderboard** | Yes (daily/weekly/monthly) | Yes (Most Active / Newest / Trending) |

## Platforms Supported

| Platform | **ccwrapped** | **Code Card** |
|---|---|---|
| **Claude Code** | Yes | Yes |
| **Codex** | No | Yes |
| **OpenClaw** | No | Yes |

## Tech Stack

| | **ccwrapped** | **Code Card** |
|---|---|---|
| **Frontend** | Next.js 15, React 19, Tailwind 4, shadcn/ui | Unknown (likely Next.js) |
| **Database** | Supabase (Postgres) | Unknown |
| **Hosting** | Vercel | Unknown |
| **Monorepo** | Turborepo + Yarn | Unknown |
| **Open source** | Yes (GitHub) | Unknown |

## Traction

| | **ccwrapped** | **Code Card** |
|---|---|---|
| **Users visible** | Unknown (leaderboard needs login) | ~8 profiles (2 are test accounts) |
| **Top user** | Unknown | 16,799 sessions (likely founder) |
| **Real users estimate** | Early stage | ~5-6 real users |
| **Stage** | Pre-PMF | Pre-PMF |

## Pricing

| | **ccwrapped** | **Code Card** |
|---|---|---|
| **Price** | Free | Free forever, no credit card |

## Key Takeaways

**Code Card is ahead on:**
- Multi-platform support (Codex, OpenClaw)
- Badges system
- Privacy controls (toggle visibility per section)
- Top projects display

**ccwrapped is ahead on:**
- Simplest onboarding in the category — zero auth, zero sign-up, just `npx ccwrapdev`
- "Sync First, Claim Later" — users get value before any account creation
- Open source (auditable)
- Claude Code plugin (native marketplace integration, pending official listing)
- Cleaner auto-sync (fire-and-forget hooks)

**Now at parity:**
- Token breakdown (input/output/cache)
- Streaks (current + longest)
- Social links (GitHub, Twitter, Website)
- Full-year activity heatmap
- Tool usage chart
- Lines written tracking

## Biggest Gaps to Close

1. **Multi-platform** — Codex and OpenClaw support gives Code Card a wider TAM. ccwrapped is Claude Code only.
2. **Badges** — Code Card has a badge system; ccwrapped does not yet.
3. **Privacy controls** — Code Card allows toggling visibility per profile section; ccwrapped profiles are fully public.
4. **Top projects** — Code Card shows anonymized project rankings; ccwrapped does not.

**Gaps already closed (v0.4.0):**
- ~~Onboarding friction~~ — ccwrapped now has the simplest onboarding: zero auth, zero sign-up, one command.
- ~~Profile richness~~ — Token breakdown, streaks, social links, full-year heatmap, tool usage, and lines written are all now available.
