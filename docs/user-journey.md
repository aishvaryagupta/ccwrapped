# devwrapped — User Journey

## Overview

There are four entry points into devwrapped. Every path leads to the same viral loop: **see stats → share card → others discover → install → repeat.**

### Install Paths (Ranked by Friction)

| Path | Friction | Steps | For Whom |
|---|---|---|---|
| **Web preview** (File System Access API) | Zero install | Click → pick folder → see stats | Curious browsers (Chrome only) |
| **Plugin** (primary) | One-time, 2 commands | `/plugin marketplace add` → `/plugin install` | All Claude Code users |
| **CLI** (fallback) | Per-use | `npx devwrapped sync` | Terminal lovers, plugin-averse, backfill |

---

## Journey 1: The Organic Discovery (Most Common)

> "I saw someone's card on Twitter and I want one."

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Twitter / LinkedIn / Reddit                                        │
│  ┌───────────────────────────────────────────┐                      │
│  │  @devuser                                 │                      │
│  │  "Shipped 3 features this week with       │                      │
│  │   Claude Code. Here are my stats 👇"      │                      │
│  │                                           │                      │
│  │  ┌───────────────────────────────────┐    │                      │
│  │  │  🟣 devuser's Claude Code Week    │    │                      │
│  │  │                                   │    │                      │
│  │  │  1.2M tokens · 42 sessions        │    │                      │
│  │  │  8 projects · Opus 68%            │    │                      │
│  │  │                                   │    │                      │
│  │  │  ▓▓▓▓░░▓▓▓▓▓░▓▓▓▓▓▓▓░░░░         │    │                      │
│  │  │                                   │    │                      │
│  │  │  devwrapped.dev/devuser              │    │                      │
│  │  └───────────────────────────────────┘    │                      │
│  └───────────────────────────────────────────┘                      │
│                                                                     │
│  User thinks: "I want one of those."                                │
│  Clicks the card → lands on devwrapped.dev/devuser                     │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  devwrapped.dev/devuser (Public Profile)                               │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  👤 devuser                                                 │    │
│  │                                                             │    │
│  │  Heatmap:  ░░▓▓░▓▓▓░▓▓▓▓▓░░▓▓▓▓░▓░░░▓▓▓░▓▓▓▓▓▓░░        │    │
│  │            Jan        Feb        Mar                        │    │
│  │                                                             │    │
│  │  Model Split:  ██████ Opus 68%                              │    │
│  │                ████ Sonnet 28%                               │    │
│  │                █ Haiku 4%                                    │    │
│  │                                                             │    │
│  │  This Month: 4.8M tokens · 156 sessions · 12 projects      │    │
│  │                                                             │    │
│  │  ┌──────────────────────────────────────────────┐           │    │
│  │  │  Want your own stats?                        │           │    │
│  │  │  /plugin install devwrapped   (auto-sync)       │           │    │
│  │  │  — or —                                      │           │    │
│  │  │  $ npx devwrapped             (one-time view)   │           │    │
│  │  └──────────────────────────────────────────────┘           │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  User sees the CTA → opens terminal                                 │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
                    [ → Jump to INSTALL FLOW below ]
```

---

## Journey 2: The Power User (ccusage Existing User)

> "I already use ccusage. I want more than terminal tables."

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  User already runs ccusage daily. Sees devwrapped on:                  │
│  - ccusage GitHub README ("Also check out devwrapped")                 │
│  - npm weekly email ("trending: devwrapped")                           │
│  - Hacker News / r/ClaudeAI launch post                             │
│                                                                     │
│  User thinks: "Finally, a visual layer for my usage data."          │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
                    [ → Jump to INSTALL FLOW below ]
```

---

## Journey 3: The HN / Reddit Browser

