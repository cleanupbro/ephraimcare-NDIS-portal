# Project Research Summary

**Project:** Ephraim Care Portal (NDIS Management Platform)
**Domain:** Healthcare SaaS - Australian NDIS Provider Management
**Researched:** 2026-01-24
**Confidence:** HIGH

## Executive Summary

The Ephraim Care Portal is an NDIS management platform for small-to-medium Australian disability service providers. Research reveals this is a **compliance-heavy, mobile-first, offline-capable care management system** where the mobile worker experience is paramount, but regulatory requirements drive architectural decisions. The domain is well-understood with established competitive platforms (ShiftCare, SupportAbility) that validate the feature set, but these incumbents over-serve small providers ($180-500+/month for <20 participants).

The recommended approach is a **Turborepo monorepo with Next.js 15.5 (2 web apps) + Expo SDK 53 (worker mobile) + Supabase** backend. This stack provides the necessary compliance infrastructure (PostgreSQL with RLS for audit trails, Edge Functions for background jobs, Storage for NDIS documents) while keeping infrastructure costs under $100/month. The architecture follows a **mobile-first worker app with offline-sync capabilities**, dual web portals (admin + participant), and rigorous RLS policies to satisfy Australian Privacy Principles and NDIS Quality and Safeguards Commission requirements.

The **critical risks** center on: (1) **RLS policy performance degradation** at scale - complex role-based policies can cause 2-3 second query times if not indexed properly, (2) **offline sync conflict resolution** - healthcare data conflicts between worker check-ins and admin cancellations require explicit resolution rules, not "last write wins", and (3) **Australian timezone/DST billing errors** - NDIS billing across DST boundaries requires UTC storage with timezone-aware duration calculations to avoid invoice discrepancies. All three are addressable in Phase 1 (Foundation) through proper database design, indexing strategy, and timezone conventions.

## Key Findings

### Recommended Stack

The stack research reveals a **mature, production-tested monorepo architecture** specifically suited to multi-platform NDIS applications. The chosen technologies balance stability (Next.js 15.5 over bleeding-edge 16.x, Expo SDK 53 over beta SDK 54) with modern capabilities (App Router, Turbopack, React Native New Architecture).

**Core technologies:**
- **Turborepo + pnpm**: Monorepo orchestration with incremental builds and remote caching. Proven pattern for Next.js + Expo codebases. Native Vercel integration for deployment.
- **Next.js 15.5 (App Router)**: Web framework for admin and participant portals. Server Components, Server Actions, and typed routes. Maintenance LTS preferred over 16.x (released Dec 2025, too new for healthcare).
- **Expo SDK 53 (React Native 0.79)**: Mobile framework with Expo Router for worker app. New Architecture enabled by default. SDK 54 avoided due to known build issues.
- **Supabase**: Backend providing PostgreSQL with RLS (mandatory for NDIS compliance), Auth with role-based JWT claims, Realtime for shift notifications, Edge Functions for background jobs (invoice generation, NDIS price sync), and Storage for case note attachments and documents.
- **TanStack Query + Zustand**: Server state (TanStack Query for caching NDIS data) and client state (Zustand for UI state) across all apps. Same mental model web and mobile.
- **shadcn/ui + Tailwind CSS**: Web UI components copied into source (full control, accessible by default via Radix primitives, WCAG 2.1 AA compliance built-in).
- **expo-sqlite + expo-secure-store**: Offline storage for worker app. SQLite for shift cache and draft case notes, secure-store for auth tokens. Avoids AsyncStorage 6MB limit.

**Key stack decisions:**
- **No ORM** (Prisma/Drizzle) - Supabase RLS requires direct supabase-js client. ORMs bypass RLS policies, creating compliance gaps.
- **No NextAuth** - Supabase Auth handles email/password, magic link, and JWT with custom claims for role-based access.
- **React Hook Form + Zod** - NDIS forms can have 50+ fields (service agreements, risk assessments). Uncontrolled inputs + runtime validation.
- **@react-pdf/renderer** - PDF generation for invoices, service agreements, and progress notes. Runs in API routes and Edge Functions. Puppeteer avoided (50MB+ binary exceeds serverless limits).

### Expected Features

Feature research identifies **44 table-stakes features** and **17 competitive differentiators**. The competitive landscape shows over-serviced incumbents with 80% of features unused by small providers, creating an opportunity for lean, focused functionality.

