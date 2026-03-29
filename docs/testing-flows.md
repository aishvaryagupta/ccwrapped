# ccwrapped: All Flows & Testing Checklist

A plain-English guide to every way a user can interact with ccwrapped, and how to verify each one works before launch.

---

## Flow 1: Brand New User (The Happy Path)

**What happens:** User has never used ccwrapped before. They run one command and get everything set up.

```
$ npx ccwrapdev
```

**Step by step:**
1. CLI sees no auth token → starts Google login
2. Shows a code like `WDJB-JRFX` and opens google.com/device in browser
3. User enters the code on Google's page and clicks "Allow"
4. CLI detects authorization → saves token
5. Asks user to pick a username (e.g. `alice`)
6. Scans `~/.config/claude/projects/` and `~/.claude/projects/` for Claude Code logs
7. Aggregates token counts, cost, models per day
8. Uploads to ccwrapped.dev
9. Opens profile at `https://ccwrapped.dev/alice` in browser
10. Asks "Set up auto-sync? (Y/n)" → user presses Enter (yes)
11. Writes a hook to `~/.claude/settings.json`
12. Done. From now on, stats sync automatically after every Claude Code session.

**How to test:**
- [ ] Delete `~/.config/ccwrapped/state.json` (fresh start)
- [ ] Run `npx ccwrapdev`
- [ ] Verify Google auth page opens in browser
- [ ] Complete auth → see "Authenticated as {email}"
- [ ] Enter a username → see "Username set: @{name}"
- [ ] Verify "Synced X day(s)" appears with token/cost summary
- [ ] Verify profile URL opens in browser
- [ ] Press Enter at "Set up auto-sync?" prompt
- [ ] Verify "Auto-sync enabled!" message
- [ ] Check `~/.claude/settings.json` contains `ccwrapdev hook-sync` in SessionEnd hooks

---

## Flow 2: Returning User Runs Default Command Again

**What happens:** User already has auth + username + hook. They just want to re-sync.

```
$ npx ccwrapdev
```

**Step by step:**
1. CLI finds valid token → skips auth
2. Username already set → skips prompt
3. Scans logs, builds payload, uploads
4. Hook already installed → skips auto-sync prompt
5. Shows sync summary and opens profile

**How to test:**
- [ ] Run `npx ccwrapdev` after already being set up
- [ ] Verify no auth prompt appears
- [ ] Verify no username prompt appears
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

## Flow 4: Standalone Auth

**What happens:** User just wants to authenticate without syncing.

```
$ npx ccwrapdev auth
```

**Step by step:**
1. If already authenticated → shows "Already authenticated as @{username}"
2. If not → starts Google Device Flow (same as Flow 1 steps 1-4)
3. After auth → "Authentication complete. Welcome, {email}!"

**How to test:**
- [ ] Run `npx ccwrapdev auth` when NOT authenticated → verify device flow starts
- [ ] Complete auth → verify success message with email
- [ ] Run `npx ccwrapdev auth` again → verify "Already authenticated" message

---

## Flow 5: Logout

**What happens:** User wants to remove their credentials from this machine.

```
$ npx ccwrapdev auth --logout
```

**Step by step:**
1. Clears all auth tokens, username, synced sessions from state file
2. Shows "Logged out. Credentials removed."

**How to test:**
- [ ] Run `npx ccwrapdev auth --logout`
- [ ] Verify "Logged out" message
- [ ] Run `npx ccwrapdev status` → verify "Auth: Not authenticated"
- [ ] Run `npx ccwrapdev auth` → verify it asks to re-authenticate

---

## Flow 6: Manual Sync

**What happens:** User wants to sync stats on demand (instead of relying on auto-sync).

```
$ npx ccwrapdev sync
```

**Step by step:**
1. Checks auth → fails if not authenticated
2. Prompts for username if not set
3. Scans logs, builds payload, uploads
4. Shows sync summary with profile URL

**How to test:**
- [ ] Run `npx ccwrapdev sync` while authenticated → verify sync completes
- [ ] Run `npx ccwrapdev sync` while NOT authenticated → verify error: "Not authenticated"

---