> "Saw it on Hacker News. Let me check if it's any good."

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Hacker News: "Show HN: devwrapped — Spotify Wrapped for Claude Code" │
│                                                                     │
│  User clicks → lands on devwrapped.dev (landing page)                  │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  devwrapped.dev (Landing Page)                                         │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                                                             │    │
│  │   Your Claude Code stats.                                   │    │
│  │   Visualized. Shared. Ranked.                               │    │
│  │                                                             │    │
│  │   [Example card image — looks beautiful]                    │    │
│  │                                                             │    │
│  │   See how much you ship with AI.                            │    │
│  │   One command. Your stats. A card to share.                 │    │
│  │                                                             │    │
│  │   Set up once. Auto-syncs forever.                          │    │
│  │                                                             │    │
│  │   /plugin install devwrapped                                   │    │
│  │                                                             │    │
│  │   ─────────────────────────────────────────                 │    │
│  │                                                             │    │
│  │   🔒 Privacy first                                         │    │
│  │   Only daily token totals leave your machine.               │    │
│  │   No code. No chats. No file paths. Open source.            │    │
│  │                                                             │    │
│  │   ─────────────────────────────────────────                 │    │
│  │                                                             │    │
│  │   [Preview My Stats]  [View Leaderboard]  [Example Profile] │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  User is convinced → opens terminal                                 │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
                    [ → INSTALL FLOW ]
```

---

## Install Flow (All Journeys Converge Here)

There are three paths into devwrapped. The first two require no CLI install at all.

### Path A: Zero-Install Web Preview (Chrome Only)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Browser: devwrapped.dev                                               │
│                                                                     │
│  User clicks [Preview My Stats] on landing page                     │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                                                             │    │
│  │  Browser dialog:                                            │    │
│  │  "devwrapped.dev wants to read files from a folder"            │    │
│  │                                                             │    │
│  │  User navigates to:                                         │    │
│  │  ~/.config/claude/projects/                                 │    │
│  │  (site shows path hint + "press Cmd+Shift+. for hidden")   │    │
│  │                                                             │    │
│  │  [Select Folder]                                            │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  Client-side JS parses all JSONL files in the browser.              │
│  Nothing is uploaded. Dashboard renders instantly.                   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                                                             │    │
│  │  📊 Your Claude Code Stats (local preview)                  │    │
│  │                                                             │    │
│  │  This Month  4,821,300 tokens  156 sessions   12 projects   │    │
│  │  Models: Opus 68% · Sonnet 28% · Haiku 4%                  │    │
│  │                                                             │    │
│  │  [Heatmap]  [Model Chart]  [Trend Line]                    │    │
│  │                                                             │    │
│  │  ─────────────────────────────────────────                  │    │
│  │  Want to share this + auto-sync daily?                      │    │
│  │  Install the plugin: /plugin install devwrapped                │    │
│  │  ─────────────────────────────────────────                  │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ✓ Zero install. Zero upload. Instant "wow moment."                 │
│  ✓ Funnels to plugin install for persistent use.                    │
│  ✗ Chrome/Edge/Arc only. No Firefox/Safari.                         │
│  ✗ On return visits, Chrome re-prompts for folder access.           │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │  User wants auto-sync + shareable card
                           ▼
```

