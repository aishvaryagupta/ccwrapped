# ccwrapped: All Flows & Testing Checklist

A plain-English guide to every way a user can interact with ccwrapped, and how to verify each one works before launch.

---

## Flow 1: Brand New User (The Happy Path)

**What happens:** User has never used ccwrapped before. They run one command — no sign-up, no auth, no account needed.

```
$ npx ccwrapdev
```

**Step by step:**
1. Scans `~/.config/claude/projects/` and `~/.claude/projects/` for Claude Code logs
2. Aggregates token counts, cost, models per day
3. Shows stats summary in the terminal (tokens, cost, model breakdown)
4. Syncs anonymously to ccwrapped.dev — no auth required
5. Gets an anonymous profile at `https://ccwrapped.dev/p/{id}`
6. Opens the profile URL in browser
7. Asks "Set up auto-sync? (Y/n)" → user presses Enter (yes)
8. Writes a hook to `~/.claude/settings.json`
9. Done. From now on, stats sync automatically after every Claude Code session.
10. User can optionally claim a username on the web via Google OAuth (e.g. `ccwrapped.dev/alice`)

**How to test:**
- [ ] Delete `~/.config/ccwrapped/state.json` (fresh start)
- [ ] Run `npx ccwrapdev`
- [ ] Verify NO auth prompt appears — no Google login, no sign-up
- [ ] Verify terminal shows stats summary (tokens, cost, model breakdown)
- [ ] Verify "Synced X day(s)" appears with token/cost summary
- [ ] Verify anonymous profile URL opens in browser at `/p/{id}`
- [ ] Press Enter at "Set up auto-sync?" prompt
- [ ] Verify "Auto-sync enabled!" message
- [ ] Check `~/.claude/settings.json` contains `ccwrapdev hook-sync` in SessionEnd hooks
- [ ] Visit the profile URL → verify profile shows token breakdown, heatmap, tool usage

---

## Flow 2: Returning User Runs Default Command Again

**What happens:** User already has a sync token + hook. They just want to re-sync.

```
$ npx ccwrapdev
```

**Step by step:**
1. CLI finds existing sync token → uses it for sync
2. Scans logs, builds payload, uploads
3. Hook already installed → skips auto-sync prompt
4. Shows sync summary and opens profile

**How to test:**
- [ ] Run `npx ccwrapdev` after already being set up
- [ ] Verify no auth prompt appears
- [ ] Verify no auto-sync prompt appears (hook already installed)
- [ ] Verify sync completes and profile opens

---

## Flow 3: View Local Stats Only (No Internet Needed)

**What happens:** User just wants to see their stats locally without uploading anything.

```
$ npx ccwrapdev --local
```

**Step by step:**
1. Scans Claude Code logs (no auth required)
2. Shows a table: Today / Last 7 days / All time
3. Shows model breakdown with percentages
4. Suggests "Sync your stats: npx ccwrapdev"

**How to test:**
- [ ] Run `npx ccwrapdev --local` (even without auth)
- [ ] Verify table shows token counts and cost
- [ ] Verify model breakdown appears
- [ ] Verify no network calls are made (works offline)

---

## Flow 4: Standalone Auth (Deprecated)

**What happens:** This flow is deprecated. Auth is no longer required for syncing. The CLI uses anonymous sync tokens instead of Google OAuth. Users who want a named profile can claim a username via Google OAuth on the web at ccwrapped.dev.

```
$ npx ccwrapdev auth
```

**Step by step:**
1. This command is no longer part of the primary flow
2. Auth now happens on the web (optional username claiming via Google OAuth)
3. CLI sync uses a `sync_token` stored locally — no Google OAuth needed

**How to test:**
- [ ] Run `npx ccwrapdev auth` → verify it either shows a deprecation notice or is a no-op
- [ ] Verify the main flow (`npx ccwrapdev`) works without ever running `auth`

---

## Flow 5: Logout (Deprecated)

**What happens:** This flow is deprecated. Since the CLI no longer uses Google OAuth, there are no OAuth credentials to clear. The CLI uses a local `sync_token` for anonymous sync.

```
$ npx ccwrapdev auth --logout
```

**Step by step:**
1. Clears local sync token and synced sessions from state file
2. Shows "Logged out. Local data cleared."

**How to test:**
- [ ] Run `npx ccwrapdev auth --logout` → verify local state is cleared
- [ ] Run `npx ccwrapdev` → verify it re-syncs anonymously with a new profile ID

---

## Flow 6: Manual Sync

**What happens:** User wants to sync stats on demand (instead of relying on auto-sync).

```
$ npx ccwrapdev sync
```

