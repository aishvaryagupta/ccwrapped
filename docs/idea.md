# Claude Code Leaderboard — Idea Document

## The Idea

A social, gamified usage tracker for Claude Code developers. Users opt-in to share their usage stats and compete on leaderboards — who's the top Claude Code user today, this week, this month? Combined with beautiful per-user visualizations of their usage across projects.

Think **WakaTime leaderboards meets Spotify Wrapped** — for Claude Code.

## Background

`ccusage` is an open-source CLI tool (~12K GitHub stars, ~34K weekly npm downloads) that parses Claude Code's local JSONL session logs to show token usage and estimated costs. It solves the data problem — but nobody has built the **social + visual layer** on top of it.

Claude Code users (Pro $20/mo, Max $100-200/mo) have almost zero visibility into their usage. More importantly, there's no way to **compare, compete, or share** usage with other developers.

## First Principles Decomposition

**What problem does this solve?**

1. **Visibility** — developers don't know how much they're using Claude Code vs. peers
2. **Identity** — power users want to signal "I'm a Claude Code power user" (same instinct as sharing GitHub contribution graphs)
3. **Motivation** — gamification creates engagement loops that keep people using the tool and talking about it

**Why does this work as a product?**

Evidence from successful analogues:

| Product | Model | Why It Worked |
|---|---|---|
| **WakaTime** | Coding time leaderboards (500K+ users) | Passive tracking + private team leaderboards as monetization |
| **Spotify Wrapped** | Annual shareable stats (200M+ users day 1) | Turns passive data into identity artifacts people share |
| **GitHub Unwrapped** | Video of your GitHub year | Visual shareability — MP4 format purpose-built for Twitter |
| **LeetCode** | Elo-rated contests + streaks | Competition tied to real career outcomes |
| **Duolingo** | Leagues + streaks | Small-group leaderboards + loss aversion = 14% retention boost |

**Core behavioral science at play:**

- **Identity signaling** — "I'm in the top 5% of Claude Code users" is shareable
- **Quantitative fixation** — "You generated 2.4M tokens across 23 projects" is compelling
- **Small-group competition** — Competing with 10-20 people is motivating; being #50,000 globally is demoralizing
- **Loss aversion** — Streaks and rankings you fear losing drive daily engagement

## Product Vision

### Core Features

**1. Leaderboard (the social hook)**
- Daily / weekly / monthly leaderboards
- Top users by: total tokens, total cost, sessions, projects touched
- Small-group leagues (Duolingo-style) — groups of ~15 users competing weekly
- Promotion/demotion between leagues for retention
- Filter by: all users, friends, same city, same company (opt-in)

**2. Personal Dashboard (the utility hook)**
- Beautiful visualizations of your usage across all Claude projects
- GitHub-contributions-style heatmap of daily Claude Code usage
- Per-project breakdown (pie/donut chart)
- Model usage split (Opus vs. Sonnet vs. Haiku)
- Token trends over time (line chart)
- Cost tracking with billing block awareness

**3. Shareable Cards (the viral hook)**
- One-click generate a "Claude Card" — a beautiful image of your stats
- Weekly auto-generated summary card
- Monthly "Claude Wrapped" style recap
- Purpose-built for Twitter/LinkedIn/Reddit sharing
- Embed in GitHub README (like WakaTime badges)

**4. Streaks & Achievements (the retention hook)**
- Daily usage streak counter
- Badges: "First 1M tokens", "10-project week", "Opus power user"
- Weekly goals with progress tracking

### User Flow

```
1. npx claude-board (or visit website)
2. Authenticate (GitHub OAuth)
3. Grant permission to read local ccusage data
4. Data is anonymized + uploaded to leaderboard API
5. See your dashboard + your ranking
6. Share your card on Twitter
7. Come back daily to check ranking / maintain streak
```

## Architecture

### Option A: Hybrid (local CLI + cloud leaderboard) — RECOMMENDED

```
Local machine                     Cloud
┌─────────────────┐              ┌──────────────────────┐
│ Claude Code      │              │  Leaderboard API     │
│ └─ JSONL logs    │              │  ├─ User rankings    │
│                  │   opt-in     │  ├─ League system     │
│ ccusage --json ──┼──upload──────▶  ├─ Card generator   │
│                  │              │  └─ Achievement engine│
│ Local dashboard  │◀──pull───────│                      │
└─────────────────┘   rankings   │  Web Dashboard       │
                                 │  └─ Public profiles   │
                                 └──────────────────────┘
```

- **Local**: Parse logs with ccusage, render personal dashboard
- **Cloud**: Lightweight API that receives opt-in usage summaries (not raw logs), computes rankings, generates cards
- **Privacy-first**: Only aggregated numbers leave the machine (total tokens/day, project count, model split) — never session content or file paths

### Tech Stack (suggested)

- **CLI**: Node.js / TypeScript (same ecosystem as ccusage)
- **Frontend**: Next.js or Astro for dashboard + card generation
- **Backend**: Edge functions (Vercel/Cloudflare Workers) — minimal infra
- **Database**: Supabase or PlanetScale for user stats + rankings
- **Auth**: GitHub OAuth (developers already have accounts)
- **Card generation**: Satori (HTML → SVG → PNG, same tech as Vercel OG images)

