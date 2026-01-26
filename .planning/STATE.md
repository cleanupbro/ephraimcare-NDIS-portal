# Project State: Ephraim Care

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-24)

**Core value:** Schedule shifts, track check-ins, generate invoices from actual hours worked
**Current focus:** Phase 13 (Scale Features) in progress. Multi-org foundation complete.

## Current Position

Phase: 13 of 13 (Scale Features)
Plan: 8 of 12 in current phase
Status: In progress
Last activity: 2026-01-27 -- Completed 13-08-PLAN.md (Participant Goal Tracking)

Progress: [█████████████████████████████████████████████████████] 98%

## Performance Metrics

**Velocity:**
- Total plans completed: 72 (Phase 1: 9, Phase 2: 5, Phase 3: 5, Phase 4: 4, Phase 5: 9, Phase 6: 4, Phase 7: 7, Phase 8: 4, Phase 9: 3, Phase 10: 2, Phase 11: 7, Phase 12: 6, Phase 13: 7)
- Average duration: --
- Total execution time: --

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 9/9 | -- | -- |
| 2 | 5/5 | -- | -- |
| 3 | 5/5 | -- | -- |
| 4 | 4/4 | -- | -- |
| 5 | 9/9 | -- | -- |
| 6 | 4/4 | -- | -- |
| 7 | 7/7 | -- | -- |
| 8 | 4/4 | -- | -- |
| 9 | 3/3 | -- | -- |
| 10 | 2/2 | -- | -- |
| 11 | 7/7 | -- | -- |
| 12 | 6/6 | -- | -- |
| 13 | 7/12 | -- | -- |