### Path B: Plugin Install (Primary — Recommended)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Claude Code (terminal or IDE)                                      │
│                                                                     │
│  Step 1: Add marketplace (one-time)                                 │
│  > /plugin marketplace add devwrapped-org/devwrapped-plugin               │
│                                                                     │
│  ✓ Marketplace "devwrapped" added.                                     │
│                                                                     │
│  Step 2: Install plugin (one-time)                                  │
│  > /plugin install devwrapped@devwrapped                                  │
│                                                                     │
│  ✓ Plugin "devwrapped" installed.                                      │
│    Auto-sync enabled for all future sessions.                       │
│    Run "npx devwrapped auth" to connect your GitHub account.           │
│                                                                     │
│  ─────────────────────────────────────────────────────────────      │
│                                                                     │
│  Step 3: Authenticate (one-time)                                    │
│  $ npx devwrapped auth                                                 │
│                                                                     │
│  ! Copy your one-time code: AB12-CD34                               │
│  Press Enter to open github.com in your browser...                  │
│                                                                     │
│  → Browser opens to github.com/login/device                         │
│  → User pastes code AB12-CD34                                       │
│  → User clicks "Authorize devwrapped"                                  │
│                                                                     │
│  ✓ Authentication complete. Welcome, @username!                     │
│                                                                     │
│  Backfilling your last 14 days of usage...                          │
│    ├─ 2026-03-12  ·  89K tokens   ·  4 sessions                    │
│    ├─ 2026-03-13  · 201K tokens   · 11 sessions                    │
│    │  ... (14 days)                                                 │
│    └─ 2026-03-25  · 245K tokens   ·  6 sessions                    │
│  ✓ 14 days synced.                                                  │
│                                                                     │
│  Your profile: https://devwrapped.dev/username                         │
│  Open in browser? [Y/n]                                             │
│                                                                     │
│  ─────────────────────────────────────────────────────────────      │
│                                                                     │
│  ✓ Done. From now on, every session auto-syncs in background.       │
│  ✓ You never run this again. It just works.                         │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │  Browser opens to profile
                           ▼
```

### Path C: CLI Only (Fallback)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Terminal                                                           │
│                                                                     │
│  $ npx devwrapped                                                      │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                                                             │    │
│  │  📊 Your Claude Code Stats                                  │    │
│  │                                                             │    │
│  │  Today         245,102 tokens    6 sessions    2 projects   │    │
│  │  This Week   1,102,450 tokens   42 sessions    8 projects   │    │
│  │  This Month  4,821,300 tokens  156 sessions   12 projects   │    │
│  │                                                             │    │
│  │  Models: Opus 68% · Sonnet 28% · Haiku 4%                  │    │
│  │                                                             │    │
│  │  ─────────────────────────────────────────                  │    │
│  │  Want auto-sync? Install the plugin:                        │    │
│  │  /plugin install devwrapped                                    │    │
│  │                                                             │    │
│  │  Or sync manually: devwrapped sync                             │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  $ devwrapped sync                                                     │
│  → Auth flow (same GitHub Device Flow as plugin path)               │
│  → Uploads 14 days of data                                          │
│  → Opens profile in browser                                         │
│                                                                     │
│  ✓ Works without plugin. Manual sync whenever you want.             │
│  ✗ Must remember to run. No auto-sync.                              │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │  Browser opens to profile
                           ▼
```