**Step by step:**
1. Uses existing sync token (or creates one anonymously on first run)
2. Scans logs, builds payload, uploads
3. Shows sync summary with profile URL

**How to test:**
- [ ] Run `npx ccwrapdev sync` → verify sync completes (no auth needed)
- [ ] Verify profile URL is shown after sync

---

## Flow 7: Minimal Sync (Privacy-Conscious)

**What happens:** User wants to upload only token counts — no model names, no session/project counts.

```
$ npx ccwrapdev sync --minimal
```

**Step by step:**
1. Same as Flow 6 but strips model breakdowns, session counts, project counts (no auth required)
2. Only uploads: date, token counts (input/output/cache), cost

**How to test:**
- [ ] Run `npx ccwrapdev sync --minimal`
- [ ] Verify sync completes
- [ ] Check profile on web — model breakdown should be empty/missing for those days

---

## Flow 8: Enable Auto-Sync (Standalone)

**What happens:** User skipped auto-sync during initial setup or removed it, and now wants to enable it.

```
$ npx ccwrapdev setup
```

**Step by step:**
1. Writes a SessionEnd hook to `~/.claude/settings.json`
2. The hook runs `npx ccwrapdev hook-sync` after every Claude Code session
3. Shows "Auto-sync enabled!"

**How to test:**
- [ ] Remove hook first: `npx ccwrapdev setup --remove`
- [ ] Run `npx ccwrapdev setup`
- [ ] Verify "Auto-sync enabled!" message
- [ ] Check `~/.claude/settings.json` → SessionEnd hook present
- [ ] Run again → verify "Auto-sync is already enabled." (idempotent)

---

## Flow 9: Check Auto-Sync Status

**What happens:** User wants to know if auto-sync is set up.

```
$ npx ccwrapdev setup --check
```

**Step by step:**
1. Reads `~/.claude/settings.json`
2. Looks for `ccwrapdev hook-sync` in SessionEnd hooks
3. Reports enabled or not configured

**How to test:**
- [ ] Run with hook installed → verify "Auto-sync is enabled."
- [ ] Remove hook, run again → verify "Auto-sync is not configured."

---

## Flow 10: Remove Auto-Sync

**What happens:** User wants to stop automatic syncing.

```
$ npx ccwrapdev setup --remove
```

**Step by step:**
1. Reads `~/.claude/settings.json`
2. Removes only the ccwrapped hook entry
3. Preserves all other hooks and settings

**How to test:**
- [ ] Install hook first: `npx ccwrapdev setup`
- [ ] Run `npx ccwrapdev setup --remove`
- [ ] Verify "Auto-sync hook removed."
- [ ] Check `~/.claude/settings.json` → hook is gone, other settings intact
- [ ] Run again → verify "Auto-sync hook is not installed. Nothing to remove."

---

## Flow 11: Auto-Sync After a Claude Code Session

**What happens:** User finishes a Claude Code session. The hook fires automatically in the background.

**Trigger:** Claude Code fires SessionEnd event → runs `npx ccwrapdev hook-sync`

**Step by step:**
1. Claude Code pipes `{ session_id, transcript_path }` to stdin
2. Hook checks if session was already synced (idempotent)
3. Uses sync_token from local state (no Google OAuth needed)
4. Parses the single transcript file
5. Builds payload and uploads
6. Marks session as synced
7. Exits silently — user never sees output

**How to test:**
- [ ] Set up auto-sync: `npx ccwrapdev setup`
- [ ] Use Claude Code for a session, then exit
- [ ] Check `~/.config/ccwrapped/state.json` → `last_sync` should be updated
- [ ] Check profile on web → new data should appear
- [ ] Manual test: pipe mock data to hook-sync:
  ```
  echo '{"session_id":"test-123","transcript_path":"/path/to/transcript.jsonl"}' | npx ccwrapdev hook-sync
  ```

---

## Flow 12: Plugin Auto-Sync (Legacy Path)

**What happens:** User installed the plugin through Claude Code's marketplace (the old way).

**Setup (inside Claude Code):**
```
/plugin marketplace add aishvaryagupta/ccwrapped-plugin
/plugin install ccwrapped@ccwrapped-marketplace
```

**No separate auth step needed** — the plugin uses the same `sync_token` as the CLI.

**How it works:**
- Plugin registers hooks for SessionEnd, Stop, and SubagentStop
- Each hook runs `node ${CLAUDE_PLUGIN_ROOT}/dist/sync.js`
- Same logic as hook-sync but runs via the plugin system
- Uses `sync_token` from local state (no Google OAuth needed)

