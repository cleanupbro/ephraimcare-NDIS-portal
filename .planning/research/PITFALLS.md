# Pitfalls Research: NDIS Management Platform

> **Stack:** Next.js 14+ (App Router) + Supabase + React Native/Expo
> **Domain:** NDIS Care Management (Australia)
> **Roles:** Admin, Coordinator, Worker (mobile-first), Participant
> **Researched:** 2026-01-24

---

## Critical Pitfalls (Will Break the System)

### 1. Supabase RLS Policy Performance Degradation

- **What goes wrong:** RLS policies are evaluated per-row. With complex multi-role policies (Admin sees all, Coordinator sees their participants, Worker sees their shifts, Participant sees their own data), queries with JOINs across shifts/participants/invoices trigger N policy evaluations. A dashboard query loading 50 shifts with participant and worker details can execute 150+ policy checks. Response times exceed 2-3 seconds, making the app feel broken.
- **Warning signs:** Queries that work fast with service role but slow with authenticated role. `EXPLAIN ANALYZE` shows Seq Scans inside policy subqueries. Dashboard load times increasing as data grows past 1000 shifts.
- **Prevention:**
  1. Use `auth.uid()` lookups against indexed columns only (never full-table scans in policies)
  2. Create a `user_roles` materialized view or cached table instead of computing role membership in every policy
  3. Use `security definer` functions for complex multi-table queries instead of relying on RLS for every join
  4. Add `org_id` column to every table and index it - policy checks against indexed org_id are fast
  5. Benchmark with 10,000+ rows early (Phase 1), not after launch
  6. Consider `SELECT` policies separate from `INSERT`/`UPDATE`/`DELETE` - read policies are called most often
- **Phase to address:** Phase 1 (Database Schema) - get policy patterns right before building features on top

---

### 2. Offline Sync Conflict Resolution (Worker App)

- **What goes wrong:** Worker checks in to a shift while offline. Meanwhile, admin cancels that shift, or coordinator reassigns it to another worker. When the worker comes back online, naive "last write wins" either overwrites the admin's cancellation (compliance issue) or silently drops the worker's check-in (payroll issue). In healthcare, both outcomes are unacceptable.
- **Warning signs:** Using simple upsert for sync. No conflict detection in the sync layer. Testing only happy-path online scenarios. Workers reporting "I checked in but it didn't save."
- **Prevention:**
  1. Implement vector clock or version-based conflict detection (each record has a `version` integer, incremented on every write)
  2. Define conflict resolution rules per entity type:
     - Shift cancellation ALWAYS wins over check-in (safety)
     - Check-in time is preserved but flagged for admin review if shift was modified
     - Case notes are never auto-resolved - queue for manual merge
  3. Use an "outbox" pattern: offline writes go to local queue, sync process applies them with conflict checks
  4. Server returns conflict responses (HTTP 409) with both versions for client-side resolution UI
  5. Add `synced_at`, `local_version`, `server_version` columns to offline-capable tables
  6. Test with airplane mode toggle during active workflows
- **Phase to address:** Phase 2 (Worker Mobile App) - must be designed before any offline feature is built

---

### 3. Australian Timezone and DST Billing Errors