### Step 4: Profile Page — The "Wow" Moment

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Browser: devwrapped.dev/username                                      │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                                                             │    │
│  │  [avatar] username                                          │    │
│  │  Joined March 2026                                          │    │
│  │                                                             │    │
│  │  ┌─── Usage Heatmap ──────────────────────────────────┐     │    │
│  │  │                                                    │     │    │
│  │  │  Mon  ░░▓▓░▓▓▓░░▓▓▓▓░░▓▓▓▓▓░░▓▓░░▓▓▓▓░▓▓▓▓░     │     │    │
│  │  │  Tue  ░▓▓▓▓░░▓▓▓░▓▓▓▓▓░░▓▓▓░▓▓▓▓▓░▓▓▓▓▓░▓▓░     │     │    │
│  │  │  Wed  ▓▓░▓▓▓▓░▓▓▓▓░░▓▓▓░▓▓▓▓▓░▓▓▓░░▓▓▓▓▓░░░     │     │    │
│  │  │  Thu  ░▓▓▓░▓▓▓▓▓░▓▓▓▓░▓▓▓░░▓▓▓▓▓▓▓░▓▓▓▓▓▓▓░     │     │    │
│  │  │  Fri  ▓▓▓▓▓░░▓▓▓▓▓▓░░▓▓▓▓▓▓░▓▓▓▓░▓▓▓░▓▓▓▓░░     │     │    │
│  │  │  Sat  ░░░░▓░░░░░▓▓░░░░░░░▓▓░░░░░▓▓░░░░░░▓░░░     │     │    │
│  │  │  Sun  ░░░░░░░░░▓░░░░░░░░░░░░░░▓░░░░░░░░░░░░░░     │     │    │
│  │  │       Feb                     Mar                  │     │    │
│  │  └────────────────────────────────────────────────────┘     │    │
│  │                                                             │    │
│  │  ┌─── This Month ────────────────────────────────────┐      │    │
│  │  │                                                    │     │    │
│  │  │   4.8M tokens    156 sessions    12 projects       │     │    │
│  │  │                                                    │     │    │
│  │  └────────────────────────────────────────────────────┘     │    │
│  │                                                             │    │
│  │  ┌── Models ──┐  ┌── Token Trend ────────────────────┐     │    │
│  │  │            │  │                        ╱╲          │     │    │
│  │  │  ██ Opus   │  │              ╱╲      ╱  ╲╱╲       │     │    │
│  │  │  68%       │  │        ╱╲  ╱  ╲╱╲  ╱      ╲      │     │    │
│  │  │            │  │  ╱╲  ╱  ╲╱      ╲╱          ╲     │     │    │
│  │  │  ▓▓ Sonnet │  │ ╱  ╲╱                              │     │    │
│  │  │  28%       │  │ Mar 1        Mar 13       Mar 25   │     │    │
│  │  │            │  └────────────────────────────────────┘     │    │
│  │  │  ░░ Haiku  │                                             │    │
│  │  │  4%        │  Leaderboard Rank: #47 this week            │    │
│  │  └────────────┘                                             │    │
│  │                                                             │    │
│  │  ┌──────────────────────────────────────┐                   │    │
│  │  │  📋 Copy Card URL  │  ⬇ Download Card │                  │    │
│  │  └──────────────────────────────────────┘                   │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  This is the moment the user feels: "This looks amazing."           │
│  They want to share it.                                             │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │  User clicks "Copy Card URL"
                           ▼