**How to test:**
- [ ] Install plugin via `/plugin` commands inside Claude Code
- [ ] Run `npx ccwrapdev` at least once (to create the sync token)
- [ ] Use Claude Code, end session
- [ ] Check profile on web → data should appear

---

## Flow 13: Open Profile Card

**What happens:** User wants to view or share their profile.

```
$ npx ccwrapdev card          # opens in browser
$ npx ccwrapdev card --copy   # copies URL to clipboard
```

**Prerequisites:** Must have synced at least once (to have a profile ID or claimed username).

**How to test:**
- [ ] Run `npx ccwrapdev card` → verify browser opens `ccwrapped.dev/p/{id}` (or `ccwrapped.dev/{username}` if claimed)
- [ ] Run `npx ccwrapdev card --copy` → verify URL is in clipboard
- [ ] Run before any sync → verify error: "No profile yet..."

---

## Flow 14: Check Overall Status

**What happens:** User wants a quick overview of their ccwrapped configuration.

```
$ npx ccwrapdev status
```

**Shows:**
```
ccwrapped status

  Profile:    ccwrapped.dev/p/{id} (or @alice if claimed)
  Last sync:  2026-03-29 14:30:45 UTC
  Sessions:   42 tracked
  Machine:    a1b2c3d4e5f6
  Auto-sync:  Enabled
  Config:     /Users/alice/.config/ccwrapped
```

**How to test:**
- [ ] Run when fully set up → verify all fields populated
- [ ] Run when never synced → verify "Profile: Not synced yet"
- [ ] Run when auto-sync not configured → verify "Auto-sync: Not configured" (yellow)

---

## Flow 15: Multi-Machine Conflict

**What happens:** User syncs from a second computer. The server detects a different machine ID.

**Step by step:**
1. During sync, CLI fetches metadata for today
2. Compares `machine_id` from last sync vs current machine
3. If different → shows warning (sync still proceeds)

**How to test:**
- [ ] Sync from machine A
- [ ] Sync from machine B (or change `machine_id` in state.json)
- [ ] Verify warning: "Last sync was from a different machine."

---

## Flow 16: Sync Token Persistence

**What happens:** The CLI uses a locally-stored `sync_token` for all sync operations. No Google OAuth tokens to refresh.

**Step by step:**
1. On first sync, the server issues a `sync_token` and the CLI stores it in state.json
2. All subsequent syncs use this token to identify the anonymous profile
3. The token does not expire — it persists until the user clears local state

**How to test:**
- [ ] Run `npx ccwrapdev` → verify `sync_token` is written to state.json
- [ ] Run `npx ccwrapdev sync` again → verify it reuses the same token
- [ ] Delete `sync_token` from state.json → run `npx ccwrapdev` → verify a new anonymous profile is created

---

## Edge Cases to Test

| Scenario | Expected Behavior |
|----------|-------------------|
| No Claude Code logs exist | "No usage data found." with paths checked |
| Claude Code logs are empty | Same as above |
| Network is offline (during sync) | "Could not reach ccwrapped.dev." |
| Network is offline (during first run) | Stats shown locally, sync fails gracefully |
| `sync_token` missing from state.json | CLI creates a new anonymous profile on next sync |
| `~/.claude/settings.json` doesn't exist | `setup` creates it with just the hook |
| `~/.claude/settings.json` has other hooks | `setup` appends without clobbering |
| `~/.claude/settings.json` is malformed JSON | `setup` treats as empty, writes fresh |
| Hook fires twice for same session | Second run detects session already synced, skips |
| Both plugin AND setup hook installed | Both fire, but idempotency prevents double-upload |
| User runs `setup --remove` then plugin still active | Plugin continues to work independently |

---

## Quick Reference

| Command | Purpose | Auth Required? |
|---------|---------|---------------|
| `npx ccwrapdev` | Scan + sync + auto-sync (zero auth) | No |
| `npx ccwrapdev --local` | View local stats | No |
| `npx ccwrapdev auth` | Deprecated — auth happens on web | No |
| `npx ccwrapdev auth --logout` | Clear local state | No |
| `npx ccwrapdev sync` | Manual sync | No |
| `npx ccwrapdev sync --minimal` | Sync without model data | No |
| `npx ccwrapdev setup` | Enable auto-sync hook | No |
| `npx ccwrapdev setup --check` | Check if auto-sync is active | No |
| `npx ccwrapdev setup --remove` | Disable auto-sync hook | No |
| `npx ccwrapdev card` | Open profile in browser | No |
| `npx ccwrapdev card --copy` | Copy profile URL | No |
| `npx ccwrapdev status` | Show config overview | No |
| `npx ccwrapdev help` | Show help text | No |