## MVP Scope (v0.1)

Ship the smallest thing that demonstrates the viral loop:

1. **CLI tool** (`npx claude-board`)
   - Reads local ccusage JSON output
   - Shows a personal usage dashboard in the terminal (pretty tables + sparklines)
   - `--share` flag: uploads summary to cloud, returns a shareable URL

2. **Web page** (one page per user)
   - Public profile showing: daily usage chart, top projects (names anonymized by default), model breakdown
   - "Today's Top Users" sidebar leaderboard
   - OG image auto-generated for Twitter/LinkedIn previews

3. **Global leaderboard page**
   - Daily / weekly / monthly tabs
   - Ranked by total tokens (most intuitive metric)
   - Shows username, tokens, session count, streak

**What's NOT in v0.1**: Leagues, achievements, badges, GitHub README embeds, teams, notifications.

## Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| **Privacy concerns** — developers won't upload usage data | High | Only upload aggregates (tokens/day, project count). Never raw logs. Clear privacy policy. Open-source the upload logic so people can audit it. |
| **Platform risk** — Anthropic builds this natively | High | Social/leaderboard layer is something platform vendors rarely build well. Anthropic might ship a dashboard but unlikely to build leagues + sharing. Move fast. |
| **Gaming** — users inflate stats | Medium | Not a real problem early on. Later: rate-limit uploads, flag anomalies, cap daily tokens at reasonable maximums. |
| **ccusage dependency** — breaking changes in upstream | Medium | Pin to specific version. Long-term: read JSONL logs directly (they're a stable format from Claude Code itself). |
| **Small user base** — leaderboard feels empty | High | Seed with "shadow profiles" from public ccusage users who share screenshots. Launch on Hacker News / r/ClaudeAI for initial wave. Leagues of 15 work even with 100 total users. |
| **"Hours at keyboard" toxicity** — devs mocking metric | Medium | Frame as celebration, not judgment. "Look how much you shipped with AI" not "you used more tokens than others". Badge names matter. |

## Monetization (future)

- **Free tier**: Personal dashboard, global leaderboard, 1 shareable card/week
- **Pro ($5/mo)**: Unlimited cards, private team leaderboards, historical data, GitHub badge embed, custom card themes
- **Team ($3/user/mo)**: Team leaderboard, manager-friendly aggregate view (no individual surveillance), Slack integration with weekly digest

This mirrors WakaTime's proven model — private leaderboards as the upsell.

## Success Metrics

- **Viral coefficient**: % of users who share a card → new signups from that card
- **WAU/MAU ratio**: Target >40% (healthy engagement)
- **Leaderboard check frequency**: Target daily
- **Streak retention**: % of users maintaining 7+ day streaks

## Competitive Landscape

| Tool | What It Does | What It Lacks |
|---|---|---|
| **ccusage** | CLI usage reports | No visuals, no social, no leaderboard |
| **Anthropic Console** | API usage dashboard | Only for API users, no subscription tracking |
| **WakaTime** | Coding time tracking | Doesn't track AI/LLM usage specifically |
| **Nothing else** | — | The social AI-usage tracking space is wide open |

## Name Ideas

- `claude-board` — leaderboard + dashboard
- `claude-wrapped` — Spotify Wrapped angle
- `ccleader` — short, ccusage-adjacent
- `tokenrank` — generic but descriptive
- `aiboard` — broader scope potential

## Next Steps

1. Validate: Run `npx ccusage@latest daily --json` and inspect the data shape
2. Build CLI MVP with terminal dashboard
3. Build single-page web app with leaderboard
4. Launch on Hacker News + r/ClaudeAI + Twitter
5. Iterate based on what users actually share

## Appendix: ccusage Technical Details

### CLI Commands

| Command | Description |
|---|---|
| `ccusage daily` | Usage grouped by date |
| `ccusage monthly` | Usage grouped by month |
| `ccusage weekly` | Usage grouped by week |
| `ccusage session` | Usage grouped by conversation session |
| `ccusage blocks` | Usage grouped by 5-hour billing blocks |
| `ccusage statusline` | Compact one-line status for status bar (Beta) |

### Data Available

- Input tokens and output tokens per session/day/period
- Cache creation tokens and cache read tokens
- Estimated USD cost (from live pricing API or cached offline)
- Per-model breakdown (Opus vs. Sonnet vs. Haiku)
- Session-level data (individual conversation sessions)
- 5-hour billing block tracking
- Project/instance grouping

### Key CLI Flags

- `--json` — JSON output for programmatic use
- `--jq` — built-in jq piping support
- `--breakdown` — per-model cost breakdown
- `--instances` — multi-project breakdown
- `--since` / `--until` — date filtering
- `--offline` — cached pricing, no network needed

### Known Limitations

1. Sub-task / parallel task tokens not captured (only parent session)
2. Statusline feature can cause CPU spikes (Beta)
3. RangeError on very large transcript files
4. Billing block reset time not configurable
