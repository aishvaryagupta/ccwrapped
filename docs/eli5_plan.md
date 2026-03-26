# devwrapped — ELI5 Plan

## What Is This?

You know how Spotify gives you "Spotify Wrapped" at the end of the year — showing you how many minutes you listened, your top artists, and a pretty card you can share on Instagram?

**We're building that, but for Claude Code.**

Every time you use Claude Code, it secretly writes down how many "tokens" (basically words) it used in hidden log files on your computer. The tool `ccusage` already reads those files and shows you numbers in a terminal. But nobody's built the **pretty + shareable + competitive** layer on top.

Think of it as a **step counter for AI coding** — it counts how many "AI words" you used today, shows you a pretty chart, and lets you flex about it.

---

## How It Works

### One-Time Setup (30 seconds)

Open Claude Code, type two commands, done forever:

```
/plugin marketplace add devwrapped-org/devwrapped-plugin
/plugin install devwrapped@devwrapped
```

### Every Day After (automatic, you do nothing)

```
You use Claude Code normally
You finish a conversation
→ In the background, a tiny script reads what tokens you used
→ Sends daily totals to devwrapped.dev
→ You never notice it happened
```

### When You Want to Flex

```
Open devwrapped.dev/yourname → see your card → share it
```

---

## The User Journey

### Step 1: You hear about devwrapped

Someone on Twitter posts a beautiful card that says:
"This week I generated 1.2M tokens across 8 projects"
You think: "I want one of those."

### Step 2: You install it

Two commands inside Claude Code. That's it. Or if you prefer, you can run `npx devwrapped` in your terminal for a quick local preview first.

### Step 3: It just works

Every time you finish a Claude Code session, the plugin silently reads your usage and sends the daily totals (not your code, not your chats) to devwrapped.dev.

### Step 4: You get your card

You open devwrapped.dev/yourname and see:
- A GitHub-contributions-style heatmap of your Claude usage
- A pie chart showing Opus vs Sonnet vs Haiku
- A trend line of your tokens over time
- A beautiful card image you can download or share

### Step 5: You share it

You paste your profile URL on Twitter. Twitter auto-shows your card as a rich preview. Other devs see it, think "I want one", install the plugin. The loop repeats.

---

## Why Automatic Is Better Than Manual

| Before (CLI-first plan) | After (plugin plan) |
|---|---|
| Run `npx devwrapped sync` every day | Automatic — you forget it exists |
| Miss a day = missing data | Never misses (hooks fire every session) |
| Feels like a chore | Feels like magic |

It's the difference between manually stepping on a scale every day vs wearing a Fitbit.

---

## The Reliability Trick

The "session ended" signal in Claude Code is a bit flaky — it doesn't always fire. So we listen to **three** signals instead of one:

```
Signal 1: "Session ended"         → fires most of the time
Signal 2: "Claude stopped talking" → fires almost always
Signal 3: "Subagent finished"     → catches parallel tasks

Any ONE of these triggers the sync.
The sync is smart enough to not double-count.
```

It's like setting three alarms instead of one. Redundancy = reliability.

If hooks miss something (e.g. a crash), you can always run `npx devwrapped sync` to catch up manually. Belt and suspenders.

---

## The "Try Before You Install" Trick

For people who don't want to install anything yet:

```
1. Visit devwrapped.dev
2. Click "Preview My Stats"
3. Browser asks: "Let this site read a folder?"
4. You pick your Claude logs folder
5. Dashboard appears instantly — nothing was uploaded
```

User thinks "wow, I want this permanently" → installs the plugin.

This only works in Chrome/Edge/Arc, but that's fine for a demo.

---

## What Gets Uploaded (And What Doesn't)

**Uploaded (daily totals only):**
- 245K tokens on March 25
- 6 sessions that day
- 3 projects (just the count, not names)
- Models used: Opus 68%, Sonnet 28%, Haiku 4%

**NOT uploaded, ever:**
- Your code
- Your conversations with Claude
- Your file paths or project names
- Anything that could reveal what you're working on

---

## The Viral Loop

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
                     ┌─────────┴─────────┐
                     │                   │
                     ▼                   ▼
          ┌──────────────────┐ ┌──────────────────┐
          │ "Preview My      │ │  Install plugin   │
          │  Stats" button   │ │  (2 commands)     │
          │  (zero install)  │ │                   │
          └────────┬─────────┘ └────────┬─────────┘
                   │                    │
                   └────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │                      │
                 │  See your stats      │
                 │  + beautiful card    │
                 │                      │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │                      │
            ┌────│  Share card on       │
            │    │  Twitter / LinkedIn  │
            │    │                      │
            │    └──────────────────────┘
            │
            │    Someone else sees it
            │
            └──────────► LOOP REPEATS
```

---

## The Full Picture

```
                    ┌─────────────────────┐
                    │  You use Claude Code │
                    │  normally            │
                    └──────────┬──────────┘
                               │
                       (you don't do anything)
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Plugin auto-syncs   │
                    │  token counts only   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  devwrapped.dev has     │
                    │  your fresh stats    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Share your card     │
                    │  whenever you want   │
                    └─────────────────────┘
```

That's it. A Fitbit for your AI coding.