- **What goes wrong:** A shift scheduled for 1:30 AM - 3:30 AM on the first Sunday of April (DST ends in most Australian states) could be interpreted as a 2-hour or 3-hour shift depending on how times are stored and compared. Billing "exact minutes" with the "lesser of scheduled vs actual" rule produces wrong invoices. Worse: different Australian states observe DST differently (QLD doesn't), and NDIS operates nationally.
- **Warning signs:** Using JavaScript `Date` objects without explicit timezone handling. Storing local times instead of UTC. Using `Date.now()` for check-in timestamps. Not testing across DST boundaries. Billing discrepancies reported twice yearly (DST transitions).
- **Prevention:**
  1. Store ALL timestamps as UTC in the database (`timestamptz` in PostgreSQL)
  2. Store the IANA timezone with each shift record (e.g., `Australia/Sydney`, `Australia/Brisbane`)
  3. Use `luxon` or `date-fns-tz` (NOT moment.js) for all timezone conversions
  4. Calculate billable duration on the SERVER in UTC (never on client)
  5. Duration calculation: `actual_end_utc - actual_start_utc` gives correct minutes regardless of DST
  6. Display times in the shift's timezone, but compute duration in UTC
  7. Add DST transition dates to your test suite as explicit test cases
  8. Handle the "impossible time" (2 AM doesn't exist on spring-forward) and "ambiguous time" (2 AM happens twice on fall-back)
- **Phase to address:** Phase 1 (Database Schema) - timezone column on shifts table; Phase 2 (Worker App) - correct timestamp capture; Phase 3 (Invoicing) - correct duration math

---

### 4. Supabase Service Role Key Exposure

- **What goes wrong:** Next.js bundles environment variables prefixed with `NEXT_PUBLIC_` into client JavaScript. Developers accidentally use `SUPABASE_SERVICE_ROLE_KEY` (which bypasses ALL RLS) in a Server Action or API route that gets imported by a client component. The key appears in the browser bundle. Attacker gains full database access to healthcare records of all participants.
- **Warning signs:** Using `process.env.SUPABASE_SERVICE_ROLE_KEY` in files that aren't exclusively server-side. `"use server"` directive missing from files using service key. Build output containing the service key (check with `grep` on `.next` folder). Using service role client in shared utility files.
- **Prevention:**
  1. Create TWO Supabase client files: `supabase-browser.ts` (anon key only) and `supabase-admin.ts` (service key, server-only)
  2. Add `import "server-only"` at the top of `supabase-admin.ts` - this causes a build error if imported from client
  3. Never prefix service role key with `NEXT_PUBLIC_`
  4. Add pre-commit hook that greps for service role key in client-accessible paths
  5. Add `.env.local` to `.gitignore` (obvious but often missed in monorepos)
  6. Use Supabase's `createServerClient` pattern from `@supabase/ssr` for authenticated server operations (uses user's JWT, not service key)
  7. Audit: service role key should only appear in: database migrations, background jobs, admin-only API routes with additional auth checks
- **Phase to address:** Phase 1 (Project Setup) - establish file conventions before any code is written

---

### 5. NDIS Double-Billing Compliance Violation

- **What goes wrong:** The system allows overlapping shifts (with warning) but doesn't prevent billing the same worker's time to two different participants simultaneously. Under NDIS rules, a worker cannot bill support time to Participant A from 9:00-10:00 AND to Participant B from 9:30-10:30 - this is fraud. The warning was meant for legitimate scenarios (travel time between shifts) but the invoicing system doesn't validate against double-billing.
- **Warning signs:** Overlapping shifts being invoiced without time-splitting. No validation in the invoice generation pipeline that checks for worker time overlaps. Invoice amounts exceeding worker's available hours for a day.
- **Prevention:**
  1. At invoice generation time, query ALL shifts for the same worker on the same day
  2. If overlaps exist, split billing to the minute: first shift gets time up to overlap start, second shift gets time from overlap start (or reject and flag for coordinator review)
  3. Add a database constraint or trigger: `worker_id + time_range` should not overlap without explicit admin approval stored as a flag
  4. Display overlap warnings at scheduling time AND at invoice generation time
  5. Add an "overlap resolution" field on shifts: `travel_time`, `group_support` (ratio billing), or `admin_approved_overlap`
  6. For group supports (1 worker, multiple participants), implement ratio billing per NDIS price guide rules
- **Phase to address:** Phase 2 (Scheduling) for warnings; Phase 3 (Invoicing) for billing validation

---

### 6. Missing Audit Trail for NDIS Commission Audits

- **What goes wrong:** NDIS Quality and Safeguards Commission can audit any registered provider. They need to see: who changed a shift, when case notes were modified, if incident reports were filed on time, complete billing history. Supabase has no built-in audit logging. Without it, you cannot prove compliance, and the provider risks deregistration.
- **Warning signs:** No `updated_by`, `updated_at` columns. No history tables. Using `UPDATE` without preserving previous values. Relying on Supabase's built-in `updated_at` (only stores last update, not history). Deleting records instead of soft-deleting.
- **Prevention:**
  1. Create an `audit_log` table: `id, table_name, record_id, action (INSERT/UPDATE/DELETE), old_data (jsonb), new_data (jsonb), user_id, timestamp`
  2. Create PostgreSQL triggers on ALL tables that write to audit_log on every change
  3. Make audit_log INSERT-only (no UPDATE/DELETE permissions, even for service role)
  4. NEVER hard-delete records - add `deleted_at` column (soft delete) to every table
  5. Audit log queries should use a separate read-only database connection
  6. Retain audit logs for 7 years (NDIS requirement aligns with ATO record-keeping)
  7. Add `created_by`, `updated_by` columns populated via `auth.uid()` trigger
- **Phase to address:** Phase 1 (Database Schema) - triggers must exist before any data is written

---

## Serious Pitfalls (Will Cause Pain)

### 7. Next.js App Router Auth + Middleware Caching

- **What goes wrong:** App Router's middleware runs on the edge and checks auth. But the router cache (client-side) caches page responses for 30 seconds by default. A coordinator logs out, another user logs in on the same browser - the cached page shows the previous user's data briefly. Or: admin revokes a worker's access, but the worker's cached pages still function for up to 30 seconds.
- **Warning signs:** Users reporting seeing other users' data briefly after login. Stale permission checks. Using `redirect()` in layouts that should re-run on every navigation.
- **Prevention:**
  1. Set `export const dynamic = 'force-dynamic'` on all authenticated pages/layouts
  2. Use `revalidatePath`/`revalidateTag` after any permission change
  3. Implement auth check at BOTH middleware level (redirect to login) AND component level (verify specific permissions)
  4. Use Supabase's `onAuthStateChange` listener on client to detect session expiry
  5. For admin actions that revoke access, use Supabase Realtime to push session invalidation
  6. Set `router.refresh()` after login/logout to clear client cache
- **Phase to address:** Phase 1 (Auth Setup) - establish patterns before building protected pages

---

### 8. Expo Go Limitations Discovered Too Late

- **What goes wrong:** Development starts with Expo Go (fast iteration, no native builds). Then you need: background location for geofenced check-in, local SQLite for offline data, push notifications with custom sounds, background sync. None of these work in Expo Go. Switching to development builds (EAS) mid-project requires native module configuration, Xcode/Android Studio setup, and completely different build pipelines. 2-3 week delay.
- **Warning signs:** Using Expo Go for all development. Not testing native features until "later." No EAS Build configuration in the project. Using AsyncStorage instead of SQLite for offline data (AsyncStorage has 6MB limit on Android).
- **Prevention:**
  1. Set up EAS Build from day one (even if Expo Go is used for UI development)
  2. Create a development build in week 1 and test on physical devices
  3. List all native dependencies upfront: `expo-location` (background), `expo-sqlite` or `@op-engineering/op-sqlite`, `expo-notifications`, `expo-background-fetch`
  4. Use Expo's "development client" (custom Expo Go with your native modules) for daily development
  5. Budget for Apple Developer Account ($99/year) and Google Play Console ($25 one-time) from project start
  6. Test push notifications on physical devices early - simulators handle them differently
- **Phase to address:** Phase 0 (Project Setup) - EAS configuration before any mobile code

---

### 9. NDIS Price Guide Versioning

- **What goes wrong:** NDIS updates their Support Catalogue and Price Guide annually (sometimes mid-year). Support items get new codes, prices change, some items are discontinued. Your system hardcodes current prices. When the new guide drops, you either can't bill (new codes don't exist in system) or bill at wrong rates (old prices for new period). Worse: some shifts span a price boundary (shift on June 30 billed at old rate, shift on July 1 at new rate).
- **Warning signs:** Price amounts stored directly on shift/invoice records without reference to a price table. No `effective_from`/`effective_to` dates on rate records. Single price per support item without versioning.
- **Prevention:**
  1. Create a `rate_cards` table: `support_item_code, rate_per_unit, unit_type (hour/km/each), effective_from, effective_to, ndis_price_guide_version`
  2. Invoice generation looks up rate valid on the DATE OF SERVICE (not invoice date)
  3. Build an admin UI to import new price guides (CSV upload matching NDIS format)
  4. Support "draft" rate cards that can be imported before effective date
  5. Handle transition: shift starting 11:30 PM June 30, ending 1:30 AM July 1 - split billing at midnight to apply correct rates
  6. Store the `rate_card_id` on each invoice line item for audit trail
