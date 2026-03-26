# devwrapped — Implementation Plan

## What We're Building

A social stats tracker for Claude Code developers. A Claude Code plugin automatically syncs usage stats after every session. Users get a beautiful shareable card, public profile, and leaderboard ranking — with zero daily effort.

**Name:** devwrapped
**Tagline:** "Your Claude Code stats, visualized and shared."
**Stack:** TypeScript monorepo (Turborepo) — Claude Code Plugin + CLI fallback (Node.js) + Web (Next.js on Vercel) + DB (Supabase)

### Primary Install Path

```
# Inside Claude Code — one-time setup, auto-syncs forever
/plugin marketplace add devwrapped-org/devwrapped-plugin
/plugin install devwrapped@devwrapped
```

### Fallback Install Path

```
# Terminal — manual sync when needed
npx devwrapped          # local stats preview
npx devwrapped sync     # manual upload
```

---

## Architecture

```
devwrapped/                          (turborepo monorepo)
├── apps/
│   ├── plugin/                   Claude Code plugin (PRIMARY install path)
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json       Plugin manifest
│   │   ├── hooks/
│   │   │   └── hooks.json        Hook event subscriptions
│   │   ├── dist/
│   │   │   ├── sync.js           Parse JSONL + POST to API (async, non-blocking)
│   │   │   └── auth.js           GitHub Device Flow (first-run only)
│   │   └── package.json
│   │
│   ├── cli/                      npm package "devwrapped" (FALLBACK, < 5MB)
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── sync.ts       Manual upload (backfill + catch missed hooks)
│   │   │   │   ├── card.ts       Open card URL in browser
│   │   │   │   ├── setup.ts      Install plugin config into settings.json
│   │   │   │   └── index.ts      Default: terminal summary
│   │   │   ├── auth.ts           GitHub Device Flow OAuth
│   │   │   └── index.ts          CLI entry point
│   │   └── package.json
│   │
│   └── web/                      Next.js on Vercel (devwrapped.dev)
│       ├── app/
│       │   ├── page.tsx          Landing page — sell the card + "Preview My Stats" demo
│       │   ├── [username]/
│       │   │   └── page.tsx      Public profile: heatmap, charts, trends
│       │   ├── leaderboard/
│       │   │   └── page.tsx      Daily / weekly / monthly rankings
│       │   └── api/
│       │       ├── sync/route.ts       POST — receive daily summaries
│       │       ├── card/[username]/
│       │       │   └── route.ts        GET — OG card image (Vercel OG / Satori)
│       │       └── auth/
│       │           └── device/route.ts GitHub Device Flow callback
│       └── package.json
│
├── packages/
│   └── core/                     Shared between plugin + CLI + web
│       ├── parser.ts             Forked JSONL parser (~800 lines)
│       ├── types.ts              Branded types + payload schema
│       ├── consts.ts             Log file paths, token limits, caps
│       └── payload.ts            Build sync payload from parsed data
│
├── turbo.json
└── package.json
```

### Data Flow

```
User's machine                              Cloud (Vercel + Supabase)
┌────────────────────────┐                 ┌─────────────────────────────┐
│ Claude Code             │                 │                             │
│ └─ ~/.config/claude/    │                 │  POST /api/sync             │
│    └─ projects/         │                 │  ├─ Validate payload        │
│       └─ *.jsonl        │                 │  ├─ Sanity check tokens     │
│                         │                 │  ├─ Upsert daily_stats      │
│ ┌─ AUTOMATIC (plugin) ─┐│                │  └─ Return profile URL      │
│ │ SessionEnd hook fires ││  async POST   │                             │
│ │ → parse transcript    ││──────────────▶│  GET /[username]            │
│ │ → aggregate tokens    ││               │  └─ Profile: heatmap,       │
│ │ → POST daily summary  ││               │     model chart, trends     │
│ └───────────────────────┘│                │                             │
│                         │                 │  GET /api/card/[username]   │
│ ┌─ FALLBACK (CLI) ─────┐│                │  └─ Satori → PNG card       │
│ │ npx devwrapped sync      ││  manual POST  │                             │
│ │ → full backfill       ││──────────────▶│  GET /leaderboard           │
│ └───────────────────────┘│                │  └─ Top users by tokens     │
│                         │                 │                             │
│ ┌─ DEMO (browser) ─────┐│                │  Landing page               │
│ │ File System Access API││  client-side  │  └─ "Preview My Stats"      │
│ │ → local preview only  ││  (no upload)  │     (reads local files      │
│ └───────────────────────┘│                │      in Chrome only)        │
└────────────────────────┘                 └─────────────────────────────┘
```

