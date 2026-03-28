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
| **Data points** | Tokens (input/output/cache), sessions, projects, models, cost | Tokens, sessions, prompts, models, cost, lines written, files touched, tool usage, projects, languages |
| **Granularity** | Daily aggregates only | Per-session level (richer detail) |
| **Code sent?** | Never — aggregates only | Never — aggregates only |

## Sync Mechanism

| | **ccwrapped** | **Code Card** |
|---|---|---|
| **Auto-sync** | Claude Code plugin hooks (SessionEnd, Stop, SubagentStop) | PostToolUse hook (Claude Code), manual for others |
| **Manual sync** | `npx ccwrapdev sync` | `npx code-card` |
| **Trigger** | Automatic after every session | Automatic for Claude Code, manual for Codex/OpenClaw |
| **Behavior** | Silent, async, non-blocking (30s timeout) | Similar — background sync |
| **Deduplication** | Session ID tracking (last 500) | Unknown |

## Installation & Onboarding

| | **ccwrapped** | **Code Card** |
|---|---|---|
| **Setup** | 2-3 commands (marketplace add + install + auth) | 1 command (`npx code-card`) |
| **Auth method** | Google OAuth Device Flow | Device code → browser link |
| **Plugin needed?** | Yes (for auto-sync) | No — npx runs directly |
| **Node requirement** | Node 20+ | Node 18+ |
| **Friction** | Higher — marketplace add step confuses users | Lower — single npx command |

## Profile & Dashboard Features

| Feature | **ccwrapped** | **Code Card** |
|---|---|---|
| **Profile page** | `/[username]` | `/[username]` |
| **Stat cards** | Tokens, sessions, projects, cost | Sessions, prompts, tokens, cost, lines written, files touched, language, streak |
| **Activity heatmap** | 90-day GitHub-style | Full year GitHub-style |
| **Model breakdown** | Top 5 models chart | Model usage bar (Opus, Sonnet, Haiku, GPT) |
| **Token breakdown** | No | Input/Output/Cache Read/Cache Write |
| **Platform breakdown** | No (Claude Code only) | Yes (Claude Code / Codex / OpenClaw split) |
| **Tool usage chart** | No | Yes (Bash, Read, Edit, Write, Glob, etc.) |
| **Top projects** | No | Yes (anonymized, ranked by sessions) |
| **Streaks** | No | Yes (current + longest streak) |
| **Badges** | No | Yes (3 visible badges) |
| **Shareable OG card** | Yes (Satori, 1hr cache) | Yes (auto-generated social cards) |
| **Share button** | Copy URL | Share Profile button |
| **Social links** | No | GitHub, Twitter, Website |
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
- Richer profile (tool usage, projects, lines written, badges, streaks)
- Simpler onboarding (1 command vs 2-3)
- Privacy controls (toggle sections)
- More polished landing page

**ccwrapped is ahead on:**
- Open source (auditable)
- Claude Code plugin (native marketplace integration, pending official listing)
- Cleaner auto-sync (fire-and-forget hooks)

## Biggest Gaps to Close

1. **Onboarding friction** — Code Card's `npx code-card` is simpler than the 2-command plugin flow. Getting into the official marketplace will fix this.
2. **Profile richness** — Code Card tracks tool usage, lines written, files touched, projects, streaks, badges. ccwrapped profile is more minimal.
3. **Multi-platform** — Codex and OpenClaw support gives them a wider TAM.
