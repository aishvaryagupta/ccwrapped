# Codebase Review — ccwrapped Monorepo

**Date:** 2026-03-29
**Reviewed by:** SDE2 Agent (findings) + Principal Architect Agent (validation)
**Scope:** Full codebase — `packages/core`, `apps/cli`, `apps/web`, `apps/plugin`, infrastructure/config

---

## Executive Summary

| Area | Verdict | Critical | Major | Minor | Nit |
|------|---------|----------|-------|-------|-----|
| `packages/core` | Changes Required | 0 | 5 | 10 | 6 |
| `apps/cli` | Changes Required | 3 | 7 | 8 | 4 |
| `apps/web` | Minor Changes | 2 | 5 | 9 | 4 |
| `apps/plugin` | Minor Changes | 0 | 3 | 5 | 3 |
| Infra/Config | Changes Required | 3 | 4 | 6 | 3 |
| **Total** | | **8** | **24** | **38** | **20** |

---

## Validation Scorecard

Each SDE2 finding was independently verified by the Principal Architect agent reading the actual source code.

| Area | Confirmed | False Positives | Accuracy |
|------|-----------|-----------------|----------|
| packages/core | 12/15 | 3 | 80% |
| apps/cli | 16/18 | 2 | 89% |
| apps/web | 10/16 | 6 | 63% |
| apps/plugin | 6/8 | 2 | 75% |
| Infrastructure | 10/12 | 2 | 83% |
| **Total** | **54/69** | **15** | **78%** |

### False Positive Patterns

The SDE2 review had three recurring false-positive patterns:

1. **Misunderstanding server component context** — treating RSC code as if it had client re-render concerns
2. **Overstating type system issues** — flagging valid TypeScript patterns as bugs
3. **Phantom security concerns** — claiming unsanitized input where framework-level escaping already applies

---

## packages/core — 12 of 15 confirmed

| # | Finding | Verdict | Rationale |
|---|---------|---------|-----------|
| 1 | URL injection in `fetchSyncMetadata` — `date` param interpolated without encoding (`src/http.ts:112`) | **YES** | `date` directly interpolated, no encoding |
| 2 | Stale `dist/auth.*` files from removed `src/auth.ts` | **YES** | Full OAuth logic compiled, source deleted |
| 3 | Overly permissive fuzzy matching in `findPricing` (`src/pricing.ts:57-68`) | **YES** | Bidirectional substring match can false-positive |
| 4 | O(n) duplicate check in `addSyncedSession` (`src/state.ts:74-87`) | **NO** | N capped at 500, not a hot path — trivial at this scale |
| 5 | `writeClaudeSettings` doesn't create parent directory (`src/claude-settings.ts:43-52`) | **YES** | Fails on fresh `~/.claude/` environments |
| 6 | Module-level mutable pricing cache with no TTL (`src/pricing.ts:17`) | **YES** | Real for long-lived processes |
| 7 | `API_BASE_URL` reads `process.env` at module load time (`src/consts.ts:31`) | **YES** | Minor, makes testing harder |
| 8 | `date` in `byDate` Map loses `DailyDate` branded type (`src/payload.ts:88`) | **YES** | Branded type erased, no runtime impact |
| 9 | `ToolCountSchema` and `ToolCount` not exported from `index.ts` (`src/types.ts:107-111`) | **YES** | Unused externally but inconsistent |
| 10 | `extractDateUTC` name overpromises — just slices first 10 chars (`src/parser.ts:72-79`) | **NO** | Private function, name is adequate |
| 11 | `as any` casts for branded `DailyDate` type in tests (`__tests__/parser.test.ts:212-231`) | **YES** | Should use `parse(DailyDateSchema, ...)` |
| 12 | Retry on fetch exception doesn't distinguish retryable vs permanent errors (`src/http.ts:52-64`) | **YES** | Permanent errors retried; low blast radius |
| 13 | `pricing.ts` has zero test coverage | **YES** | No test file exists |
| 14 | `format.ts` has zero test coverage | **YES** | No test file exists |
| 15 | `extractToolMetrics` untested | **YES** | Not exercised by any test |

### Core Architectural Concerns

- **State file I/O per operation** (`state.ts`) — Every mutation does a full read-parse-modify-serialize-write cycle. Batch operations (like adding multiple synced sessions) are O(n) file operations.
- **Inconsistent pricing strategies** — `consts.ts` uses longest-prefix-first matching (clean). `pricing.ts` uses bidirectional substring matching (fragile). These should use the same strategy.

---

## apps/cli — 16 of 18 confirmed

