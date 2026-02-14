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

### 2026-02-06 — next lint Deprecated in Next.js 15
**What happened:** Running `next lint` threw a deprecation warning. Next.js 15 no longer bundles its own ESLint integration.
**Outcome:** Lint command needs to be migrated to standalone ESLint CLI.
**Lesson:** When upgrading Next.js, check the migration guide for breaking changes in developer tooling, not just runtime APIs.