```

### Step 5: Share — The Viral Moment

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  User pastes devwrapped.dev/username on Twitter                        │
│                                                                     │
│  Twitter fetches OG image from:                                     │
│  GET devwrapped.dev/api/card/username.png                              │
│                                                                     │
│  Tweet renders as:                                                  │
│  ┌───────────────────────────────────────────┐                      │
│  │  @username                                │                      │
│  │  "Shipped hard this week with Claude Code" │                      │
│  │                                           │                      │
│  │  ┌───────────────────────────────────┐    │                      │
│  │  │                                   │    │                      │
│  │  │  username's Claude Code Week      │    │                      │
│  │  │                                   │    │                      │
│  │  │  1.2M tokens · 42 sessions        │    │                      │
│  │  │  8 projects                       │    │                      │
│  │  │                                   │    │                      │
│  │  │  Opus ████████░░ 68%              │    │                      │
│  │  │  Sonnet ████░░░░ 28%              │    │                      │
│  │  │  Haiku █░░░░░░░░  4%              │    │                      │
│  │  │                                   │    │                      │
│  │  │  ▓▓░▓▓▓░▓▓▓▓▓░▓▓▓▓░▓▓▓▓▓▓░      │    │                      │
│  │  │                                   │    │                      │
│  │  │  devwrapped.dev                      │    │                      │
│  │  └───────────────────────────────────┘    │                      │
│  └───────────────────────────────────────────┘                      │
│                                                                     │
│  Someone sees this card → clicks → lands on profile                 │
│  → sees CTA → installs plugin → THE LOOP REPEATS                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Returning User Flow (Day 2+)

### With Plugin: Zero Effort (The Fitbit Model)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  User uses Claude Code normally. Finishes a session.                │
│                                                                     │
│  Behind the scenes (user doesn't see this):                         │
│  ├─ SessionEnd/Stop hook fires                                      │
│  ├─ sync.js parses transcript → aggregates tokens                   │
│  ├─ POSTs daily summary to devwrapped.dev/api/sync                     │
│  └─ Records session_id in local state (idempotent)                  │
│                                                                     │
│  User's profile at devwrapped.dev/username is always up-to-date.       │
│  Card image refreshes automatically.                                │
│                                                                     │
│  The user does NOTHING. Data just appears.                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Checking Stats (When Curious)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  User opens devwrapped.dev/username whenever they feel like it         │
│                                                                     │
│  Their data is already there because plugin synced after each       │
│  session. No manual step needed.                                    │
│                                                                     │
│  What draws them back:                                              │
│  - "Am I up or down vs last week?"                                  │
│  - "Did I move on the leaderboard?"                                 │
│  - "What's my model split trending toward?"                         │
│  - Fresh card to share on Monday morning                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Without Plugin: Manual Sync (CLI Fallback)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  $ devwrapped sync                                                     │
│                                                                     │
│  Syncing 1 new day...                                               │
│  ✓ 2026-03-26 · 312K tokens · 14 sessions · 4 projects             │
│                                                                     │
│  This week: 1.4M tokens (↑ 27% from last week)                     │
│  Leaderboard: #39 weekly (↑ 8 spots)                                │
│                                                                     │
│  View: https://devwrapped.dev/username                                 │
│                                                                     │
│  Tip: Install the plugin for auto-sync: /plugin install devwrapped     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Weekly Card Refresh

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Every Monday, the card at devwrapped.dev/api/card/username.png        │
│  automatically reflects last week's data.                           │
│                                                                     │
│  Plugin users: Card is always fresh. Just open and share.           │
│  CLI users: Run "devwrapped sync" first, then share.                   │
│                                                                     │
│  User's habit:                                                      │
│  Monday morning → open profile → screenshot card → post on Twitter  │
│                                                                     │
│  This becomes a weekly ritual. Like posting a gym selfie,           │
│  but for AI-assisted coding.                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Leaderboard Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Browser: devwrapped.dev/leaderboard                                   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                                                             │    │
│  │  Leaderboard    [Daily]  [Weekly]  [Monthly]                │    │
│  │                                                             │    │
│  │  This Week · March 23 – 29, 2026                            │    │
│  │                                                             │    │
│  │  #   User          Tokens      Sessions   Projects          │    │
│  │  ──────────────────────────────────────────────────          │    │
│  │  1   @powerdev     3.2M        89         14                │    │
│  │  2   @shipfast     2.8M        76         11                │    │
│  │  3   @aibuilder    2.5M        64          9                │    │
│  │  ...                                                        │    │
│  │  39  @username     1.4M        42          8    ← YOU       │    │
│  │  ...                                                        │    │
│  │  ──────────────────────────────────────────────────          │    │
│  │                                                             │    │
│  │  248 developers ranked this week                            │    │
│  │                                                             │    │
│  │  Not on the board? /plugin install devwrapped                   │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  The leaderboard is a soft competitive hook — not the main event.   │
│  The card is the main event. The leaderboard gives context:         │
│  "I'm in the top 16% of Claude Code users this week."              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Edge Cases & Error States

### No Claude Code Logs Found

```
$ npx devwrapped

  ⚠ No Claude Code usage logs found.

  Checked:
    ~/.config/claude/projects/   (empty)
    ~/.claude/projects/          (not found)

  Are you using Claude Code? Logs are created automatically
  when you use Claude Code in any project.

  If your logs are in a custom location, set:
    CLAUDE_CONFIG_DIR=/path/to/logs devwrapped
```

### No Usage Data in Date Range

```
$ npx devwrapped

  📊 Your Claude Code Stats

  No usage data found for the last 30 days.

  Last activity: 2026-02-14 (40 days ago)

  Tip: Start using Claude Code and run devwrapped again!