### Three Data Paths (Two Real, One Demo)

| Path | Trigger | Frequency | What Happens |
|---|---|---|---|
| **Plugin (primary)** | SessionEnd / Stop / SubagentStop hooks | Automatic, every session | Parse transcript JSONL → POST aggregates to API |
| **CLI (fallback)** | User runs `npx devwrapped sync` | Manual, on-demand | Full scan of all JSONL files → backfill missing days |
| **Web demo (preview)** | User clicks "Preview My Stats" on landing page | One-time, in-browser | File System Access API reads local logs → client-side render only, no upload |

Plugin and CLI share the same `packages/core` parser and payload builder. One real pipeline, one demo.

### Privacy Model

Only aggregated numbers leave the machine. Never raw logs, session content, file paths, or project names.

**What's uploaded:**

| Field | Purpose | Sensitive? |
|---|---|---|
| date | Group by day | No |
| inputTokens, outputTokens | Usage stats | No |
| cacheCreationTokens, cacheReadTokens | Cache efficiency | No |
| costUSD | Display on card (client-provided) | Low |
| sessionCount | "12 sessions today" stat | Low |
| projectCount | "Across 3 projects" stat | Low |
| modelBreakdowns | Pie chart on card | Low (reveals plan tier) |
| machine_id | Conflict detection only | No (hashed hostname) |

**What's NOT uploaded:** Session content, file paths, project names, timestamps within a day, raw JSONL data.

**Minimal mode:** `devwrapped sync --minimal` uploads tokens + date only (no model breakdown, session/project counts).

---

## Upload Payload Schema

```jsonc
// POST /api/sync
// Authorization: Bearer <github_oauth_token>
{
  "schema_version": 1,
  "client_version": "0.1.0",
  "machine_id": "a1b2c3",            // SHA-256(hostname), for conflict detection
  "days": [
    {
      "date": "2026-03-25",           // UTC date
      "inputTokens": 145200,
      "outputTokens": 52400,
      "cacheCreationTokens": 12000,
      "cacheReadTokens": 89000,
      "costUSD": 8.50,                // Client-provided, display-only
      "sessionCount": 12,
      "projectCount": 3,
      "modelBreakdowns": [
        {
          "modelName": "claude-opus-4-20250514",
          "inputTokens": 30000,
          "outputTokens": 8000,
          "cacheCreationTokens": 5000,
          "cacheReadTokens": 2000
        },
        {
          "modelName": "claude-sonnet-4-20250514",
          "inputTokens": 115200,
          "outputTokens": 44400,
          "cacheCreationTokens": 7000,
          "cacheReadTokens": 87000
        }
      ]
    }
  ]
}
```

### Server-Side Validation

```
- Max 1 sync per hour per user (idempotent upsert)
- Max 30 days of backfill per sync
- Reject any day with total_tokens > 15M (impossible on any plan)
- Reject costUSD > $50 or < $0
- Log anomalies for monitoring
```

---

## Database Schema

```sql
-- Users table
CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id       bigint UNIQUE NOT NULL,
  github_login    text NOT NULL,
  avatar_url      text,
  created_at      timestamptz DEFAULT now(),
  settings        jsonb DEFAULT '{}'
);

-- Daily stats (one row per user per day, upsert on sync)
CREATE TABLE daily_stats (
  user_id                 uuid REFERENCES users ON DELETE CASCADE,
  date                    date NOT NULL,
  input_tokens            bigint NOT NULL DEFAULT 0,
  output_tokens           bigint NOT NULL DEFAULT 0,
  cache_creation_tokens   bigint DEFAULT 0,
  cache_read_tokens       bigint DEFAULT 0,
  cost_usd                numeric(10,4),
  session_count           int,
  project_count           int,
  model_breakdowns        jsonb,
  machine_id              text,
  synced_at               timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

-- Indexes for leaderboard queries
CREATE INDEX idx_daily_stats_date
  ON daily_stats (date);

CREATE INDEX idx_daily_stats_tokens
  ON daily_stats (date, (input_tokens + output_tokens) DESC);
```

---

## Claude Code Plugin (Primary Install)

### Verified Platform Capabilities

