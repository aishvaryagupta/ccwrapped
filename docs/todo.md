# ccwrapped — Launch TODO

## Done

- [x] Google OAuth Device Flow (CLI + plugin)
- [x] Token refresh (auto-refresh via `getValidToken`)
- [x] Username system (validate, claim, prompt on first sync)
- [x] Supabase schema + migration (001 + 002)
- [x] Web API routes (sync, username claim, username check, OG card)
- [x] CLI commands (auth, sync, card, status, default)
- [x] Plugin auto-sync with token refresh
- [x] RLS policies + rate limiting
- [x] Tests (103 passing, all packages typecheck)
- [x] Vercel config (`vercel.json`)
- [x] Google Cloud project + OAuth client created
- [x] Supabase project created + linked (`pogmpoepdoejxhcirxbl`)

## Remaining

### You (manual steps)

- [x] **Register ccwrapped.dev domain**
- [x] **Deploy to Vercel** — live at ccwrapped.dev

- [ ] **Create plugin repo**
  - Repo: `aishvaryagupta/ccwrapped-plugin` (public)
  - Push `apps/plugin/` contents there

- [ ] **Publish CLI to npm**
  - `cd apps/cli && npm publish`
  - Package name: `ccwrapped`

### Code (can be done by Claude)

- [ ] **Complete plugin.json** — add required fields per Claude Code plugin spec
- [ ] **Google OAuth consent screen** — publish app (currently in testing mode, limited to 100 users)