| # | Finding | Verdict | Rationale |
|---|---------|---------|-----------|
| 1 | Missing `"type": "module"` in `package.json` | **YES** | tsc produces .js treated as CJS; stale esbuild bundle masks it |
| 2 | Tests reference removed APIs (`__tests__/commands.test.ts:79-89`) | **YES** | `auth_token`, `setAuthToken` don't exist in core |
| 3 | Stale `dist/` directory with esbuild artifacts and removed commands | **YES** | esbuild artifacts, removed commands |
| 4 | Duplicated error message map (`default.ts:73-77`, `sync.ts:96-100`) | **YES** | Identical Record in two files |
| 5 | Inconsistent session tracking — `default.ts` has FIFO eviction, `sync.ts` doesn't | **YES** | Core already has `addSyncedSession()` with eviction |
| 6 | Hardcoded magic number `500` (`default.ts:111`) | **YES** | Core exports `MAX_SYNCED_SESSIONS` |
| 7 | Three separate readState/writeState cycles (`sync.ts:109-128`) | **YES** | Two separate read-mutate-write cycles = TOCTOU |
| 8 | readline prompt hangs in non-interactive mode (`default.ts:143-146`) | **YES** | No `isTTY` guard |
| 9 | Ignores `HookInput` type from core (`hook-sync.ts:22`) | **YES** | Inline type, though runtime checks still needed |
| 10 | No URL validation before passing to OS command (`browser.ts:4-13`) | **NO** | `execFile` prevents injection; URLs are internal |
| 11 | Version string hardcoded as `'ccwrapped 0.4.0'` (`src/index.ts:53`) | **YES** | Should use `CLIENT_VERSION` from core |
| 12 | Misleading logout message (`auth.ts:7-9`) | **YES** | Says "Auth credentials removed" but OAuth is gone |
| 13 | Duplicated machine ID fallback in 3 files | **YES** | Same pattern in 3 files; likely dead code |
| 14 | `copyToClipboard` doesn't handle errors (`card.ts:37-56`) | **YES** | Missing `.on('error')` handler |
| 15 | Regex for profile_id overly permissive (`default.ts:97`) | **NO** | `/[a-f0-9-]+/` is standard UUID pattern |
| 16 | `logo.txt` unused | **YES** | Zero references |
| 17 | Silent failure for all error paths in `hook-sync.ts` | **YES** | All errors are bare returns; debugging impossible |
| 18 | esbuild is devDep but unused (`package.json:14`) | **YES** | Build is `tsc`, no esbuild config exists |

### CLI Architectural Concerns

- **Broken build pipeline** — The CLI cannot be built or type-checked from source. The `"files"` field references `dist/bin.js` and `dist/index.mjs` which `tsc` cannot produce.
- **Duplicated sync logic** — `default.ts` and `sync.ts` share ~70% of sync logic with subtle inconsistencies. Should be extracted into a shared function.

---

## apps/web — 10 of 16 confirmed

| # | Finding | Verdict | Rationale |
|---|---------|---------|-----------|
| 1 | Supabase client created per-call (`lib/queries.ts:1-9`) | **NO** | Intentional admin vs anon key separation; lightweight in RSC context |
| 2 | Unused shadcn components (`card.tsx`, `separator.tsx`) | **YES** | Zero imports. Downgraded from Critical to Minor |
| 3 | `toolCounts` accessed via `in` operator bypassing TS (`api/sync/route.ts:106`) | **NO** | Valid runtime check for optional Valibot schema fields |
| 4 | `select('*')` on public-facing edge route (`card/[username]/route.tsx:69`) | **YES** | Unnecessary columns fetched. Downgraded from Major to Minor |
| 5 | Duplicate `formatTokens` function (`card/[username]/route.tsx:11`) | **YES** | Confirmed, though edge runtime may explain it |
| 6 | Return type mismatch in `createAnonymousUser` (`lib/auth.ts:63-65`) | **NO** | Redundant but not incorrect |
| 7 | Unsanitized username in metadata (`[username]/page.tsx:14-15`) | **NO** | Next.js Metadata API auto-escapes; user must exist in DB |
| 8 | Silent error swallowing in availability check (`claim-form.tsx:25-27`) | **YES** | Confirmed but intentional per comment |
| 9 | Client-side regex doesn't match server-side validation (`claim-form.tsx:71`) | **YES** | Client allows hyphens server rejects; UX gap |
| 10 | `x-real-ip` not available in all environments (`api/sync/route.ts:63-69`) | **YES** | Valid environment coupling concern |
| 11 | Unbounded query `fetchUserStats` (`lib/queries.ts:95-99`) | **YES** | No date range or row limit |
| 12 | IIFE in JSX for daily trend chart (`profile-content.tsx:260-289`) | **YES** | Should be extracted to a component |
| 13 | Heavy computation in render body (`profile-content.tsx:20-75`) | **NO** | Server component — no re-render concern |
| 14 | Env vars read at module scope (`api/auth/google/route.ts:5-8`) | **NO** | Standard Next.js pattern |
| 15 | Raw color `text-green-400` (`page.tsx:148`, `docs/page.tsx:187`) | **YES** | Inconsistent with semantic tokens elsewhere |
| 16 | Grid with conditional children (`profile-content.tsx:237-249`) | **YES** | 1 item in 2-col grid = layout artifact |