Claude Code has a mature hooks system (24 events) and plugin marketplace. Verified against official docs and the WakaTime Claude Code plugin (v3.1.5) which uses the same architecture.

| Capability | Status | Source |
|---|---|---|
| SessionEnd hook | Exists (v1.0.85+) | Official docs |
| Receives `transcript_path` | Yes | Official docs |
| Async (non-blocking) hooks | Yes | Official docs |
| Plugin marketplace | Exists | Official docs, verified locally |
| HTTP hook type | Exists | Official docs |

### Known SessionEnd Reliability Issues

| Issue | Impact | Mitigation |
|---|---|---|
| Doesn't fire on `/exit` (GitHub #17885) | High — common exit method | Subscribe to `Stop` hook as backup |
| Doesn't fire on `/clear` (GitHub #6428) | Medium | Subscribe to `Stop` hook as backup |
| Doesn't fire on API 500 errors (GitHub #20197) | Low | CLI backfill catches these |

### Multi-Hook Strategy (WakaTime-Proven)

Subscribe to multiple hooks for redundancy. The sync script is idempotent — multiple hooks firing for the same session don't cause duplicate counts.

```json
// hooks/hooks.json
{
  "hooks": {
    "SessionEnd": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "node ${CLAUDE_PLUGIN_ROOT}/dist/sync.js",
        "async": true,
        "timeout": 30
      }]
    }],
    "Stop": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "node ${CLAUDE_PLUGIN_ROOT}/dist/sync.js",
        "async": true,
        "timeout": 30
      }]
    }],
    "SubagentStop": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "node ${CLAUDE_PLUGIN_ROOT}/dist/sync.js",
        "async": true,
        "timeout": 30
      }]
    }]
  }
}
```

### Sync Script Design (`dist/sync.js`)

**Constraints:**
- Must complete in < 2 seconds (user notices lag otherwise)
- Must be silent (no stdout/stderr unless error)
- Must be idempotent (same session parsed twice = same result)
- Must handle: no network, expired auth, malformed JSONL, large files

**Flow:**
1. Receive hook input on stdin (includes `transcript_path`, `session_id`)
2. Read and parse the JSONL transcript file
3. Aggregate tokens by model for today's date
4. Check local state (`~/.config/devwrapped/state.json`) — skip if session already synced
5. POST daily summary to `devwrapped.dev/api/sync`
6. Record synced session_id in local state
7. Exit 0 (always — never fail loudly)

**Local state file** (`~/.config/devwrapped/state.json`):
```json
{
  "synced_sessions": ["session-id-1", "session-id-2"],
  "last_sync": "2026-03-26T15:30:00Z",
  "auth_token": "gho_xxxx"
}
```

### Plugin Manifest

```json
// .claude-plugin/plugin.json
{
  "name": "devwrapped",
  "version": "0.1.0",
  "description": "Auto-sync your Claude Code usage stats to devwrapped.dev",
  "homepage": "https://devwrapped.dev",
  "repository": "https://github.com/devwrapped-org/devwrapped-plugin"
}
```

---

## Authentication

**Method:** GitHub Device Flow (OAuth device authorization grant)

**Why:** Works in SSH, containers, WSL, Codespaces — environments where Claude Code developers actually work. No localhost server needed, no redirect URI.

**Triggered by:** First sync attempt (either plugin hook or CLI command).

**Plugin flow:**
```
First time a hook fires after install:
→ Plugin detects no auth token in ~/.config/devwrapped/state.json
→ Queues auth for next interactive session
→ On next Stop hook, prints to stderr (visible in Claude Code):

  devwrapped: First-time setup needed.
  Run "npx devwrapped auth" to connect your GitHub account.
```

**CLI flow:**
```
$ npx devwrapped auth

! First, copy your one-time code: AB12-CD34
→ Press Enter to open github.com/login/device in your browser...

  [user approves in browser]

✓ Authentication complete. Welcome, @username!
  Token saved. Plugin will auto-sync from now on.
```

**Token storage:** `~/.config/devwrapped/state.json` with `chmod 0600`. Shared between plugin and CLI.

---

## Card Generation

**Tech:** Vercel OG (`@vercel/og`) — uses Satori under the hood. Runs at the edge.

**Route:** `GET /api/card/[username].png?theme=dark&period=week`