**Must have (table stakes):**
- Participant management (NDIS number, plan details, service agreements, documents)
- Worker management with mandatory screening check tracking (number, expiry, auto-deactivation)
- Shift scheduling with conflict detection and recurring shift templates
- Worker mobile check-in/check-out with GPS verification (200m radius)
- Case notes (mandatory for NDIS claims) with templates and attachments
- Incident reporting (6 NDIS categories, 24-hour notification deadline tracking)
- NDIS billing with Price Guide line items and Bulk Payment CSV generation
- Role-based access control (Admin, Coordinator, Worker, Participant)

**Should have (competitive):**
- Offline-capable mobile app with sync queue and conflict resolution
- Real-time budget visibility per participant (funds used vs remaining)
- Participant portal for viewing shifts, case notes (filtered), invoices, and budget status
- Automated compliance engine (dashboard showing gaps, auto-block expired screenings)
- Smart scheduling (travel time consideration, worker-participant preference matching)
- In-app messaging between coordinators and workers

**Defer (v2+):**
- Plan management module (separate business line with distinct compliance)
- Allied health/therapy tools (different user type, over-specialization)
- Multi-funding streams (HCP, CHSP) - NDIS-only focus for MVP
- AI-powered auto-rostering (needs large datasets; manual with suggestions sufficient for <20 participants)
- Full payroll processing (export to Xero/MYOB instead)
- Video calling/telehealth (use Zoom/Teams)

**Feature dependencies critical path:**
1. User Auth + Roles (foundation)
2. Participant + Worker Management (core entities)
3. Shift Scheduling (operational workflow)
4. Check-in/Check-out (proof of delivery)
5. Case Notes (mandatory documentation)
6. Incident Reporting (regulatory requirement)
7. Invoicing + Bulk Payment CSV (revenue generation)

### Architecture Approach

The architecture is a **monorepo with 3 apps (admin web, participant web, worker mobile) sharing typed packages (types, supabase client, utils, UI) over a Supabase backend with PostgreSQL + RLS + Edge Functions**. The mobile app employs an offline-first architecture with local SQLite cache and sync queue, while web apps use Server Components and Server Actions for direct Supabase access.

**Major components:**

1. **Admin Portal (apps/admin)** - Next.js 15.5 App Router. Authenticated with Supabase Auth via HTTP-only cookies. Server Components for reads (shifts, participants, invoices), Server Actions for mutations (create shift, generate invoice). Role guard middleware (admin + coordinator only). Data tables with filters, calendar view for scheduling, invoice generator, compliance dashboard.

2. **Participant Portal (apps/participant)** - Next.js 15.5 with simplified, accessible UI (WCAG 2.1 AA). Magic link auth for ease of use. Read-only views of shifts, case notes (filtered for participant visibility), invoices with PDF download, and budget tracker. Mobile-responsive design.

3. **Worker Mobile App (apps/worker-mobile)** - Expo SDK 53 with Expo Router (file-based routing). Offline-first with expo-sqlite for shift cache and draft case notes. Sync queue with conflict resolution. GPS check-in verification (within 200m of participant address). Push notifications for shift assignments and changes. Voice-to-text case note entry. Expo Secure Store for auth tokens.

4. **Supabase Backend** - PostgreSQL 15+ with Row Level Security (RLS) policies for role-based data access. Auth with JWT custom claims (role field). Realtime subscriptions for shift updates and notifications. Edge Functions (Deno) for: invoice PDF generation, NDIS price guide sync (annual update), auto-checkout for overdue shifts, notification dispatch. Storage buckets (documents, photos, avatars, invoices) with RLS policies.

5. **Shared Packages** - `packages/types` (generated from Supabase schema + domain types), `packages/supabase` (client factories for browser/server/mobile), `packages/utils` (NDIS price calculations, date formatting for AU timezones, Zod validators), `packages/ui` (shadcn/ui components for web apps).

