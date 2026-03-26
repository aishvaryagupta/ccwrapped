# devwrapped — Setup TODO

All items are manual tasks that require your browser/account access. ~30 minutes total.

## Blockers (Do These First)

- [ ] **B2: Register devwrapped.dev domain** (~$12/yr)
  - Namecheap, Cloudflare, or Google Domains
  - Point DNS to Vercel once web app is deployed (later)
  - Confirm: devwrapped.dev is available as of 2026-03-26

- [ ] **B3: Create GitHub OAuth App**
  - Go to: https://github.com/settings/developers
  - Click "New OAuth App"
  - Application name: `devwrapped`
  - Homepage URL: `https://devwrapped.dev`
  - Callback URL: `https://devwrapped.dev/api/auth/callback` (placeholder — Device Flow doesn't use it)
  - **Check "Enable Device Flow"** (critical, off by default)
  - Save the **Client ID** (no client secret needed for Device Flow)
  - Share Client ID with me so I can wire it into the auth code

- [ ] **B4: Create Supabase project**
  - Go to: https://supabase.com
  - Create org → New project → name: `devwrapped`
  - Pick region closest to your users (e.g., us-east-1)
  - Set a strong database password (save it somewhere safe)
  - After provisioning (~2 min), grab:
    - Project URL: `https://xxxxx.supabase.co`
    - Anon key: `eyJhbGci...`
    - Service role key: `eyJhbGci...` (keep secret, server-side only)
  - **Start on free tier** — works for dev and launch
    - Free tier auto-pauses after 7 days of inactivity
    - I'll set up a GitHub Actions keep-alive cron to prevent this
    - Upgrade to Pro ($25/mo) later when you need backups or hit limits

- [ ] **B5: Create GitHub org + plugin marketplace repo**
  - Create org: https://github.com/organizations/plan
    - Org name: `devwrapped-org` (or just `devwrapped` if available)
  - Create repo: `devwrapped-org/devwrapped-plugin`
    - Public repo
    - This will serve as the plugin marketplace source
    - I'll populate it with the plugin code in Phase 2

## After Blockers Are Done

- [ ] **Share credentials with me** (so I can wire them into code)
  - GitHub OAuth Client ID
  - Supabase Project URL
  - Supabase Anon Key
  - (Keep service role key, database password, and any secrets to yourself — I'll tell you where to put them in `.env`)

- [ ] **Then say "go"** — I'll start building Phase 1:
  - Turborepo monorepo setup
  - Fork JSONL parser into packages/core
  - Payload types + builder
  - Unit tests
  - CI pipeline