**Recent Trend:**
- Last 5 plans: --
- Trend: --

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Foundation phase: RLS + audit trail + timezone handling MUST come before any feature work (cannot be retrofitted)
- Build order: Shifts before mobile, invoicing before participant portal, screening before compliance dashboard
- RLS helper functions use SECURITY DEFINER with COALESCE fallback (works without custom JWT hook enabled)
- Cookie typing uses explicit CookieToSet[] for Supabase SSR v0.6.1 compatibility
- Form schemas (apps/admin/lib/participants/schemas.ts) are separate from server schemas (packages/utils/src/validators.ts) -- stricter multi-step form validation vs basic server-side
- shadcn/ui components created manually in monorepo (CLI doesn't work well with pnpm workspaces)
- Per-step independent useForm instances (not shared FormProvider) for React 19 compatibility
- Supabase inserts use type assertions (as any) due to postgrest-js v12 Generic type resolution issue
- Dedicated hook files for form needs (use-check-ndis.ts, use-create-participant.ts) to avoid conflicts with parallel plan 02-02
- use-participants.ts re-exports from sibling hook files (single import point for consumers)
- useDeferredValue for search debounce (React 19 native pattern, no external lib)
- Server-side initial fetch + client TanStack Query for list pages (SSR first paint + client interactivity)
- Custom amber badge class for plan countdown (avoids adding variant to shared Badge component)
- plan_budgets queried with (as any) type assertion due to missing PostgREST type mapping
- Budget bar caps at 100% display even when overspent (Math.min)
- participantEditSchema omits ndis_number (separate from participantFullSchema used for creation)
- NDIS number shown as locked static text with Lock icon (not disabled input)
- Edit available for both active and archived participants; Archive only for active
- Type-to-confirm archive requires exact case-sensitive full name match
- Worker compliance stored as columns on workers table (Option B) for MVP -- only 2 check types
- 90-day threshold for compliance expiring status (industry standard)
- workerEditSchema omits email (auth identity, matches participant pattern)
- Client-side search for worker list (PostgREST cannot filter on joined profile fields)
- Worker status uses active/inactive/all (not archived -- different domain language)
- PostgREST (as any) on shifts join query for next-shift in worker stats (same pattern as plan_budgets)
- StatusBadge uses colored dot + Badge variant for dual visual compliance indicator
- Qualifications stored as textarea split by newline (free-form, not multi-select)
- Native checkbox with Tailwind for support type grid (no shadcn Checkbox component)
- Worker invite API uses manual rollback cleanup (delete on insert failure)
- useUpdateWorker splits profile fields and worker fields for separate Supabase updates
- Resend invite uses generateLink (not inviteUserByEmail) to avoid duplicate user creation
- Resend Invite button only shown for active workers (is_active check)
- Default shift status = pending (new shifts require coordinator confirmation)
- support_type stored as text (not enum) for flexibility with NDIS category additions
- Overlap detection index excludes cancelled shifts (partial index for performance)
- Client-side filtering for shift list (week data is small; avoids API filter complexity)
- Cancelled shifts hidden by default in list view (admin opts-in via status filter)
- Inline edit mode within detail sheet (no page navigation; stays in list context)
- PostgREST (as any) on .from('shifts') for update mutations (matches established pattern)
- Support type mismatch is a hard form error (setError), NOT an overridable conflict warning (worker qualifications are data integrity, not operational flexibility)
- expo-sqlite localStorage adapter for Supabase session persistence (SecureStore 2048-byte limit incompatible with JWT tokens)
- pg_cron auto-checkout for stale shifts (server-side, works even if app closed/offline)
- Separate shift_check_ins table (not columns on shifts) for cleaner offline sync and GPS tracking
- PersistQueryClientProvider with AsyncStorage persister for 24h offline query cache
- NetInfo-based sync listener processes FIFO queue on reconnection (check-in before check-out ordering)
- Timer uses absolute Date.now() - startTime calculation (not incrementing counter) for accuracy after backgrounding
- AppState 'active' listener recalculates elapsed time on foreground resume
- fontVariant: ['tabular-nums'] prevents timer digit width jumps
- Check-out GPS is optional (doesn't block if permission denied)
- Duration calculated from check_in_time (server truth, not client timer)
- Case note minimum 10 characters to prevent empty submissions
- Expo push token upserted on worker_id conflict (one token per worker)
- Sync breaks on first failure to maintain FIFO order integrity
- Unique (shift_id, worker_id) constraint on case_notes (one note per shift per worker)
- 24h edit window uses shift_check_ins.check_out_time (not note created_at)
- Admin comments in separate table for RLS isolation from workers
- Participant case note visibility removed entirely (clinical privacy)
- Upsert with onConflict: 'shift_id,worker_id' prevents duplicate case notes from offline sync replay
- Offline case note error dismisses modal after 1.5s delay (user sees confirmation before close)
- organizationId passed from participant object to CaseNotesTab for admin comment insertion (avoids extra DB lookup)
- Worker filter Select uses 'all' placeholder value, filtered out before query to prevent DB mismatch
- Gapless invoice counter uses INSERT ON CONFLICT DO UPDATE (atomic, no race conditions)
- INV-YYYY-NNN format (3-digit padding, resets per year per org)
- Finalization trigger blocks UPDATE on submitted/paid (not cancelled/overdue)
- day_type uses CHECK constraint (not enum) for flexibility
- support_type_rates effective_from with UNIQUE for rate versioning without deletion
- HTML datalist for support type suggestions (allows free text while suggesting from SUPPORT_TYPES)
- Simple list layout for holidays (not DataTable) -- small list size (10-20 items)
- Lesser-of rule for billing: billable_minutes = min(scheduled, actual)
- Rate snapshot stored in line item unit_price at generation time
- Shifts without configured rates are skipped (not failed) during invoice generation
- use-invoices.ts created as blocking deviation when 07-04 ran in parallel
- Invoice preview uses DRAFT watermark with absolute positioning for draft status
- Finalize confirmation uses AlertDialog with explicit locked state warning
- PDF export uses toBlob() + arrayBuffer() (more portable than toBuffer() which may return ReadableStream)
- InvoicePDF called as function to get Document element directly (pdf() type requirement)
- Inter fonts downloaded from jsDelivr fontsource CDN (Google Fonts/GitHub LFS don't allow direct curl)
- Placeholder logo created; real Ephraim Care logo should replace ephraim-care-logo.png
- Participant portal follows admin auth patterns (Supabase SSR, cookie typing)
- Participant role verification requires both profile.role='participant' AND linked participants record
- QueryProvider in separate 'use client' file keeps root layout as server component for metadata
- Participant dashboard budget bar uses 75%/90% thresholds (green/amber/red)
- Days remaining <= 30 shows amber warning color in plan info card
- Upcoming appointments capped at 5 shifts in dashboard
- Participant invoice hooks filter status != draft (participants only see finalized)
- PDF route verifies participant role before allowing download
- Transform billable_minutes to quantity_hours in hook for display
- Profile page organized into logical sections: Personal Info, Contact, Emergency Contact, Support Needs
- Sidebar extracted as client component for usePathname access
- Logout uses router.refresh() after signOut to clear server-side cache
- Active link highlighting uses pathname comparison with startsWith for nested routes
- Fire-and-forget email pattern: no await on fetch, .catch() for silent error logging
- ADMIN_EMAIL constant for CC on all notification emails
- Notification templates use inline CSS for email client compatibility
- Participant email comes from participants.email (not profiles join)
- Emergency contact email not in schema - passed as null for invoice notifications
- Notification data fetched via select join (create-shift) or separate query (cancel-shift) to keep mutation signatures unchanged
- DATE_RANGE_PRESETS use getValue() functions for dynamic calculation (not static dates that would become stale)
- CSV export includes UTF-8 BOM for Excel compatibility
- ReportLayout uses slot pattern for filterSlot - reports can inject custom filters
- DateRangePicker is custom component using date-fns (no react-day-picker dependency)
- Budget bar chart shows top 10 participants by utilization (sorted highest first)
- Alert thresholds for budget: ok (<75%), warning (75-90%), critical (>90%)
- ChartCard reusable wrapper for chart sections in reports
- Report hooks return { data, totals } structure for unified consumption
- generateCsv uses T extends object (not Record<string,unknown>) for typed interfaces
- SheetJS Excel export with auto-column sizing based on content width
- Generic ReportPdfDocument component reuses invoice brand colors and Inter fonts
- ReportColumn interface adds width/align/format options for PDF customization beyond CsvColumn
- DD/MM/YYYY Australian date format for all accounting exports (Xero, MYOB compatibility)
- Xero uses GST Free Income tax type; MYOB uses FRE tax code (NDIS GST-exempt)
- Server-side CSV generation for accounting exports (RLS enforced)
- Created organizations table (was previously implicit UUID only) to store settings and org metadata
- Platform admin uses is_platform_admin boolean column + SQL function (not separate role enum)
- RLS policies use OR is_platform_admin() pattern for cross-org read access
- Service role used for registration API (auth.admin.createUser requires it)
- Twilio credentials stored as separate columns (not JSONB) for future column-level encryption
- Auth token is write-only - not returned in queries for security
- Alert UI component added to packages/ui for integration info messages
- Manual rollback pattern for org registration (auth is external to DB, no transaction)
- OAuth2 state parameter encodes organizationId + timestamp for CSRF protection
- Token refresh triggered 60 seconds before expiry (buffer)
- First Xero tenant used for multi-org Xero accounts (most common case)
- Connection cleanup on refresh failure: clear tokens and set xero_connected=false
- Goal categories aligned with NDIS support domains (daily_living, community, employment, relationships, health, learning, other)
- Progress notes use 1-5 rating scale (No progress to Excellent progress)
- Workers can add progress notes, only admin/coordinator can create/delete goals
- Progress notes optionally linked to shifts for shift-based tracking

### Pending Todos

- Hook consolidation complete: use-participants.ts re-exports from use-check-ndis.ts and use-create-participant.ts

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-01-27
Stopped at: Completed 13-06-PLAN.md (Xero OAuth2 Connection)
Resume file: None

## Phase Progress

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 1 | Foundation | Complete | 9/9 |
| 2 | Participant Management | Complete | 5/5 |
| 3 | Worker Management | Complete | 5/5 |
| 4 | Shift Scheduling | Complete | 4/4 |
| 5 | Worker Mobile App | Complete | 9/9 |
| 6 | Case Notes | Complete | 4/4 |
| 7 | Invoicing | Complete | 7/7 |
| 8 | Participant Portal | Complete | 4/4 |
| 9 | Notifications | Complete | 3/3 |
| 10 | Worker Screening | Complete | 2/2 |
| 11 | Compliance and Incidents | Complete | 7/7 |
| 12 | Reporting and Export | Verified | 6/6 |
| 13 | Scale Features | In progress | 7/12 |

## Session Log

| Date | Action | Result |
|------|--------|--------|
| 2026-01-24 | Project initialized | PROJECT.md, config.json, research, REQUIREMENTS.md created |
| 2026-01-24 | Roadmap created | 13 phases, 108 requirements mapped, ROADMAP.md + STATE.md written |
| 2026-01-24 | Phase 1 built | Monorepo, migrations, auth, seed data, all pages, RLS fix |
| 2026-01-24 | Phase 1 UAT | 12/12 tests passed, no issues |
| 2026-01-24 | Phase 2 Plan 01 executed | Schemas + DataTable + 15 UI components installed |
| 2026-01-24 | Phase 2 Plan 03 executed | Multi-step form, Zustand store, NDIS check, DB types fixed |
| 2026-01-24 | Phase 2 Plan 02 executed | Participant list page, query hooks, search/filter, DataTable |
| 2026-01-24 | Phase 2 Plan 04 executed | Detail page, budget progress bar, plan countdown badge |
| 2026-01-24 | Phase 2 Plan 05 executed | Edit form (read-only NDIS), archive dialog, detail actions |
| 2026-01-24 | Phase 2 verified | 9/9 requirements verified, VERIFICATION.md created |
| 2026-01-24 | Phase 3 Plan 01 executed | Migration, Zod schemas, constants, domain types |
| 2026-01-24 | Phase 3 Plan 02 executed | Worker list page, DataTable, search/filter, compliance dot |
| 2026-01-24 | Phase 3 Plan 04 executed | Worker detail page, stats hook, compliance badges |
| 2026-01-24 | Phase 3 Plan 03 executed | Worker creation form, invite API, mutation hook |
| 2026-01-24 | Phase 3 Plan 05 executed | Edit form (read-only email), resend invite API, detail actions |
| 2026-01-24 | Phase 3 verified | 3/5 must-haves verified (2 gaps are Phase 4/5 dependencies: worker mobile login, hours column) |
| 2026-01-24 | Phase 4 Plan 01 executed | Migration, Zod schemas, constants, domain types for shift scheduling |
| 2026-01-24 | Phase 4 Plan 02 executed | Sheet UI component, shift list page (grouped by day, week nav) |
| 2026-01-24 | Phase 4 Plan 03 executed | Create shift form, conflict detection, override dialogs |
| 2026-01-24 | Phase 4 Plan 04 executed | Filter bar, detail sheet, inline edit, cancel flow |
| 2026-01-24 | Phase 4 verified | 5/5 must-haves verified (support type validation fixed: warning -> hard rejection) |
| 2026-01-24 | Phase 5 Plan 01 executed | Migration (shift_check_ins, push_tokens, geo columns), Supabase client, constants |
| 2026-01-25 | Phase 5 Plans 02-09 executed | Auth, hooks, admin override, home tab, GPS check-in, schedule, timer, offline sync |
| 2026-01-25 | Phase 5 verified | 20/20 must-haves passed, all worker mobile features implemented |
| 2026-01-25 | Phase 6 Plan 01 executed | Migration (concern_flag, admin_comments, 24h RLS, trigger) + Zod schema |
| 2026-01-25 | Phase 6 Plan 02 executed | CaseNoteModal form + useCreateCaseNote hook + syncStore case_note type |
| 2026-01-25 | Phase 6 Plan 03 executed | Admin case notes tab, hooks, filters, review/comments on participant detail |
| 2026-01-25 | Phase 6 Plan 04 executed | My Notes tab, pending shifts list, tab bar badge, useEditCaseNote hook |
| 2026-01-25 | Phase 6 verified | 5/5 success criteria passed, all 6 requirements verified |
| 2026-01-25 | Phase 7 Plan 01 executed | Migration (rates, holidays, counter, finalization) + TypeScript types |
| 2026-01-25 | Phase 7 Plan 02 executed | Calculations, schemas, constants, CSV export helpers |
| 2026-01-25 | Phase 7 Plan 03 executed | Rates settings page, holidays settings page, TanStack Query hooks |
| 2026-01-25 | Phase 7 Plan 04 executed | Invoice generation API + form page + useGenerateInvoice hook |
| 2026-01-25 | Phase 7 Plan 05 executed | Invoice list page, detail page, preview component, finalize API |
| 2026-01-25 | Phase 7 Plan 07 executed | PACE CSV export API + ExportCsvButton component |
| 2026-01-25 | Phase 7 Plan 06 executed | PDF export API + InvoicePDF component + Inter fonts |
| 2026-01-25 | Phase 7 complete | 7/7 plans executed, all invoicing features implemented |
| 2026-01-25 | Phase 8 Plan 01 executed | Auth layout, login page, protected layout with sidebar, role verification |
| 2026-01-25 | Phase 8 Plan 02 executed | Dashboard with budget hero, plan info, appointments card |
| 2026-01-25 | Phase 8 Plan 03 executed | Invoice list, preview modal, PDF download for participants |
| 2026-01-26 | Phase 8 Plan 04 executed | Profile page, sidebar with logout, human verification passed |
| 2026-01-26 | Phase 8 verified | 4/4 success criteria passed, VERIFICATION.md created |
| 2026-01-26 | Phase 8 complete | 4/4 plans executed, participant portal ready for production |
| 2026-01-26 | Phase 9 Plan 01 executed | Notification types, templates, fire-and-forget email helpers |
| 2026-01-26 | Phase 9 Plan 02 executed | Shift assignment and cancellation notifications wired to hooks |
| 2026-01-26 | Phase 9 Plan 03 executed | Invoice finalized notification wired to finalize route |
| 2026-01-26 | Phase 9 verified | 13/13 must-haves passed, VERIFICATION.md created |
| 2026-01-26 | Phase 9 complete | 3/3 plans executed, email notifications for shifts + invoices |
| 2026-01-26 | Phase 10 executed | 2/2 plans executed, NDIS validation + compliance widget |
| 2026-01-26 | Phase 11 executed | 7/7 plans: incidents, NDIA workflow, compliance dashboard, appointments, magic link, calendar |
| 2026-01-27 | Phase 12 Plan 01 executed | recharts/xlsx deps, ReportLayout, DateRangePicker, CSV export, /reports page |
| 2026-01-27 | Phase 12 Plan 02 executed | Budget report hook, BudgetBarChart, ChartCard, /reports/budget page |
| 2026-01-27 | Phase 12 Plan 04 executed | Worker hours + participant activity hooks, report pages with CSV export |
| 2026-01-27 | Phase 12 Plan 03 executed | Revenue report hook, RevenueLineChart, /reports/revenue page |
| 2026-01-27 | Phase 12 Plan 05 executed | Excel export helper, PDF report template, all 4 reports export-enabled |
| 2026-01-27 | Phase 12 Plan 06 executed | Xero/MYOB formatters, invoice/participant/worker-hours export APIs, accounting-exports page |
| 2026-01-27 | Phase 12 complete | 6/6 plans executed, all reporting and export features implemented |
| 2026-01-27 | Phase 12 verified | 29/29 must-haves passed, VERIFICATION.md created |
| 2026-01-27 | Phase 13 Plan 01 executed | Multi-org foundation: organizations table, platform admin, RLS policies |
| 2026-01-27 | Phase 13 Plan 02 executed | Organization registration: schema + API + form page |
| 2026-01-27 | Phase 13 Plan 03 executed | Integration settings: credentials migration + hooks + settings page |
| 2026-01-27 | Phase 13 Plan 04 executed | SMS infrastructure: Twilio SDK, sendSms function, templates, test endpoint |
| 2026-01-27 | Phase 13 Plan 04 executed | Twilio SMS: sendSms, templates, test endpoint |
| 2026-01-27 | Phase 13 Plan 05 executed | Shift reminders: sendShiftReminders, cron endpoint, pg_cron migration |
| 2026-01-27 | Phase 13 Plan 06 executed | Xero OAuth2: connect, callback, disconnect endpoints, client factory with token refresh |
| 2026-01-27 | Phase 13 Plan 12 executed | NDIA PACE CSV: CSV generation library, download API, export UI, page |