**Architecture patterns:**
- **RLS-first authorization** - All data access enforced at database row level, not application layer. Policies use helper functions (`is_admin_or_coordinator()`, `get_user_role()`) with indexed columns for performance.
- **Offline sync with outbox pattern** - Mobile writes to local SQLite immediately, adds to sync queue, pushes when online with conflict detection (version-based). Server returns 409 on conflicts with resolution UI.
- **Audit trail via triggers** - PostgreSQL triggers on shifts, invoices, case notes write to immutable `audit_log` table. Soft-delete pattern (`deleted_at` column) instead of hard delete.
- **Timezone-aware duration calculation** - All timestamps stored as UTC (`timestamptz`). Shifts have `iana_timezone` column. Duration calculated server-side in UTC to avoid DST billing errors.

### Critical Pitfalls

Research identified **23 pitfalls** ranging from critical (will break the system) to minor (will slow development). The top 5 require architectural decisions in Phase 1.

1. **Supabase RLS Policy Performance Degradation** - Complex multi-role policies with JOINs can execute 150+ policy checks per dashboard query, causing 2-3 second load times. **Prevention:** Use indexed `auth.uid()` lookups only, create materialized `user_roles` view, use `security definer` functions for complex multi-table queries instead of relying on RLS for every join, add `org_id` column with index to all tables. Benchmark with 10,000+ rows in Phase 1.

2. **Offline Sync Conflict Resolution** - Worker checks in while offline, admin cancels shift, naive "last write wins" either overwrites cancellation (compliance issue) or drops check-in (payroll issue). **Prevention:** Implement version-based conflict detection (`version` integer, incremented on write), define entity-specific resolution rules (shift cancellation ALWAYS wins over check-in, check-in preserved but flagged for review, case notes queued for manual merge), use outbox pattern with conflict checks, server returns HTTP 409 with both versions.