**Card contents:**
- GitHub avatar + username
- Total tokens (formatted: "2.4M tokens")
- Session count + project count
- Model usage pie chart (Opus / Sonnet / Haiku)
- Usage heatmap (mini GitHub-contribution-graph style)
- Time period label ("This week" / "This month" / "All time")
- devwrapped.dev branding

**OG meta tags:** Auto-set on profile pages so Twitter/LinkedIn unfurls show the card image.

**Caching (critical for scale):**
Card images only change when a user syncs (at most a few times/day). A viral tweet can trigger thousands of OG image fetches. Without caching, each fetch runs Satori (CPU-heavy, ~200-500ms). With caching, the CDN absorbs 99%+ of traffic.

```
GET /api/card/[username].png
  → Vercel Edge Cache HIT: serve cached image (0ms, $0)
  → MISS: generate with Satori, cache for 1 hour

Headers:
  Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
```

---

## Scaling & Caching Strategy

### Why This Matters

A successful launch (HN + viral cards) could drive 10K+ users quickly. The architecture must handle spiky traffic without surprise bills.

### Estimated Traffic at Scale (10K users)

```
Sync endpoint:     100,000 POSTs/day     → DB writes, can't cache
Profile pages:      50,000 views/day      → cache with ISR
Card images:       200,000 fetches/day    → cache at CDN edge
Leaderboard:        20,000 views/day      → cache with ISR
Landing page:       30,000 views/day      → static, cached
```

### Caching Rules

| Route | Strategy | TTL | Why |
|---|---|---|---|
| `/api/card/[username].png` | Vercel Edge Cache (CDN) | 1 hour (`s-maxage=3600`) | Cards change at most a few times/day. CDN absorbs viral spikes. |
| `/[username]` (profile) | ISR (Incremental Static Regeneration) | 5 min (`revalidate: 300`) | Profile data changes on sync. 5 min staleness is acceptable. |
| `/leaderboard` | ISR | 5 min (`revalidate: 300`) | Rankings don't need to be real-time. |
| `/` (landing page) | Static | Build-time | Changes only on deploy. |
| `POST /api/sync` | No cache | N/A | Write endpoint, every request hits DB. |

### Cost Estimate

| Component | Without Caching | With Caching |
|---|---|---|
| Card generation (Satori) | ~200K renders/day | ~240 renders/day (24 per user, rest served from CDN) |
| Profile pages | 50K SSR/day | Static from edge cache |
| **Vercel total** | ~$60-80/mo | ~$25-30/mo |
| **Supabase total** | $0 (free) → $25/mo (Pro when needed) | Same |
| **Total at 10K users** | ~$85-105/mo | **~$25-55/mo** |

### Supabase Tier Strategy

```
Development (weeks 1-4):     Free tier — you're hitting DB daily, no auto-pause
Pre-launch buffer:           Free tier + GitHub Actions keep-alive cron (every 5 days)
Launch (week 5):             Free tier — traffic keeps it alive
Post-launch if sticky:       Upgrade to Pro ($25/mo) when you want backups or hit limits
```

**Keep-alive cron** (prevents free tier auto-pause during quiet periods):
```yaml
# .github/workflows/keep-alive.yml
name: Supabase Keep Alive
on:
  schedule:
    - cron: '0 0 */5 * *'  # every 5 days
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl -s "${{ secrets.SUPABASE_URL }}/rest/v1/" -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}"
```

---

## CLI Commands (Fallback / Manual Use)

The CLI is a fallback for users who prefer the terminal, need to backfill data, or debug sync issues.

```
devwrapped                   Show terminal usage summary (local only, no upload)
devwrapped auth              GitHub Device Flow — authenticate + save token
devwrapped auth --logout     Remove stored credentials
devwrapped sync              Manual full sync — backfills all missing days
devwrapped sync --minimal    Upload tokens + date only (no model/session/project)
devwrapped card              Open your card URL in browser
devwrapped card --copy       Copy card URL to clipboard
devwrapped status            Show sync status: last sync time, sessions synced, auth state
```

---

## Multi-Machine Conflict Detection

Claude Code logs are local per machine. If a user syncs from two machines, the second sync would overwrite the first.

**v0.1 approach:** Detect and warn, don't silently overwrite.

```
$ devwrapped sync
⚠ Conflict detected for 2026-03-25:
  Last sync: 150K tokens (from machine "work-mbp")
  This machine: 80K tokens
  Syncing will overwrite. Continue? [y/N]
```