- **Phase to address:** Phase 3 (Invoicing) - rate table design is prerequisite to any billing logic

---

### 10. NDIS Incident Reporting Deadline Enforcement

- **What goes wrong:** NDIS registered providers must report "reportable incidents" to the NDIS Commission within 24 hours (immediately for death or sexual abuse). The platform records incidents but doesn't enforce deadlines. A worker logs an incident at 3 PM Friday, coordinator doesn't see it until Monday - deadline breached. Commission issues compliance notice.
- **Warning signs:** Incident form exists but no notification system. No escalation workflow. No timestamp tracking of when incident was reported vs when it occurred. No dashboard showing "incidents approaching deadline."
- **Prevention:**
  1. Incident table needs: `occurred_at`, `reported_at` (to platform), `notified_commission_at`, `severity` (category 1 = immediate, category 2 = 24hrs)
  2. On incident creation: immediate push notification + email to coordinator AND admin
  3. Escalation timer: if no action in 4 hours, escalate to admin. If no action in 12 hours, auto-email to organization's compliance officer
  4. Dashboard widget: "Incidents requiring Commission notification" with countdown timer
  5. Commission notification tracking: checkbox + timestamp for "reported to Commission" with mandatory notes
  6. Block: cannot close incident without confirming Commission notification status
- **Phase to address:** Phase 4 (Compliance Features) - but notification infrastructure needed in Phase 1