3. **Australian Timezone and DST Billing Errors** - Shifts scheduled across DST boundaries (April/October) interpreted incorrectly as 2-hour vs 3-hour based on local time. Different states observe DST differently (QLD doesn't). **Prevention:** Store ALL timestamps as UTC (`timestamptz`), store IANA timezone per shift (`Australia/Sydney`, `Australia/Brisbane`), calculate billable duration on SERVER in UTC (`actual_end_utc - actual_start_utc`), use `luxon` or `date-fns-tz` for timezone conversions, test DST transition dates explicitly.

4. **Supabase Service Role Key Exposure** - Service role key (bypasses ALL RLS) accidentally bundled in client JavaScript via `NEXT_PUBLIC_` prefix or imported in client component. **Prevention:** Create two Supabase client files (`supabase-browser.ts` with anon key, `supabase-admin.ts` with service key + `import "server-only"` guard), never prefix service key with `NEXT_PUBLIC_`, add pre-commit hook to grep for key in client paths, use `@supabase/ssr` createServerClient pattern for authenticated server operations (uses user JWT, not service key).

5. **NDIS Double-Billing Compliance Violation** - System allows overlapping shifts with warning but doesn't prevent billing same worker's time to two participants simultaneously. Under NDIS rules, this is fraud. **Prevention:** At invoice generation, query ALL shifts for same worker on same day, split billing to the minute if overlaps exist or reject and flag for coordinator review, add database constraint on `worker_id + time_range` overlaps, display overlap warnings at scheduling AND invoicing, add `overlap_resolution` field on shifts (`travel_time`, `group_support` ratio billing, `admin_approved_overlap`).

**Other serious pitfalls:**
- Missing audit trail for NDIS Commission audits (requires `audit_log` table + triggers in Phase 1)
- Worker screening check expiry enforcement (requires database constraint preventing shift assignment to expired workers)
- NDIS incident reporting deadline enforcement (24-hour notification deadline with escalation timer and dashboard countdown)
- NDIS Price Guide versioning (rates change annually July 1, need `rate_cards` table with `effective_from`/`effective_to`)

## Implications for Roadmap

Based on research, suggested phase structure prioritizes **compliance infrastructure first** (audit trail, RLS policies, timezone handling), then **core CRUD operations** (participants, workers, shifts), followed by **worker mobile app** (the primary differentiator), and finally **invoicing + participant portal**. Offline sync is implemented as a distinct phase AFTER online mobile app is validated.

### Phase 1: Foundation (Weeks 1-2)

**Rationale:** Compliance and architectural patterns must be established before ANY features are built. RLS policy performance, audit logging, timezone handling, and security patterns cannot be retrofitted without significant rework.

**Delivers:**
- Turborepo monorepo with pnpm workspaces configured
- Supabase projects (dev + prod) in Sydney region (`ap-southeast-2`)
- Complete database schema with all tables, indexes, RLS policies, triggers
- Auth configuration (email/password, magic link, JWT custom claims for roles)
- Shared packages scaffolded (`types`, `supabase`, `utils`, `ui`)
- Type generation from Supabase schema
- Service role key security patterns established (`server-only` imports)
- Audit trail table + triggers on all entities
- Timezone conventions documented (UTC storage, IANA timezone per shift)

**Addresses pitfalls:**
- #1 (RLS Performance) - indexed policies, `org_id` pattern
- #3 (Timezone/DST) - `timestamptz` + `iana_timezone` column design
- #4 (Service Key Exposure) - `supabase-browser.ts` vs `supabase-admin.ts` separation
- #6 (Audit Trail) - `audit_log` table created before any data writes

**Research flags:** No additional research needed - patterns are well-documented in Supabase and Next.js 15 documentation.

### Phase 2: Admin Portal - Core CRUD (Weeks 3-4)

**Rationale:** Admin must be able to create participants and workers before any shifts can be scheduled. Service agreements are contractual prerequisites to service delivery under NDIS rules.

**Delivers:**
- Next.js admin app with App Router structure
- Auth flow (login, middleware, session management)
- Dashboard layout (sidebar, header, role display)
- Participants CRUD (list with filters, create, edit, detail views)
- Workers CRUD with screening check tracking (number, state, expiry date, status)
- Service agreements (create, link to NDIS plan and participant)
- NDIS plan management (create plan, budget categories with allocated amounts)

**Addresses features:**
- Participant management (table stakes)
- Worker management + screening (table stakes + regulatory requirement)
- Service agreements (NDIS contractual requirement)

**Addresses pitfalls:**
- #11 (Worker Screening Expiry) - expiry date field with database constraint preventing shift assignment to expired workers

**Research flags:** No additional research needed - standard CRUD patterns with shadcn/ui components.

### Phase 3: Shift Scheduling (Weeks 5-6)

**Rationale:** Shift scheduling is the core operational workflow. Must validate worker availability, participant assignments, and timezone handling before building mobile check-in.

**Delivers:**
- Shift creation form (participant, worker, datetime, timezone)
- Calendar view (week/month with shift blocks)
- List view (filterable by participant, worker, status, date range)
- Shift detail page with status timeline
- Recurring shift templates (weekly schedule copy-forward)
- Conflict detection (worker double-booking) with warnings
- Timezone selection per shift (defaults to org timezone)

**Addresses features:**
- Shift scheduling with conflict detection (table stakes)
- Recurring shifts (table stakes - 80%+ of NDIS shifts are regular weekly)

**Addresses pitfalls:**
- #5 (Double-Billing) - overlap detection at scheduling time
- #3 (Timezone/DST) - timezone selection enforced, stored with shift

**Research flags:** No additional research needed - calendar libraries (FullCalendar, React Big Calendar) have established patterns.

### Phase 4: Worker Mobile - Core (Weeks 7-9)

**Rationale:** Worker mobile is the primary differentiator and most complex app component. Must work online first before adding offline capabilities. Check-in/check-out is proof of service delivery (mandatory for NDIS claims).

**Delivers:**
- Expo project with Expo Router (file-based navigation)
- Auth flow (login, secure token storage via expo-secure-store)
- Shift list (today + upcoming 7 days)
- Shift detail (participant info, address, map integration)
- Check-in with GPS verification (within 200m of participant address)
- Check-out with duration display
- Pull-to-refresh for shift data

**Addresses features:**
- Worker mobile check-in/check-out (table stakes)
- GPS location verification (table stakes for NDIS compliance)

**Addresses pitfalls:**
- #8 (Expo Go Limitations) - EAS Build setup from day one, test on physical devices

**Research flags:** GPS verification radius and error handling may need Phase 4 research (Expo Location API edge cases, permission handling iOS vs Android).

### Phase 5: Case Notes (Weeks 10-11)

**Rationale:** Case notes are mandatory for NDIS claims and must be completed after shift check-out. Building after Phase 4 ensures shift workflow is validated before adding documentation layer.

**Delivers:**
- Case note form on mobile (rich text, goals addressed, participant response)
- Photo attachments (camera capture + file picker, upload to Supabase Storage)
- Case note list on mobile (recent notes by worker)
- Case note list in admin (all notes, filterable by participant, worker, date)
- Case note detail in admin (view note + attachments)
- Draft support (save locally, submit when ready)
- Visibility levels (`shift_only`, `team`, `coordinator_only`, `restricted`)

**Addresses features:**
- Case notes with templates and attachments (table stakes)
- Participant-visible vs internal notes (table stakes for privacy)

**Addresses pitfalls:**
- #13 (Case Note Sensitivity) - visibility field with RLS enforcement

**Research flags:** No additional research needed - standard form + file upload patterns.

### Phase 6: Invoicing (Weeks 12-13)

**Rationale:** Invoice generation requires completed shifts and case notes. NDIS billing rules are complex (price guide lookup, duration calculation, GST handling) and must be validated before participant portal is built.

**Delivers:**
- Invoice generation (select participant + date range, auto-populate from shifts)
- Line item management (NDIS item number lookup from `ndis_price_guide` table)
- Invoice preview (PDF-style preview before finalizing)
- Invoice status workflow (draft → pending → submitted → paid)
- Budget tracking (update `plan_budgets.used_amount` on invoice submission)
- PDF export (@react-pdf/renderer in API route or Edge Function)
- Bulk Payment CSV generation (NDIS-compliant 16-column format)

**Addresses features:**
- NDIS billing with Price Guide compliance (table stakes)
- Bulk Payment CSV generation (PACE requirement, table stakes)
- Budget tracking (competitive differentiator)

**Addresses pitfalls:**
- #9 (NDIS Price Guide Versioning) - `rate_cards` table with `effective_from`/`effective_to`, lookup based on service date
- #15 (PDF Generation in Serverless) - @react-pdf in Edge Function with storage, or headless service
- #19 (GST Rounding) - monetary values as integer cents, GST calculation per line item then sum
- #5 (Double-Billing) - invoice generation validates worker time overlaps, splits or flags for review

**Research flags:** Phase 6 likely needs deeper research - NDIS Bulk Payment CSV format has strict validation rules (16 columns, date format, max 5000 rows, filename restrictions). PDF template design for NDIS invoices may need examples.

### Phase 7: Participant Portal (Weeks 14-15)

**Rationale:** Participant portal is read-only and depends on data created in earlier phases (shifts, case notes, invoices). Accessibility requirements are paramount (WCAG 2.1 AA minimum).

**Delivers:**
- Next.js participant app with accessible UI
- Magic link auth (no password to remember)
- Shift view (upcoming + past, read-only)
- Case notes view (filtered for participant visibility, no drafts)
- Invoice view (list + detail + PDF download)
- Plan overview (budget remaining per category, visual progress bars)
- Profile editing (update contact details)

**Addresses features:**
- Participant portal (competitive differentiator)
- Real-time budget visibility (competitive differentiator)

**Addresses pitfalls:**
- WCAG 2.1 AA compliance (regulatory requirement for NDIS platforms)

**Research flags:** No additional research needed - accessibility patterns well-documented (Radix UI primitives + shadcn/ui handle WCAG by default).

### Phase 8: Offline Support (Weeks 16-17)

**Rationale:** Offline support is built AFTER online mobile app is validated. Conflict resolution strategy must be designed before implementation (cannot be retrofitted).

**Delivers:**
- expo-sqlite setup (schema + migrations matching PostgreSQL entities)
- Shift caching (upcoming 7 days synced on app open + background)
- Offline check-in/check-out (write locally, queue for sync)
- Offline case notes (draft locally, sync when online)
- Sync engine (queue processor, retry logic with exponential backoff)
- Conflict resolution (version-based detection, entity-specific rules)
- Connectivity detection (NetInfo listener + offline indicator UI)
- Background sync (expo-background-fetch for periodic sync)

**Addresses features:**
- Offline-capable mobile app (competitive differentiator)

**Addresses pitfalls:**
- #2 (Offline Sync Conflict Resolution) - version-based detection, explicit resolution rules per entity type
- Expo SDK limitations (AsyncStorage 6MB limit avoided via SQLite)

**Research flags:** Phase 8 likely needs deeper research - conflict resolution patterns for healthcare data are domain-specific (worker safety vs data integrity tradeoffs).

### Phase 9: Notifications + Realtime (Weeks 18-19)

**Rationale:** Notifications require shift and invoice data to exist. Realtime subscriptions improve UX but are not critical for MVP validation.

**Delivers:**
- Supabase Edge Function for notification dispatch
- Expo Push setup (token registration, push API integration)
- Email notifications (Resend API for admin/coordinator alerts)
- Notification types (shift assigned/cancelled, invoice finalized, plan expiring, incident reported)
- Notification center in mobile app (list + mark as read)
- Realtime subscriptions (shift updates in admin calendar, worker shift changes)
- In-app notifications in admin portal (toast + badge for urgent items)

**Addresses features:**
- Push notifications (competitive differentiator)
- In-app messaging (competitive differentiator - deferred to v2 for full chat, Phase 9 for notifications only)

**Addresses pitfalls:**
- #10 (Incident Reporting Deadlines) - immediate push + email on incident creation, escalation timer if no action
- #16 (Supabase Realtime Connection Limits) - workers subscribe to own shifts only, admin uses polling for non-critical

**Research flags:** No additional research needed - Expo Push and Supabase Realtime patterns are well-documented.

### Phase 10: Reporting + Analytics (Week 20)

**Rationale:** Reporting is built after all transactional data exists. At <20 participants, basic reports are sufficient (not BI dashboards).

**Delivers:**
- Dashboard stats (total shifts, hours, revenue, active participants)
- Worker utilization reports (hours worked vs available)
- Budget reports per participant (budget status, utilization rate)
- NDIS compliance reports (service delivery summaries for audits)
- CSV/PDF export for all reports

**Addresses features:**
- Basic reporting (table stakes)
- Compliance dashboard (competitive differentiator - partially delivered in Phase 1, completed here)

**Research flags:** No additional research needed - standard reporting queries over PostgreSQL with CSV export.

### Phase Ordering Rationale

- **Foundation first** (Phase 1) because RLS performance, audit trails, and timezone handling cannot be retrofitted without significant schema changes and data migration.
- **Admin before mobile** (Phase 2 before Phase 4) because participants and workers must exist before shifts can be scheduled or viewed on mobile.
- **Scheduling before check-in** (Phase 3 before Phase 4) because shifts must be created before workers can check in.
- **Online before offline** (Phase 4 before Phase 8) because offline sync conflict resolution requires understanding the online data flow first. Testing offline-first from day one introduces too many variables.
- **Invoicing after case notes** (Phase 6 after Phase 5) because NDIS rules require case notes for billable claims, and invoice generation validates case note existence.
- **Participant portal after invoicing** (Phase 7 after Phase 6) because participants view invoices, and the portal is read-only (no data creation dependencies blocking earlier phases).
- **Notifications after core workflow** (Phase 9 after Phases 1-8) because notification triggers require shift, invoice, and incident data to exist.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 4 (Worker Mobile):** GPS verification edge cases (iOS vs Android permission handling, background location, geofencing API differences, error states when GPS unavailable).
- **Phase 6 (Invoicing):** NDIS Bulk Payment CSV format validation rules (16-column spec, date formats, max 5000 rows, filename constraints, PACE API rejection reasons), NDIS Price Guide integration patterns (annual update process, multiple rate types per item).
- **Phase 8 (Offline Sync):** Healthcare-specific conflict resolution patterns (worker safety priorities, data integrity vs operational continuity tradeoffs, manual merge UI patterns).

**Phases with standard patterns (skip research-phase):**
- **Phase 2 (Admin CRUD):** Standard CRUD with shadcn/ui, TanStack Query, and Server Actions. No novel patterns.
- **Phase 3 (Scheduling):** Calendar libraries (FullCalendar, React Big Calendar) have established shift scheduling patterns.
- **Phase 5 (Case Notes):** Standard form + file upload. Rich text editors (Tiptap, Slate) are well-documented.
- **Phase 7 (Participant Portal):** Read-only portal, WCAG patterns covered by Radix UI primitives.
- **Phase 9 (Notifications):** Expo Push and Supabase Realtime have comprehensive official docs.
- **Phase 10 (Reporting):** Standard SQL aggregation queries with CSV export.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | All technologies (Next.js 15, Expo SDK 53, Supabase) are production-tested with extensive community usage. Version choices prioritize stability over bleeding-edge. Turborepo + pnpm for monorepo is industry standard. No experimental dependencies. |
| Features | **HIGH** | Competitive landscape validates feature set. Four established platforms (ShiftCare, SupportAbility, Lumary, MYP) demonstrate table stakes and differentiators. NDIS regulatory requirements (incident reporting, worker screening, price guide compliance) are well-documented. Feature count (44 table stakes + 17 differentiators) is realistic for 20-week build. |
| Architecture | **HIGH** | Monorepo with 3 apps + shared packages is proven pattern. Supabase RLS for multi-tenant authorization is established approach. Offline-first mobile with SQLite sync is validated by production apps (Linear, Reflect). Server Components + Server Actions for Next.js 15 are mature (App Router stable since Next.js 13.4). Pitfall research includes performance benchmarks and indexing strategies. |
| Pitfalls | **HIGH** | Pitfall research identified 23 concrete failure modes with prevention strategies. Critical pitfalls (#1-6) are backed by community reports and official documentation. Australian timezone/DST edge cases are validated against NDIS billing rules. RLS performance patterns are documented in Supabase performance guides. Offline sync conflict resolution is informed by healthcare SaaS case studies. |

**Overall confidence:** **HIGH**

### Gaps to Address

**Australian NDIS regulatory specifics:** While NDIS Practice Standards and reportable incident categories are well-documented, some edge cases need validation during implementation:
- **Incident escalation workflows** - 24-hour notification deadline is clear, but escalation to backup coordinators and commission notification tracking workflows should be validated with NDIS Commission guidelines during Phase 10.
- **Worker screening check portability** - National portability of screening checks across states is documented, but integration with Worker Screening Unit APIs (if available) should be researched if automated verification is desired.
- **PACE bulk payment rejection codes** - NDIA's bulk payment CSV format is documented, but the specific rejection reasons and retry workflows should be validated against PACE system documentation during Phase 6.

**Offline sync conflict resolution in healthcare context:** While version-based conflict detection is a known pattern, the specific resolution rules for healthcare shifts (safety vs operational continuity) should be validated with domain experts or similar platforms (care management SaaS) during Phase 8 planning.

**iOS App Store review for healthcare apps:** Privacy manifest requirements and healthcare data handling explanations for App Store review are documented, but first submission timelines and rejection risk should be factored into Phase 4 (budget 2 weeks for review).

**GST calculation edge cases:** While integer-cents storage and per-line-item GST calculation are standard accounting patterns, NDIS-specific GST rules (most NDIS services are GST-free, but some support items may have GST) should be validated against ATO NDIS GST guidelines during Phase 6.

All gaps are low-risk (can be addressed during phase planning or implementation) and do not affect phase ordering or architecture decisions.

## Sources

### Primary (HIGH confidence)
- **Next.js 15 Documentation** - App Router, Server Components, Server Actions, middleware patterns, typed routes
- **Expo SDK 53 Documentation** - Expo Router, expo-sqlite, expo-location, expo-notifications, EAS Build
- **Supabase Documentation** - PostgreSQL + RLS, Auth with JWT, Realtime, Edge Functions, Storage, SSR helpers (@supabase/ssr)
- **NDIS Quality and Safeguards Commission** - Practice Standards, reportable incidents (6 categories, 24-hour deadline), worker screening requirements
- **NDIS Pricing Arrangements 2025-26** - Support Catalogue, Price Guide structure, bulk payment CSV format
- **Turborepo Documentation** - Monorepo pipelines, remote caching, workspace dependency graphs

### Secondary (MEDIUM confidence)
- **ShiftCare, SupportAbility, Lumary, MYP** - Competitive feature sets (validated baseline), pricing models, differentiators
- **Midday.ai** - @react-pdf/renderer PDF generation pattern in Next.js API routes (validated by production SaaS)
- **Supabase Community** - RLS performance patterns (indexed policies, security definer functions), auth session refresh handling
- **React Native / Expo Community** - Offline sync patterns (SQLite + queue), conflict resolution strategies, background sync limitations

### Tertiary (LOW confidence)
- **CareMaster Support Worker App** - Mobile worker UX patterns (validated competitor exists, but specific implementation details inferred)
- **NDIS Line Items Guide 2025-26** - Support item pricing edge cases (public holiday rates, travel time billing, group support ratios) - requires validation during Phase 6 against official NDIS Price Guide PDF

---
*Research completed: 2026-01-24*
*Ready for roadmap: yes*