### Web Strengths

- **Security posture** — PKCE OAuth, HMAC-signed cookies with timing-safe comparison, CSRF protection, rate limiting, RLS on all tables, parameterized queries
- **UX patterns** — All pages have loading/empty/error states, good accessibility (skip links, ARIA, focus rings, `prefers-reduced-motion`)
- **Mobile-first** — Consistent throughout

### Web Testing Gap

Only 1 test file with 8 test cases for sync payload validation. Zero tests for: API routes, auth logic, cookie signing, session management, PKCE, rate limiting, or any component rendering.

---

## apps/plugin — 6 of 8 confirmed

| # | Finding | Verdict | Rationale |
|---|---------|---------|-----------|
| 1 | Test imports `getAuthToken` from removed API (`__tests__/sync.test.ts:18`) | **YES** | Function doesn't exist in core source |
| 2 | Inline type instead of `HookInput` from core (`src/sync.ts:20-26`) | **YES** | Core exports it; inline type is duplicative |
| 3 | `chunk as Buffer` unsafe cast (`src/sync.ts:19`) | **NO** | Correct for Node.js stdin; provides type info |
| 4 | JSON parse failure silently swallowed (`src/sync.ts:25-26`) | **YES** | Confirmed, intentional by design |
| 5 | `postSyncPayload` error details discarded (`src/sync.ts:57`) | **YES** | Confirmed, intentional by design |
| 6 | `repository` in `plugin.json` points to separate repo | **YES** | May be intentional for separate publishing |
| 7 | Dead `writeState` import in tests | **YES** | Imported but never used |
| 8 | `tmpdir()` + `Date.now()` collision risk (`__tests__/sync.test.ts:7`) | **NO** | Evaluated once per module; negligible |

---

## Infrastructure/Config — 10 of 12 confirmed

| # | Finding | Verdict | Rationale |
|---|---------|---------|-----------|
| 1 | CLI missing `@ccwrapped/core` dependency declaration | **YES** | Works via hoisting only; Turbo has no build edge |
| 2 | `NEXT_PUBLIC_BASE_URL` not in turbo.json `env` array | **YES** | Build cache won't invalidate on env change |
| 3 | Lint infrastructure broken — ESLint not installed | **YES** | No ESLint installed, no config, CI skips lint |
| 4 | `.env.example` missing 5 required env vars | **YES** | Missing `COOKIE_SECRET`, Google OAuth vars, `NEXT_PUBLIC_BASE_URL` |
| 5 | Web `tsconfig.json` doesn't extend `tsconfig.base.json` | **YES** | Can drift from shared settings |
| 6 | CI doesn't run `build` | **YES** | Build failures not caught |
| 7 | CLI missing `"type": "module"` | **NO** | Intentional CJS entry bootstraps ESM bundle |
| 8 | Turbo outputs include `.next/**` for all packages | **YES** | Untidy but harmless |
| 9 | Turbo env vars applied to all workspaces | **YES** | Unnecessary cache invalidation for non-web |
| 10 | Valibot declared in both core and web | **NO** | Web app directly imports valibot; correct to declare |
| 11 | `SUPABASE_ANON_KEY` vs `SUPABASE_PUBLISHABLE_KEY` naming mismatch | **YES** | Confusing between workflow and app code |
| 12 | Identical `vitest.config.ts` across all 4 workspaces | **YES** | Maintenance inconvenience |

---

## Validated Priority Fixes

The architect confirms these as the highest-priority confirmed issues:

1. **Stale `dist/` across monorepo** — masks real build failures, causes tests to pass against dead code
2. **CLI `package.json` missing `"type": "module"` and `@ccwrapped/core` dependency**
3. **Turbo `env` missing `NEXT_PUBLIC_BASE_URL`** — stale build cache risk
4. **URL injection in `fetchSyncMetadata`** — use `encodeURIComponent` or `URL.searchParams`
5. **Broken lint infrastructure** — install ESLint or remove the scripts
6. **Tests referencing removed APIs** (cli + plugin) — will break on clean rebuild
7. **Duplicated sync logic in CLI** — extract shared function, fix missing FIFO eviction in `sync.ts`

---

## What's Done Well

- **Security posture in web app** — PKCE OAuth, HMAC-signed cookies with timing-safe comparison, CSRF protection, rate limiting, RLS on all tables, parameterized queries
- **Schema validation** — Consistent use of valibot for input validation at system boundaries
- **Branded types** — `DailyDate`, `SessionId` prevent class-of-bug mixing
- **Plugin design** — Fail-safe with `process.exitCode = 0`, thin entry point delegating to core
- **Web UX** — All pages have loading/empty/error states, good accessibility (skip links, ARIA, focus rings, `prefers-reduced-motion`)
- **Module boundaries** — Clean separation between core, CLI, plugin, and web