## Flow 7: Minimal Sync (Privacy-Conscious)

**What happens:** User wants to upload only token counts — no model names, no session/project counts.

```
$ npx ccwrapdev sync --minimal
```

**Step by step:**
1. Same as Flow 6 but strips model breakdowns, session counts, project counts
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
3. Gets auth token (silently skips if not authenticated)
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

**Then authenticate:**
```
$ npx ccwrapdev auth
```

**How it works:**
- Plugin registers hooks for SessionEnd, Stop, and SubagentStop
- Each hook runs `node ${CLAUDE_PLUGIN_ROOT}/dist/sync.js`
- Same logic as hook-sync but runs via the plugin system
- If no auth token: prints to stderr suggesting `npx ccwrapped auth`

**How to test:**
- [ ] Install plugin via `/plugin` commands inside Claude Code
- [ ] Authenticate: `npx ccwrapdev auth`
- [ ] Use Claude Code, end session
- [ ] Check profile on web → data should appear

---

## Flow 13: Open Profile Card

**What happens:** User wants to view or share their profile.

```
$ npx ccwrapdev card          # opens in browser
$ npx ccwrapdev card --copy   # copies URL to clipboard
```

**Prerequisites:** Must be authenticated with a username set.

**How to test:**
- [ ] Run `npx ccwrapdev card` → verify browser opens `ccwrapped.dev/{username}`
- [ ] Run `npx ccwrapdev card --copy` → verify URL is in clipboard
- [ ] Run without auth → verify error: "No profile yet..."

---

## Flow 14: Check Overall Status

**What happens:** User wants a quick overview of their ccwrapped configuration.

```
$ npx ccwrapdev status
```

**Shows:**
```
ccwrapped status

  Auth:       @alice
  Last sync:  2026-03-29 14:30:45 UTC
  Sessions:   42 tracked
  Machine:    a1b2c3d4e5f6
  Auto-sync:  Enabled
  Config:     /Users/alice/.config/ccwrapped
```

**How to test:**
- [ ] Run when fully set up → verify all fields populated
- [ ] Run when not authenticated → verify "Auth: Not authenticated" (red)
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

## Flow 16: Token Expiry & Auto-Refresh

**What happens:** Google OAuth tokens expire after ~1 hour. The CLI refreshes them automatically.

**Step by step:**
1. `getValidToken()` checks if token is within 60 seconds of expiry
2. If expiring → uses refresh token to get a new access token
3. Saves new token + expiry to state file
4. User never sees this happen

**How to test:**
- [ ] Manually set `token_expiry` in state.json to a past date
- [ ] Run any command that needs auth (e.g. `npx ccwrapdev sync`)
- [ ] Verify it succeeds without re-prompting for auth
- [ ] Check state.json → `token_expiry` should be updated to future

---

## Edge Cases to Test

| Scenario | Expected Behavior |
|----------|-------------------|
| No Claude Code logs exist | "No usage data found." with paths checked |
| Claude Code logs are empty | Same as above |
| Network is offline (during sync) | "Could not reach ccwrapped.dev." |
| Network is offline (during auth) | "Failed to start authentication. Check your network." |
| Username already taken | Prompt retries up to 3 times, then fails |
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
| `npx ccwrapdev` | Full setup: auth + sync + auto-sync | No (creates auth) |
| `npx ccwrapdev --local` | View local stats | No |
| `npx ccwrapdev auth` | Authenticate only | No (creates auth) |
| `npx ccwrapdev auth --logout` | Remove credentials | No |
| `npx ccwrapdev sync` | Manual sync | Yes |
| `npx ccwrapdev sync --minimal` | Sync without model data | Yes |
| `npx ccwrapdev setup` | Enable auto-sync hook | No |
| `npx ccwrapdev setup --check` | Check if auto-sync is active | No |
| `npx ccwrapdev setup --remove` | Disable auto-sync hook | No |
| `npx ccwrapdev card` | Open profile in browser | Yes |
| `npx ccwrapdev card --copy` | Copy profile URL | Yes |
| `npx ccwrapdev status` | Show config overview | No |
| `npx ccwrapdev help` | Show help text | No |