```

### Sync Conflict (Multi-Machine)

```
$ devwrapped sync

  ⚠ Conflict detected for 2 days:

    2026-03-25:
      Last sync:    150K tokens (from "work-mbp")
      This machine:  80K tokens

    2026-03-26:
      Last sync:    200K tokens (from "work-mbp")
      This machine: 120K tokens

  Syncing will overwrite with this machine's data.
  Continue? [y/N]

  Tip: For best results, always sync from the same machine.
```

### Network Error During Sync

```
$ devwrapped sync

  Syncing usage data...
  ✗ Failed to reach devwrapped.dev (network error)

  Your local stats are unaffected.
  Try again later: devwrapped sync
```

### Auth Token Expired

```
$ devwrapped sync

  ⚠ Your GitHub session has expired.
  Let's re-authenticate.

  ! Copy your one-time code: XY78-ZW90
  Press Enter to open github.com in your browser...
```

### Plugin Installed But Not Authenticated

```
  (After a Claude Code session ends, user sees in stderr:)

  devwrapped: Not authenticated yet. Your stats are not being synced.
  Run "npx devwrapped auth" to connect your GitHub account.
```

### Plugin Sync Failed Silently

```
  (User notices stale data on devwrapped.dev/username)

  $ devwrapped status

  Plugin: installed ✓
  Auth: authenticated as @username ✓
  Last successful sync: 2026-03-24 (2 days ago) ⚠
  Sessions since last sync: 8

  Looks like recent syncs failed. Running manual backfill...

  $ devwrapped sync
  ✓ 2 days backfilled. Profile is up to date.
```

### File System Access API — Safari/Firefox User

```
  (User clicks "Preview My Stats" on landing page)

  ┌─────────────────────────────────────────────────────────────┐
  │                                                             │
  │  Browser preview requires Chrome, Edge, or Arc.             │
  │                                                             │
  │  Alternatively:                                             │
  │  • Install the plugin: /plugin install devwrapped              │
  │  • Or run in terminal: npx devwrapped                          │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘
```

---

## The Complete Viral Loop

```
                    ┌──────────────────────┐
                    │                      │
                    │  See card on social   │
                    │  media / HN / Reddit │
                    │                      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │                      │
                    │  Visit devwrapped.dev   │
                    │  or profile page     │
                    │                      │
                    └──────────┬───────────┘
                               │
                               ▼
                               │
                     ┌─────────┴─────────┐
                     │                   │
                     ▼                   ▼
          ┌──────────────────┐ ┌──────────────────┐
          │  "Preview Stats" │ │  Install plugin   │
          │  (zero install)  │ │  (2 commands)     │
          └────────┬─────────┘ └────────┬─────────┘
                   │                    │
                   └────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │                      │
                    │  View profile +      │
                    │  download card       │
                    │                      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │                      │
              ┌─────│  Share card on       │
              │     │  Twitter / LinkedIn  │
              │     │                      │
              │     └──────────────────────┘
              │
              │     Someone else sees it
              │
              └──────────► LOOP REPEATS
```

---

## Metrics That Indicate Health

| Metric | What It Tells Us | Target |
|---|---|---|
| Landing page → plugin install rate | Is the value prop clear? | > 20% |
| Landing page → web preview rate | Is the demo compelling? | > 30% |
| Web preview → plugin install rate | Does the "wow moment" convert? | > 25% |
| Plugin install → auth completion rate | Is auth friction acceptable? | > 60% |
| Plugin auto-sync success rate | Is the hook reliable? | > 90% |
| Profile visit → share rate | Is the card compelling enough to share? | > 15% |
| Card view → install rate | Is the viral loop working? | > 5% |
| Weekly return rate (profile visits) | Are users coming back? | > 40% |
| Cards shared per user per month | Is sharing a habit? | > 2 |
