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

- [ ] **Register ccwrapped.dev domain**
  - Namecheap, Cloudflare, or similar (~$12/yr)
  - Point DNS to Vercel after deployment

- [ ] **Deploy to Vercel**
  - Import repo → set framework to Next.js
  - Root directory: `apps/web`
  - Set environment variables:
    - `SUPABASE_URL` = `https://pogmpoepdoejxhcirxbl.supabase.co`
    - `SUPABASE_SECRET_KEY` = (service role JWT from `.env.local`)
    - `SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_lO-RhPUEzVGTAlOwJ-QZtQ_sgAazk7x`
  - Assign custom domain: `ccwrapped.dev`

- [ ] **Create GitHub org + plugin repo**
  - Org: `ccwrapped-org` (or `ccwrapped`)
  - Repo: `ccwrapped-org/ccwrapped-plugin` (public)
  - Push `apps/plugin/` contents there

- [ ] **Publish CLI to npm**
  - `cd apps/cli && npm publish`
  - Package name: `ccwrapped`

### Code (can be done by Claude)

- [ ] **Complete plugin.json** — add required fields per Claude Code plugin spec
- [ ] **Google OAuth consent screen** — publish app (currently in testing mode, limited to 100 users)