**Implementation:** `machine_id` (hashed hostname) stored with each daily_stats row. CLI queries last sync metadata before uploading to detect conflicts.

---

## Testing Strategy

| Layer | Approach | Priority | Gate |
|---|---|---|---|
| Core parser | Unit tests with JSONL fixture files | P0 | Must pass before merge |
| Payload builder | Unit tests — pure function, all edge cases | P0 | Must pass before merge |
| Plugin sync script | Unit tests with mock hook input + fixture JSONL | P0 | Must pass before merge |
| Plugin idempotency | Test: same session triggered by multiple hooks = single upload | P0 | Must pass before merge |
| Sync API | Integration tests against Supabase local | P1 | Must pass before launch |
| Card generation | Snapshot test of SVG output | P1 | Must pass before launch |
| CLI commands | Integration tests with temp JSONL dirs | P2 | Nice to have |
| OAuth flow | Manual testing only | P2 | Manual QA |

**Edge cases to cover in payload builder tests:**
- Empty day (0 tokens)
- Single model only
- Zero cache tokens
- Max token values (at the 15M cap)
- Missing optional fields
- Minimal mode (--minimal flag)
- Invalid dates

**Edge cases to cover in plugin sync tests:**
- SessionEnd fires with transcript_path to empty JSONL file
- Stop hook fires mid-session (partial data — should still sync what's there)
- Multiple hooks fire within seconds for same session (idempotency)
- No auth token yet (first run — should not crash, should queue auth)
- Network failure during POST (should fail silently, retry on next hook)
- Very large transcript file (>100MB — should stream, not load into memory)

---

## Build Phases

### Phase 1 — Core Foundation (Week 1)

**Goal:** Shared parser and payload builder with full test coverage.

- [ ] Verify npm name "devwrapped" is available
- [ ] Initialize turborepo monorepo structure
- [ ] Fork JSONL parser into `packages/core/parser.ts` (~800 lines)
  - Strip session-block and billing-block logic (not needed)
  - Keep: path resolution, streaming parser, dedup, date grouping
  - Keep: branded types from `_types.ts`
- [ ] Build `packages/core/payload.ts` — transform parsed data into sync payload
- [ ] Build `packages/core/types.ts` — payload schema, API types
- [ ] Write P0 unit tests for parser + payload builder
- [ ] Set up CI (GitHub Actions: lint + typecheck + test)

### Phase 2 — Plugin + CLI (Week 2)

**Goal:** Working plugin that auto-syncs + CLI fallback for manual use.

**Plugin:**
- [ ] Plugin manifest (`.claude-plugin/plugin.json`)
- [ ] Hook subscriptions (`hooks/hooks.json` — SessionEnd, Stop, SubagentStop)
- [ ] Sync script (`dist/sync.js`) — parse transcript, aggregate, POST
- [ ] Idempotency via local session tracking (`~/.config/devwrapped/state.json`)
- [ ] Silent failure handling (never crash, never block Claude Code)
- [ ] P0 unit tests for sync script + idempotency
- [ ] Plugin marketplace repo setup (GitHub)

**CLI:**
- [ ] CLI entry point with command routing
- [ ] `devwrapped` default command — terminal summary table (pretty-printed)
- [ ] `devwrapped auth` — GitHub Device Flow implementation (shared with plugin)
- [ ] `devwrapped sync` — full backfill of all missing days
- [ ] `devwrapped sync --minimal` — reduced payload mode
- [ ] `devwrapped card` — open profile URL in default browser
- [ ] `devwrapped status` — show sync health, last sync time, auth state
- [ ] Conflict detection (query last sync, warn on machine_id mismatch)
- [ ] Integration tests with fixture JSONL directories

### Phase 3 — Web Backend (Week 3)

**Goal:** API endpoints + database working.

- [ ] Supabase project setup + schema migration
- [ ] `POST /api/sync` — validate, sanity check, upsert daily_stats
- [ ] `GET /api/card/[username].png` — Vercel OG card generation with edge caching (`s-maxage=3600`)
- [ ] GitHub Device Flow callback endpoint
- [ ] Row-level security policies in Supabase
- [ ] Rate limiting (1 sync/hour/user)
- [ ] Supabase keep-alive GitHub Action cron (for free tier)
- [ ] Integration tests against Supabase local

### Phase 4 — Web Frontend (Week 4)

**Goal:** Profile pages, leaderboard, landing page.

- [ ] Landing page — explain product, show example cards, CTA to install plugin
- [ ] "Preview My Stats" demo using File System Access API (Chrome only, client-side)
- [ ] `[username]` profile page (ISR, `revalidate: 300`):
  - GitHub-contributions-style heatmap
  - Model usage breakdown (pie/donut chart)
  - Token trends over time (line chart)
  - Per-day stats table
- [ ] Leaderboard page (ISR, `revalidate: 300`):
  - Daily / weekly / monthly tabs
  - Ranked by total tokens (input + output)
  - Shows: avatar, username, tokens, session count, streak
- [ ] OG meta tags on profile pages (auto-unfurl on social)
- [ ] Card snapshot tests

### Phase 5 — Polish + Launch (Week 5)

**Goal:** Production-ready, tested, launched.

- [ ] Test OG image unfurling on Twitter, LinkedIn, Slack
- [ ] Error states and empty states for all pages
- [ ] Mobile-responsive profile + leaderboard
- [ ] CLI error messages (no logs found, auth failed, network error)
- [ ] Plugin first-run experience (no auth → prompt user to run `npx devwrapped auth`)
- [ ] README with install instructions + screenshots
- [ ] Submit plugin to official Anthropic marketplace (goal: `/plugin install devwrapped`)
- [ ] Launch:
  - [ ] Hacker News "Show HN" post
  - [ ] r/ClaudeAI post
  - [ ] Twitter/X thread with own card as proof
  - [ ] Claude Code Discord (if exists)

---

## Key Decisions Log

| # | Decision | Rationale |
|---|---|---|
| 1 | **Plugin as primary install, CLI as fallback** | Auto-sync via hooks = zero daily friction. WakaTime proved this model. CLI catches anything hooks miss. |
| 2 | **Multi-hook strategy (SessionEnd + Stop + SubagentStop)** | SessionEnd is unreliable (doesn't fire on /exit). Multiple hooks with idempotent sync = reliable coverage. |
| 3 | Fork JSONL parser, don't shell out to ccusage | Shell-out has too many edge cases; daily --json lacks sessionCount/projectCount |
| 4 | Separate plugin + CLI + web packages in monorepo | Plugin must be lightweight; CLI < 5MB for npx; web has heavy deps neither needs |
| 5 | GitHub Device Flow for auth | Works in SSH, containers, WSL, Codespaces |
| 6 | Client-side cost for v0.1 | Server-side pricing is complex; gaming risk near-zero at small scale |
| 7 | Cards/profiles as viral core, not leaderboard | Global leaderboard is demoralizing without critical mass; cards are valuable even solo |
| 8 | Drop active_minutes | JSONL logs don't have duration data; can't accurately measure |
| 9 | Single-machine sync with conflict warning | Multi-machine merge is complex; warn and document for v0.1 |
| 10 | Leaderboard ranks by tokens, not cost | Cost is plan-dependent (pay-to-win); tokens are more equitable |
| 11 | No leagues/badges/streaks in v0.1 | Ship the viral loop first; retention features come after traction |
| 12 | Separate product from ccusage | Reduces upstream dependency risk; own brand, own release cycle |
| 13 | File System Access API as landing page demo only | Zero-install "wow moment" in Chrome; funnels to plugin install for real use |
| 14 | **Aggressive edge caching for cards + ISR for pages** | Card images cached 1hr at CDN edge; profiles/leaderboard revalidate every 5min. Turns 200K Satori renders/day into ~240. |
| 15 | **Supabase free tier to start, Pro when needed** | Free tier works for dev + launch. Keep-alive cron prevents auto-pause. Upgrade to Pro ($25/mo) when backups or limits matter. |

---

## What's NOT in v0.1

- Leagues (Duolingo-style small groups)
- Achievements / badges
- Streak tracking
- Team leaderboards
- GitHub README embeds / badges
- VS Code extension (v0.2 — secondary sync channel)
- Slack integration
- Email notifications
- Server-side cost calculation
- Multi-machine sync merging
- Custom card themes
- Historical data backfill beyond 30 days

---

## Future Monetization (Post-Traction)

- **Free:** Personal profile, global leaderboard, 1 card theme
- **Pro ($5/mo):** Unlimited themes, private team leaderboards, historical data, GitHub badge embed
- **Team ($3/user/mo):** Team leaderboard, aggregate view, Slack weekly digest