---

### 11. Worker Screening Check Expiry

- **What goes wrong:** NDIS Worker Screening Checks are mandatory and expire (typically 5 years). Platform allows scheduling workers whose checks have expired or are about to expire. Provider is in breach of NDIS Practice Standards. If an incident occurs with an unscreened worker, provider faces severe penalties.
- **Warning signs:** Worker profile has screening number but no expiry date. No background job checking upcoming expiries. Scheduling allows any "active" worker without screening validation.
- **Prevention:**
  1. Worker profile fields: `screening_check_number`, `screening_state` (issuing state), `screening_expiry_date`, `screening_status` (cleared/pending/expired/revoked)
  2. Database constraint: cannot create shift with worker whose `screening_expiry_date < shift_date`
  3. Background job (Supabase pg_cron or Edge Function): daily check for expiries within 90, 60, 30, 14, 7 days - notify worker and admin
  4. Dashboard: "Workers with expiring checks" prominently displayed
  5. Auto-set worker to "inactive" on expiry date (with notification cascade to reassign upcoming shifts)
  6. Support multiple check types: NDIS Worker Screening, Working With Children Check, Police Check - each with own expiry
- **Phase to address:** Phase 2 (Worker Management) - must be enforced before any scheduling

---

### 12. Monorepo Build/Deploy Coupling

- **What goes wrong:** Shared package change (e.g., fixing a type in `packages/shared-types`) triggers both web deploy (Vercel) and mobile build (EAS). EAS builds take 15-30 minutes. A typo fix in shared types causes a 30-minute mobile rebuild. Alternatively: mobile and web get out of sync because deploy pipelines aren't connected properly.
- **Warning signs:** Every PR triggers all CI jobs. Mobile builds happening for web-only changes. No `turbo.json` or equivalent workspace dependency graph. Import paths using relative `../../` instead of workspace packages.
- **Prevention:**
  1. Use Turborepo or Nx for workspace orchestration with proper dependency graph
  2. Configure Vercel's "Ignored Build Step" to check if web-relevant files changed: `npx turbo-ignore web`
  3. EAS builds should only trigger when mobile-relevant packages change (use EAS Build hooks or GitHub Actions with path filters)
  4. Structure packages clearly: `packages/shared-types`, `packages/shared-utils`, `apps/web`, `apps/mobile`
  5. Pin shared package versions in workspaces (or use `workspace:*` with lockfile)
  6. Separate CI pipelines: `web-ci.yml` (path filter: `apps/web/**`, `packages/shared-*/**`) and `mobile-ci.yml` (path filter: `apps/mobile/**`, `packages/shared-*/**`)
- **Phase to address:** Phase 0 (Project Setup) - monorepo structure before any code

---

### 13. Case Notes Data Sensitivity Leakage

