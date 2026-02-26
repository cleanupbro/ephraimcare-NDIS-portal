# Lessons Learned

Format:
```
### [YYYY-MM-DD] — [Short Title]
**What happened:** The situation
**Outcome:** What went wrong or right
**Lesson:** What to do differently
```

---

### 2026-02-15 — PostgREST FK Joins Require FKs to public Schema Tables
**What happened:** Created `incidents` table with `reported_by` FK pointing to `auth.users(id)`. The hook tried to join via `reporter:profiles!reported_by(first_name, last_name)` which requires a FK to `public.profiles`, not `auth.users`.
**Outcome:** 400 error on the incidents page. Fixed by dropping and recreating FKs to reference `public.profiles(id)`.
**Lesson:** Supabase PostgREST FK joins (`table!fk_column(...)`) only work when the FK points to a table in the `public` schema. Always FK to `public.profiles`, never directly to `auth.users`, when you need joined data.

### 2026-02-15 — Always Update ALL Consumers When Changing a Hook's Type Interface
**What happened:** Fixed `use-participant-dashboard.ts` by removing `used_budget` and `status` from the type (replaced with `is_current`). But forgot to update `dashboard/page.tsx` which still referenced `plan?.used_budget`.
**Outcome:** Participant portal build failed on Vercel. Required a follow-up commit to fix.
**Lesson:** When changing a React Query hook's return type, grep for all usages of removed fields across the codebase before committing. A type change in a hook ripples to every component that consumes it.

### 2026-02-15 — RLS Enabled + Zero Policies = Complete Lockout
**What happened:** `service_agreement_items` table had RLS enabled but zero policies. This means ALL queries are blocked — the table is completely inaccessible.
**Outcome:** Added admin ALL + org member SELECT policies.
**Lesson:** After enabling RLS on a new table, always verify at least one policy exists. Use the health check query: `SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN (SELECT tablename FROM pg_policies WHERE schemaname='public')`.

### 2026-02-15 — Participant Portal Was Reported DOWN But Was Actually Live
**What happened:** CLIENT_TEST_GUIDE.md and HANDOVER.md both said participant portal was down with DEPLOYMENT_NOT_FOUND. This was stale info from Feb 12 — the portal had already been redeployed on Feb 14.
**Outcome:** Wasted investigation time before discovering it was already working.
**Lesson:** Always verify live URLs directly before trusting documentation status. Docs can become stale within days.

### 2026-02-13 — Resend Email Requires Verified Domain for Production
**What happened:** Worker invite emails were failing silently because the Resend sender was using a sandbox domain.
**Outcome:** Fixed by using the correct RESEND_FROM_EMAIL env var. Emails now send via Resend API.
**Lesson:** Always check the sender domain is verified in Resend dashboard. Sandbox domains work for testing but may be blocked by email providers.

### 2026-02-13 — Participant Profile Address Mapping Was Wrong
**What happened:** Profile page showed empty address cards because the API response field names didn't match the frontend field names (snake_case vs camelCase mismatch).
**Outcome:** Fixed the mapping in the profile component.
**Lesson:** When Supabase returns snake_case and React expects camelCase, always check the mapping layer. This is a common source of "empty data" bugs.

### 2026-02-06 — Cancellations Page Stuck on Loading
**What happened:** The cancellation_requests table didn't exist or the RLS policy was blocking the query, causing the page to hang on "Loading..." indefinitely.
**Outcome:** Fixed the API route and database query. Page now loads correctly.
**Lesson:** Always handle API errors gracefully — show "No data" instead of hanging on "Loading..." forever. Empty state is better than infinite loading.

### 2026-02-16 — Playwright Error Detection False Positives
**What happened:** Checked for "500" in page body text to detect server errors. Matched dollar amounts like "$500" and "500MB" on every page.
**Outcome:** All pages falsely reported as having errors. Had to re-run the entire test suite.
**Lesson:** Never use generic status codes as body text matchers. Use precise selectors: `text="Application error"`, `text="Internal Server Error"`, `#__next-error`. Or check `response.status()` instead of body content.

### 2026-02-16 — Playwright Login Requires networkidle Wait
**What happened:** After filling login form and clicking submit, `page.waitForURL` timed out because the redirect hadn't completed.
**Outcome:** Test failed at login step.
**Lesson:** After Supabase auth login, use `page.waitForLoadState('networkidle')` with a generous timeout (15s+). Supabase auth redirects involve multiple hops (auth callback → dashboard).

### 2026-02-16 — Stale Playwright Snapshot Refs
**What happened:** After navigating to a new page, tried to click an element using a ref from a previous snapshot. Got "Ref e8 not found".
**Outcome:** Had to take a fresh snapshot after each navigation.
**Lesson:** Playwright MCP snapshot refs are invalidated on navigation. Always take a fresh `browser_snapshot` after `browser_navigate` or `browser_click` that triggers navigation.

### 2026-02-16 — Cookie Clearing for Auth Testing
**What happened:** Needed to test multiple user logins (admin → worker → coordinator). `signOut()` via API returned 404.
**Outcome:** Used `page.context().clearCookies()` via `browser_run_code` instead.
**Lesson:** For Playwright multi-user testing with Supabase, clear cookies directly via `page.context().clearCookies()` rather than calling the signOut API endpoint.

### 2026-02-06 — next lint Deprecated in Next.js 15
**What happened:** Running `next lint` threw a deprecation warning. Next.js 15 no longer bundles its own ESLint integration.
**Outcome:** Lint command needs to be migrated to standalone ESLint CLI.
**Lesson:** When upgrading Next.js, check the migration guide for breaking changes in developer tooling, not just runtime APIs.

### 2026-02-27 — Build: Missing dependency breaks all Vercel deployments silently
**Context:** Admin portal Vercel builds were failing with `Module not found: Can't resolve 'sonner'` for weeks.
**Problem:** `use-delete-shift.ts` imported `toast` from `sonner` (not in package.json). This broke every build but the live site still served the last working build — making it look like the site was fine but all changes were invisible.
**Fix:** Replaced with the project's own `toast` from `@/lib/toast`. Required matching the different API signature: `toast({ title, variant })` not `toast.success(msg)`.
**Rule:** ALWAYS check Vercel deployment status after pushing. Use the Vercel API (`EPHRAIM_VERCEL_API_KEY`) to poll deployment state. A 'READY' status ≠ your code is deployed — check the commit SHA. If state is 'ERROR', fetch & read the build logs immediately.

### 2026-02-27 — Next.js: Client components don't render in RSC if import is broken
**Context:** `AdminLogoutButton` was imported in the server layout but the file wasn't being compiled (build was broken).
**Problem:** The sidebar HTML showed zero buttons because the `use client` component couldn't be bundled.
**Fix:** Replaced with an inline Next.js server action `<form>` — renders as native HTML, no JS hydration required.
**Rule:** When a UI element is missing from the live site's HTML, check Vercel build logs (not just the page). A broken bundle = no component renders.

### 2026-02-27 — Dates: `new Date('YYYY-MM-DD')` is UTC midnight, not local midnight
**Context:** Invoice dates displayed one day earlier in AEST (+11) timezone.
**Problem:** `new Date('2026-02-15')` parses as UTC midnight → 2026-02-14 11:00 PM AEST.
**Fix:** Always append `T00:00:00` when parsing date-only strings: `new Date('2026-02-15T00:00:00')`.
**Rule:** When displaying date-only strings from Postgres, always append `T00:00:00` before passing to `new Date()`. Never use string concatenation to add ' UTC' — it's fragile and breaks for ISO timestamps.