- **What goes wrong:** Case notes contain sensitive participant information (mental health details, behavioral incidents, family situations). RLS policy gives "all workers assigned to participant" read access. But a relief worker covering one shift shouldn't see 2 years of case history. Participant's GP referral notes shouldn't be visible to a domestic assistance worker. Over-sharing violates Privacy Act and NDIS information handling rules.
- **Warning signs:** Single `case_notes` table with uniform RLS. No sensitivity classification on notes. All workers for a participant seeing all notes. No access logging for case note reads.
- **Prevention:**
  1. Add `visibility` field to case notes: `shift_only` (only workers on that specific shift), `team` (assigned workers), `coordinator_only`, `restricted` (admin + coordinator only)
  2. RLS policy checks visibility level against user's role AND their assignment to the participant
  3. Separate table for "restricted notes" (incident details, health information) with stricter RLS
  4. Log every case note READ (not just writes) to audit table - compliance requires knowing who accessed what
  5. Time-based access: relief workers only see notes from their shift date +/- 1 day
  6. Participant consent tracking: which information categories has participant consented to share with which worker types
- **Phase to address:** Phase 2 (Case Notes) - data model design; Phase 4 (Compliance) - access logging

---

### 14. Auto-Checkout Edge Cases

- **What goes wrong:** Auto-checkout triggers after buffer period for workers who forget to check out. But: (a) Worker is still providing care - auto-checkout creates billing discrepancy, (b) Worker's phone died - they can't manually check out, auto-checkout uses wrong time, (c) Overnight shifts - auto-checkout at midnight? (d) Admin override creates a new checkout record but old auto-checkout is already on a submitted invoice.
- **Warning signs:** Auto-checkout as simple cron job without state management. No distinction between "forgot to checkout" and "still working." No notification before auto-checkout. No mechanism to dispute auto-checkout time.
- **Prevention:**
  1. Pre-auto-checkout warning: push notification 15 minutes before buffer expires ("Are you still on shift? Tap to confirm or check out")
  2. Auto-checkout should create a `checkout_type: 'auto'` record flagged for review
  3. Admin override: can adjust auto-checkout time, creating new record with `checkout_type: 'admin_override'` + reason
  4. Auto-checkout should NOT trigger invoice generation - flagged shifts go to "pending review" queue
  5. Buffer calculation: `scheduled_end_time + buffer_minutes` (buffer configurable per org, default 30 min)
  6. Overnight shift handling: auto-checkout only triggers if shift is > buffer past scheduled end AND no worker activity (GPS, app interaction) detected
  7. Keep both original auto-checkout and override in audit trail
- **Phase to address:** Phase 2 (Check-in/out) - define state machine before implementation

---

### 15. PDF Invoice Generation in Serverless

- **What goes wrong:** Using Puppeteer/Chromium for PDF generation in Vercel serverless functions. Binary is 50MB+ (exceeds Vercel's 50MB function size limit). Cold starts take 5-10 seconds. Memory usage spikes cause function crashes. Alternative: `@react-pdf/renderer` works but has memory leaks on repeated renders in long-running processes. Batch invoice generation (end of month, 200+ invoices) times out.
- **Warning signs:** PDF library installed but not tested in production environment. Using Puppeteer locally (works fine) but not in serverless. Timeout errors on bulk invoice generation. Memory usage climbing in Edge Functions.
- **Prevention:**
  1. Use `@react-pdf/renderer` in a dedicated Supabase Edge Function (Deno runtime, not Node)
  2. For bulk generation: use a queue (Supabase's `pg_notify` + Edge Function listener, or Inngest/Trigger.dev)
  3. Generate one PDF per invocation, store to Supabase Storage, update invoice record with URL
  4. Alternative: use a headless Chrome service (Browserless.io, or self-hosted on Fly.io) called via API
  5. Cache generated PDFs in Supabase Storage - regenerate only if invoice data changes
  6. For simple invoices: HTML-to-PDF services (e.g., DocRaptor API) are more reliable than self-hosted rendering
  7. Template approach: design invoice template in HTML, populate with data, convert to PDF server-side
- **Phase to address:** Phase 3 (Invoicing) - spike PDF generation approach before building invoice pipeline

---

## Minor Pitfalls (Will Slow You Down)

### 16. Supabase Realtime Connection Limits

- **What goes wrong:** Each worker app subscribing to shift updates = 1 Realtime connection. With 50 concurrent workers + admin dashboards, you hit Supabase free tier limits (200 concurrent connections). Paid tier has higher limits but costs scale.
- **Prevention:**
  1. Workers subscribe to their own shifts only (filter: `worker_id=eq.${userId}`)
  2. Admin dashboard uses polling (30-second intervals) instead of Realtime for non-critical data
  3. Use Realtime only for: shift assignments, urgent notifications, check-in confirmations
  4. Implement connection pooling awareness - unsubscribe when app is backgrounded
  5. Monitor connection count in Supabase dashboard

---

### 17. Next.js `use client` Directive Creep

- **What goes wrong:** One interactive element in a page requires `"use client"`. Developers add the directive to the entire page component instead of extracting the interactive part. Entire page tree becomes client-rendered, losing SSR benefits (SEO, initial load performance, server-side data fetching).
- **Prevention:**
  1. Convention: pages and layouts are ALWAYS Server Components
  2. Interactive elements are extracted to `components/client/` folder with `"use client"` directive
  3. Data fetching happens in Server Components, passed as props to Client Components
  4. Use composition pattern: Server Component wraps Client Component, not the reverse
  5. ESLint rule: warn on `"use client"` in `app/` directory files

---

### 18. React Native Navigation + Deep Linking

- **What goes wrong:** Push notification says "New shift assigned" - user taps it - app opens to home screen instead of the shift detail. Deep linking configuration is complex in React Native, especially with Expo Router. Auth-gated deep links (notification arrives when logged out) need to redirect to login, then to the intended screen.
- **Prevention:**
  1. Configure Expo Router's deep linking from day one (not retrofitted)
  2. Handle auth-gated deep links: store intended route, redirect after login
  3. Test deep links on both iOS and Android physical devices (behavior differs)
  4. Use Expo Notifications' `getLastNotificationResponseAsync` for cold-start deep links

---

### 19. GST Rounding Errors on Invoices

- **What goes wrong:** Calculating GST: `$45.37 / 11 = $4.124545...` Rounding per line item vs per invoice total gives different results. ATO has specific rules. Floating-point arithmetic in JavaScript introduces additional errors (0.1 + 0.2 !== 0.3).
- **Prevention:**
  1. Store ALL monetary values as integer cents in the database (4537, not 45.37)
  2. Calculate GST per line item, round to nearest cent, then sum
  3. Use integer math: `gst = Math.round(amountCents / 11)` for GST-inclusive amounts
  4. Validate: `line_items_sum + gst_sum = invoice_total` (reconciliation check)
  5. Display formatting only at UI layer: `(cents / 100).toFixed(2)`

---

### 20. Supabase Auth Session Refresh Race Condition

- **What goes wrong:** Access token expires (default 1 hour). Multiple simultaneous API calls each try to refresh the token. Only one succeeds, others get 401. This is especially problematic on mobile when app resumes from background with expired token and multiple queries fire.
- **Prevention:**
  1. Use Supabase's built-in `autoRefreshToken` (enabled by default)
  2. Implement a token refresh mutex: first caller refreshes, others wait for result
  3. On mobile: refresh token proactively when app returns to foreground (before making queries)
  4. Add retry logic with exponential backoff for 401 responses

---

### 21. Monorepo TypeScript Path Aliases

- **What goes wrong:** `@shared/types` works in web (Next.js resolves via `tsconfig.json` paths) but not in mobile (Metro bundler has different resolution). Different build tools, different module resolution. Errors only appear at build time, not in IDE.
- **Prevention:**
  1. Use TypeScript project references AND explicit package.json in each workspace package
  2. Configure Metro bundler's `watchFolders` and `nodeModulesPaths` for monorepo packages
  3. Use `tsconfig.json` `extends` pattern: base config in root, app-specific overrides
  4. Test: can each app build independently with `npx turbo build --filter=web` and `--filter=mobile`

---

### 22. Supabase Database Migrations in Team Environment

- **What goes wrong:** Two developers create migration files locally. Both add columns to the same table. Migration numbering conflicts on merge. Or: developer runs `supabase db push` (bypasses migration files) in development, schema is out of sync with migration history.
- **Prevention:**
  1. NEVER use `supabase db push` (direct schema changes) - always create migration files
  2. Use sequential timestamp-based naming (Supabase default)
  3. PR rule: only one migration file per PR (squash if needed)
  4. Run `supabase db reset` in CI to verify migrations apply cleanly from scratch
  5. Lock migration creation to main branch for production-bound changes

---

### 23. Mobile App Store Review Delays

- **What goes wrong:** V1 is ready for worker testing. Submit to App Store - 2-7 day review. Apple rejects for: missing privacy manifest (new requirement 2024+), background location justification insufficient, or healthcare data handling explanation needed. Each rejection + resubmit = another week.
- **Prevention:**
  1. Submit a minimal "hello world" build in Phase 0 to establish the app listing and pass initial review
  2. Add privacy manifest (`PrivacyInfo.xcprivacy`) from the start with all required API declarations
  3. Background location: write the justification string in Info.plist immediately (NDIS workers need location for shift verification)
  4. Use TestFlight/Google Internal Testing for development (no full review needed)
  5. Budget 2 weeks for first production App Store submission

---

## Stack-Specific Gotchas

### Next.js App Router

| Gotcha | Impact | Fix |
|--------|--------|-----|
| `fetch()` caches by default in Server Components | Stale shift data in dashboards | Add `{ cache: 'no-store' }` or use `revalidate: 0` for dynamic data |
| Middleware runs on Edge Runtime (no Node.js APIs) | Can't use Supabase admin client in middleware | Middleware only checks session exists; API routes do authorization |
| `generateStaticParams` + dynamic data | Pages pre-rendered with stale data | Don't use static generation for authenticated pages |
| Server Actions have 1MB body limit | File uploads (incident photos) fail | Use Supabase Storage direct upload with signed URLs |
| Parallel routes + loading states | Complex dashboard layouts break navigation | Test parallel routes thoroughly; fallback to simpler layouts if unstable |
| `cookies()` is read-only in Server Components | Can't set auth cookie in RSC | Use Route Handlers or Server Actions to set cookies |

### Supabase

| Gotcha | Impact | Fix |
|--------|--------|-----|
| RLS on `storage.objects` is separate from table RLS | Uploaded files (case note attachments) accessible to wrong users | Configure Storage RLS policies explicitly per bucket |
| `auth.uid()` returns NULL in triggers | Audit trail `created_by` is NULL | Pass user ID as function parameter or use `current_setting('request.jwt.claims')` |
| Supabase Edge Functions cold start: 1-2s | First PDF generation / notification slow | Use `Deno.serve` keep-alive; or accept cold starts for background jobs |
| `supabase.auth.getUser()` makes a network request | Slow if called on every page load | Use `supabase.auth.getSession()` for reading JWT claims (faster, cached) |
| Postgres `timestamptz` stores UTC but displays in session timezone | Confusion between stored and displayed times | Always use `AT TIME ZONE` in queries or handle conversion in application |
| RLS doesn't apply to database functions with `SECURITY DEFINER` | Bypasses row-level security if not careful | Use `SECURITY INVOKER` by default; only use DEFINER when explicitly needed with internal permission checks |
| Connection pooler (PgBouncer) doesn't support prepared statements in Transaction mode | Prisma / ORMs fail silently | Use Supabase's direct connection for migrations, pooler for app queries |

### React Native / Expo

| Gotcha | Impact | Fix |
|--------|--------|-----|
| AsyncStorage limit: 6MB on Android | Offline shift cache exceeds limit with case notes | Use `expo-sqlite` or `op-sqlite` for offline storage |
| Expo updates (OTA) don't update native code | New native module requires full app store update | Plan native dependency changes for major versions only |
| Background fetch is unreliable on iOS | Sync doesn't happen in background consistently | Use push notifications to trigger sync; don't rely on background fetch alone |
| Keyboard avoiding view differs iOS vs Android | Case note input form layout breaks | Use `KeyboardAvoidingView` with platform-specific behavior; test both |
| React Native's `Date` is V8/Hermes dependent | Time parsing differences between dev and production | Use `luxon` for all date operations; never raw `new Date(string)` |
| Expo Router file-based routing | Deep routes create deeply nested folder structures | Use route groups `(auth)`, `(tabs)` to organize without deep nesting |
| Hermes engine doesn't support all Intl APIs | `Intl.DateTimeFormat` for Australian date formatting fails | Polyfill with `intl-pluralrules` and `@formatjs/intl-datetimeformat` or use luxon |

---

## NDIS Domain Gotchas

### Regulatory

| Requirement | Common Mistake | Correct Approach |
|-------------|---------------|------------------|
| Reportable incidents: immediate notification for Category 1 | No severity classification; treating all incidents the same | Severity-based escalation: immediate (death/abuse) vs 24h (other reportable) |
| Worker Screening mandatory for all workers | Storing "has check" boolean without expiry tracking | Store check number + state + expiry + status; auto-deactivate on expiry |
| Participant consent for information sharing | Blanket consent at registration | Granular consent per information type + per recipient type; re-consent annually |
| NDIS Code of Conduct | No code of conduct acknowledgment in worker onboarding | Annual acknowledgment with timestamp; block access until acknowledged |
| Restrictive practices reporting | No separate tracking for restrictive practices | Dedicated restrictive practices register with mandatory fields per NDIS guidelines |
| Plan management types: self-managed, plan-managed, NDIA-managed | Single invoicing workflow for all types | Different invoice recipients and formats per plan management type |

### Billing

| Edge Case | What Goes Wrong | Correct Handling |
|-----------|----------------|------------------|
| Worker arrives early, participant not ready | Billing starts at early arrival time | Bill from SCHEDULED start or ACTUAL start, whichever is LATER |
| Worker leaves early (participant request) | Bill full scheduled time | Bill ACTUAL time (lesser of scheduled vs actual) |
| Shift cancelled < 7 days notice | No billing | Short-notice cancellation: bill per NDIS cancellation policy (usually full rate or percentage) |
| Public holiday shifts | Billed at normal rate | Apply public holiday loading (varies by support item; some items have specific holiday rates) |
| Travel between participants | Travel time not captured | Separate travel line items with km-based or time-based billing per price guide |
| Group support (1:3 ratio) | Billed at 1:1 rate | Divide hourly rate by participant ratio; different line items per participant |
| Sleepover shifts | Active hours billed as normal | Sleepover has specific rate in price guide; active time during sleepover billed separately |

### Data Handling

| Requirement | Common Mistake | Correct Approach |
|-------------|---------------|------------------|
| Australian Privacy Principles (APPs) | Data stored in US region | Supabase project MUST be in Sydney region (`ap-southeast-2`) |
| Data retention | Keeping data forever / deleting too early | 7-year retention for financial records; specific retention per data type |
| Participant access to own data | No self-service data export | Participant portal must include downloadable data (case notes, invoices, plans) |
| Data breach notification | No breach response plan | 72-hour notification to OAIC; immediate internal process documentation |
| Data minimization | Collecting unnecessary participant information | Only collect what's needed for service delivery; review annually |
| Cross-border data transfer | Using US-based services for processing | All participant data processing must remain in Australia; check all third-party services |

---

## Phase Mapping Summary

| Phase | Pitfalls to Address |
|-------|-------------------|
| **Phase 0: Setup** | #4 (Service Key Security), #8 (EAS Build), #12 (Monorepo Structure), #23 (App Store Prep) |
| **Phase 1: Foundation** | #1 (RLS Performance), #3 (Timezone Design), #6 (Audit Trail), #7 (Auth Caching), #22 (Migrations) |
| **Phase 2: Core Features** | #2 (Offline Sync), #5 (Overlap Prevention), #11 (Worker Screening), #13 (Case Note Sensitivity), #14 (Auto-Checkout) |
| **Phase 3: Invoicing** | #3 (DST Billing), #5 (Double-Billing), #9 (Price Guide Versions), #15 (PDF Generation), #19 (GST Rounding) |
| **Phase 4: Compliance** | #10 (Incident Deadlines), #13 (Access Logging), NDIS Domain Gotchas |
| **Ongoing** | #16 (Realtime Limits), #17 (Client Directive Creep), #20 (Token Refresh), #21 (Path Aliases) |

---

## Pre-Build Checklist (Address Before Writing Code)

- [ ] Supabase project region set to `ap-southeast-2` (Sydney)
- [ ] Service role key file has `import "server-only"` guard
- [ ] EAS Build configured and first development build succeeds
- [ ] Monorepo structure with Turborepo and proper workspace packages
- [ ] `audit_log` table and triggers created in first migration
- [ ] Timezone column (`iana_timezone`) on shifts table in schema design
- [ ] `rate_cards` table designed with `effective_from`/`effective_to`
- [ ] Worker screening fields with expiry on workers table
- [ ] Soft-delete (`deleted_at`) column convention established
- [ ] All monetary values stored as integer cents (not floating point)
- [ ] RLS policies benchmarked with 10K+ rows before feature development
- [ ] Apple Developer + Google Play accounts created
- [ ] Privacy manifest and background location justification written
- [ ] Conflict resolution strategy documented for offline sync
- [ ] PDF generation approach spiked and validated in serverless environment
