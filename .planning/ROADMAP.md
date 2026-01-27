# Roadmap: Ephraim Care NDIS Platform

## Overview

This roadmap delivers a complete NDIS management platform across 13 phases, from database foundation through scale features. The build order respects strict data dependencies: foundation infrastructure enables all features, participant/worker entities enable shifts, shifts enable mobile check-in, check-in data enables invoicing, and invoicing enables the participant portal. Each phase delivers a coherent, verifiable capability that unblocks the next.

**Created:** 2026-01-24
**Depth:** Comprehensive
**Phases:** 13
**Requirements:** 108 total (77 v1 + 12 v2 + 11 v3 + 8 v4)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3...): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation** - Database schema, RLS policies, audit trail, monorepo scaffold, and auth
- [x] **Phase 2: Participant Management** - CRUD for participants with NDIS plan info and budget tracking
- [x] **Phase 3: Worker Management** - CRUD for workers with qualifications and screening checks
- [x] **Phase 4: Shift Scheduling** - Create, edit, cancel shifts with conflict detection and validation
- [x] **Phase 5: Worker Mobile App** - Check-in/out with GPS, shift views, live timer, and offline cache
- [x] **Phase 6: Case Notes** - Worker creates notes post-shift, admin reviews with filters
- [x] **Phase 7: Invoicing** - Generate invoices from completed shifts with NDIS-compliant billing
- [x] **Phase 8: Participant Portal** - Read-only dashboard with plan status, budget, and invoice downloads
- [x] **Phase 9: Notifications** - Email notifications for shift assignments, cancellations, and invoices
- [x] **Phase 10: Worker Screening** - Block expired checks, warn on expiring, compliance dashboard widget
- [x] **Phase 11: Compliance and Incidents** - Incident reporting, compliance dashboard, portal extensions
- [x] **Phase 12: Reporting and Export** - Budget, revenue, worker hours, and activity reports with CSV/PDF export
- [x] **Phase 13: Scale Features** - Multi-org, SMS, goal tracking, API integrations, advanced mobile

## Phase Details

### Phase 1: Foundation

**Goal:** The monorepo, database, auth system, and compliance infrastructure exist so that all subsequent features build on secure, auditable, timezone-correct foundations.

**Depends on:** Nothing (first phase)

**Requirements:**
- INFR-01: Monorepo structure with Turborepo + pnpm (apps/admin, apps/participant, apps/worker-mobile, packages/shared)
- INFR-02: SQL migrations tracked in Git and repeatable from scratch
- INFR-03: Supabase RLS policies enforce organization-level data isolation on all tables
- INFR-04: Error log table in Supabase captures failed operations with user context and timestamps
- INFR-05: Seed data script creates 5 participants, 5 workers, 20 shifts, 2 invoices for testing
- INFR-06: Full automated test coverage (unit tests, integration tests, E2E tests)
- INFR-07: Dev and Prod Supabase environments with separate credentials
- INFR-08: "Powered by OpBros" footer with link to opbros.online on all web portals
- INFR-09: Ephraim Care branding applied (green #66BB6A, teal #00BFA5, Montserrat headings, Inter body, 8px radius)
- AUTH-01: Admin can log in with email and password
- AUTH-02: Admin can reset password via email link
- AUTH-03: Session auto-logout after 8 hours of inactivity
- AUTH-06: Role-based access control enforces 4 distinct roles (Admin, Coordinator, Worker, Participant)
- AUTH-07: RLS prevents cross-organization data access
- AUTH-08: Failed login shows clear error messages

**Success Criteria** (what must be TRUE):
1. Running `pnpm dev` from monorepo root starts all three apps without errors
2. Admin can log in to the admin portal and see a dashboard shell with their role displayed
3. A user with Worker role cannot access admin-only pages (receives access denied)
4. All database tables have RLS policies and audit trail triggers firing on insert/update/delete
5. Seed data script populates the database with test data that passes all constraint checks

**Plans:** 9 plans

Plans:
- [ ] 01-PLAN-01.md -- Monorepo scaffold (Turborepo + pnpm + 3 apps)
- [ ] 01-PLAN-02.md -- Shared packages (types, supabase, utils, ui, config)
- [ ] 01-PLAN-03.md -- Database schema migrations (15 migration files)
- [ ] 01-PLAN-04.md -- RLS policies and auth hook permissions
- [ ] 01-PLAN-05.md -- Auth system (login, reset password, RBAC, session timeout)
- [ ] 01-PLAN-06.md -- Seed data (5 participants, 5 workers, 20 shifts, 2 invoices)
- [ ] 01-PLAN-07.md -- Dashboard shell and branding (admin + participant portals)
- [ ] 01-PLAN-08.md -- Testing infrastructure (Vitest + Playwright + initial tests)
- [ ] 01-PLAN-09.md -- Integration verification and checkpoint

---

### Phase 2: Participant Management

**Goal:** Admin can create, view, edit, and archive participants with full NDIS plan details, so that shifts and invoices can reference valid participant records.

**Depends on:** Phase 1

**Requirements:**
- PART-01: Admin can view list of all participants with search by name/NDIS number and filter by status
- PART-02: Admin can create participant using multi-step form (basic info, plan details, contacts, support needs)
- PART-03: Admin can view participant detail page with personal info, NDIS plan, contacts, support needs, quick stats
- PART-04: Admin can edit participant details (except NDIS number and plan dates which are read-only)
- PART-05: Admin can archive participant (soft delete -- data preserved, hidden from active list)
- PART-06: Participant record shows budget used percentage (calculated from invoiced amounts)
- PART-07: Participant record shows days until plan ends
- PART-08: Form validation enforces required fields, date logic, and format checks
- PART-09: NDIS number is unique and validated (6-7 digits format)

**Success Criteria** (what must be TRUE):
1. Admin can create a new participant with all required fields and see them appear in the participant list
2. Admin can search participants by name or NDIS number and filter by active/archived status
3. Participant detail page shows plan end date countdown and budget utilization percentage
4. Attempting to create a participant with a duplicate NDIS number shows a validation error
5. Archived participants disappear from the active list but their data remains accessible via filter

**Plans:** 5 plans

Plans:
- [ ] 02-01-PLAN.md -- Dependencies, Zod schemas, and reusable DataTable component
- [ ] 02-02-PLAN.md -- Participant list page with search, filter, and sortable table
- [ ] 02-03-PLAN.md -- Multi-step create form (4 steps with validation + NDIS uniqueness)
- [ ] 02-04-PLAN.md -- Participant detail page with budget progress and plan countdown
- [ ] 02-05-PLAN.md -- Edit form (read-only fields) and archive dialog (type-to-confirm)

---

### Phase 3: Worker Management

**Goal:** Admin can create, view, and edit worker profiles with qualifications and compliance dates, so that workers can be assigned to shifts and log in to the mobile app.

**Depends on:** Phase 1

**Requirements:**
- WORK-01: Admin can view list of all workers with search by name/email and filter by status
- WORK-02: Admin can create new worker with name, contact, support types, qualifications, compliance dates
- WORK-03: Admin can view worker detail page with scheduling stats (hours this month/week, next shift)
- WORK-04: Admin can edit worker details (except email which is primary key)
- WORK-05: New worker receives welcome email with login credentials
- WORK-06: Worker profile stores support types, certifications, years of experience
- WORK-07: Worker profile stores NDIS Worker Check number and expiry date
- WORK-08: Worker profile stores Working with Children Check expiry date
- AUTH-04: Worker can log in with email and password (mobile-optimized)

**Success Criteria** (what must be TRUE):
1. Admin can create a worker with support types and compliance dates and see them in the worker list
2. Worker detail page shows hours worked this week/month and their next scheduled shift
3. Newly created worker receives a welcome email with their login credentials
4. Worker can log in with the credentials they received (verifiable via auth system)
5. Worker profile clearly displays NDIS check and WWCC expiry dates

**Plans:** 5 plans

Plans:
- [ ] 03-01-PLAN.md -- DB migration (compliance columns), Zod schemas, constants, domain types
- [ ] 03-02-PLAN.md -- Worker list page (DataTable, search, filter, compliance dot)
- [ ] 03-03-PLAN.md -- Worker create form and invite API route (auth + email)
- [ ] 03-04-PLAN.md -- Worker detail page (stats, compliance section, qualifications)
- [ ] 03-05-PLAN.md -- Worker edit form (read-only email) and resend invite

---

### Phase 4: Shift Scheduling

**Goal:** Admin can schedule shifts between participants and workers with conflict detection and validation, so that the operational calendar exists for workers to check in against.

**Depends on:** Phase 2, Phase 3

**Requirements:**
- SHFT-01: Admin can create shift with participant, worker, date, start/end time, support type, and notes
- SHFT-02: Admin can edit shift details (time, worker, notes, status) if shift is not completed
- SHFT-03: Admin can cancel shift with reason (shift preserved in database, status = cancelled)
- SHFT-04: Shift list view shows shifts grouped by day with status color coding
- SHFT-05: System warns on overlapping worker shifts (allows creation with admin override)
- SHFT-06: System warns when scheduling outside participant plan dates (allows with override)
- SHFT-07: System validates worker support types match shift support type
- SHFT-08: Shift statuses: pending, proposed, confirmed, in_progress, completed, cancelled
- SHFT-09: Filter shifts by participant, worker, status, or date range

**Success Criteria** (what must be TRUE):
1. Admin can create a shift for a participant-worker pair and see it appear in the shift list grouped by day
2. Creating a shift that overlaps with the same worker's existing shift shows a warning (but allows override)
3. System rejects shift creation when worker's support types do not match the shift's support type
4. Admin can cancel a shift with a reason and see its status change to cancelled (data preserved)
5. Shift list can be filtered by participant, worker, status, and date range simultaneously

**Plans:** 4 plans

Plans:
- [x] 04-01-PLAN.md -- DB migration (support_type column, enum values, overlap index), Zod schemas, constants
- [x] 04-02-PLAN.md -- Sheet UI component, shift list page (cards grouped by day, week navigation, useShifts hook)
- [x] 04-03-PLAN.md -- Create shift form (participant-first selection, duration presets, conflict detection dialogs)
- [x] 04-04-PLAN.md -- Shift filters, detail sheet (side panel), inline edit, cancel with reason

---

### Phase 5: Worker Mobile App

**Goal:** Workers can view their shifts, check in with GPS, see a live timer, check out, and access their schedule from a mobile app that persists sessions between opens.

**Depends on:** Phase 4

**Requirements:**
- MOBL-01: Worker sees today's shifts on home screen ordered by time
- MOBL-02: Worker can check in with GPS location capture and timestamp recording
- MOBL-03: Worker sees live timer with elapsed time during active shift
- MOBL-04: Worker can check out with automatic duration calculation
- MOBL-05: Worker prompted to add case note after check-out (skip or add now)
- MOBL-06: Worker can view weekly schedule with shift details
- MOBL-07: Worker sees special instructions and medical alerts before check-in
- MOBL-08: App persists login session between app closes (Expo SecureStore)
- MOBL-09: App caches today's and upcoming shifts for offline viewing
- MOBL-10: System auto-checks out worker 30 minutes after scheduled end time
- MOBL-11: Admin can manually override/set check-out time for any shift
- MOBL-12: Bottom navigation tabs: Home, Schedule, My Notes, Profile
- AUTH-05: Participant can log in with email and password

**Success Criteria** (what must be TRUE):
1. Worker opens the app and sees today's shifts listed in chronological order without needing to re-login
2. Worker can check in to a shift and sees GPS coordinates recorded plus a live elapsed timer
3. Worker can check out and sees the calculated duration displayed (actual hours and minutes)
4. Worker who forgets to check out is auto-checked-out 30 minutes after scheduled end time
5. Admin can override a worker's check-out time from the admin portal

**Plans:** 9 plans

Plans:
- [ ] 05-01-PLAN.md -- DB migration (shift_check_ins, push tokens, geo columns, RLS, pg_cron) + Supabase client setup
- [ ] 05-02-PLAN.md -- Auth system (SessionProvider, login screen, session persistence)
- [ ] 05-03-PLAN.md -- Core data hooks (useShifts, shiftStore, syncStore, proximity utility)
- [ ] 05-04-PLAN.md -- Home tab (today's shifts, ShiftCard, 4-tab bottom nav)
- [ ] 05-05-PLAN.md -- Shift detail + GPS check-in (proximity enforcement, medical alerts, offline fallback)
- [ ] 05-06-PLAN.md -- Live timer + check-out (AppState timer, duration calc, case note modal)
- [ ] 05-07-PLAN.md -- Weekly schedule calendar + profile/logout + notes placeholder
- [ ] 05-08-PLAN.md -- Admin override checkout API (POST /api/shifts/[id]/override-checkout)
- [ ] 05-09-PLAN.md -- Offline caching + push notifications + sync engine + offline indicator

---

### Phase 6: Case Notes

**Goal:** Workers can document care delivered after each shift, and admin can review all notes with filters -- providing the evidence trail required for NDIS claims.

**Depends on:** Phase 5

**Requirements:**
- NOTE-01: Worker can create case note linked to shift with required text (min 10 chars) and optional concerns
- NOTE-02: Admin can view all case notes for a participant with timestamp and worker name
- NOTE-03: Admin can filter case notes by date range and worker
- NOTE-04: Case note automatically records shift duration, worker, participant, and timestamps
- NOTE-05: Case notes are not visible to participants in their portal
- NOTE-06: Worker cannot see other workers' case notes

**Success Criteria** (what must be TRUE):
1. Worker is prompted to write a case note after checking out and can submit or skip
2. Admin can view all case notes for a specific participant with the worker name and timestamp shown
3. Admin can filter case notes by date range and by specific worker
4. A worker viewing the mobile app cannot see case notes written by other workers
5. Case notes are completely invisible in the participant portal (verified via RLS)

**Plans:** 4 plans

Plans:
- [ ] 06-01-PLAN.md -- DB migration (concern columns, admin comments table, RLS updates, notification trigger) + Zod schema
- [ ] 06-02-PLAN.md -- Mobile case note creation (CaseNoteModal wiring, useCreateCaseNote, syncStore extension)
- [ ] 06-03-PLAN.md -- Admin case notes tab (participant detail tabs, filters, review, private comments)
- [ ] 06-04-PLAN.md -- Mobile My Notes tab (pending shifts list, tab badge, edit within 24h)

---

### Phase 7: Invoicing

**Goal:** Admin can generate accurate invoices from completed shifts using the lesser-of-scheduled-vs-actual billing rule, with GST, PDF export, and NDIS bulk payment CSV generation.

**Depends on:** Phase 5, Phase 6

**Requirements:**
- INVC-01: Admin can generate invoice for a participant within a specified date range
- INVC-02: Invoice calculates billable hours as lesser of scheduled duration vs actual check-in/out duration
- INVC-03: Invoice uses exact minutes for billing (no rounding applied)
- INVC-04: Invoice multiplies billable hours by the configured rate for each support type
- INVC-05: Invoice displays line items with date, service type, hours, rate, and line total
- INVC-06: Invoice calculates GST at 10% on subtotal
- INVC-07: Invoice receives unique sequential number in INV-YYYY-NNN format
- INVC-08: Admin can approve/finalize invoice (status: draft to final)
- INVC-09: Finalized invoices cannot be edited (locked)
- INVC-10: Admin can configure support type hourly rates in settings page
- INVC-11: Invoice exportable as PDF with Ephraim Care branding (logo, ABN, colors)
- INVC-12: System generates NDIS Bulk Payment CSV in PACE-compliant format

**Success Criteria** (what must be TRUE):
1. Admin can select a participant and date range, generate an invoice, and see correct line items from completed shifts
2. Invoice billing uses the lesser of scheduled vs actual duration (verifiable by comparing a shift where actual was shorter)
3. Admin can finalize an invoice and it becomes locked (no edit button, no mutation possible)
4. Finalized invoice can be downloaded as a branded PDF with correct GST calculation
5. Admin can generate a PACE-compliant bulk payment CSV covering multiple invoices

**Plans:** 7 plans

Plans:
- [ ] 07-01-PLAN.md -- DB migration (new tables, schema additions, gapless counter, finalization trigger, RLS) + TypeScript types
- [ ] 07-02-PLAN.md -- Billing calculations, Zod schemas, constants, PACE CSV export function
- [ ] 07-03-PLAN.md -- Support type rates settings page + public holidays settings page
- [ ] 07-04-PLAN.md -- Invoice generation API route + generate form page + invoice hooks
- [ ] 07-05-PLAN.md -- Invoice list page + detail/preview page + finalize API + UI components
- [ ] 07-06-PLAN.md -- PDF export (@react-pdf/renderer, fonts, branded PDF component, API route)
- [ ] 07-07-PLAN.md -- PACE CSV export API route + ExportCsvButton component

---

### Phase 8: Participant Portal

**Goal:** Participants can log in to a read-only portal to view their plan status, budget utilization, upcoming appointments, and download finalized invoices.

**Depends on:** Phase 7

**Requirements:**
- PTPL-01: Participant sees dashboard with plan period, days remaining, and budget status
- PTPL-02: Participant sees budget utilization progress bar with used/remaining amounts
- PTPL-03: Participant can download finalized invoices as PDF
- PTPL-04: Participant cannot access other participants' data (RLS enforced)
- PTPL-05: Portal is read-only (no edit or request capabilities in v1)

**Success Criteria** (what must be TRUE):
1. Participant logs in and sees their plan period, days remaining, and budget progress bar on the dashboard
2. Participant can see a list of their finalized invoices and download any one as PDF
3. Participant cannot see any data belonging to other participants (verified via different login)
4. Portal has no edit, create, or delete actions available anywhere (purely read-only)

**Plans:** 4 plans

Plans:
- [ ] 08-01-PLAN.md -- Auth + layout setup (Supabase clients, login page, protected layout with participant role check, sidebar)
- [ ] 08-02-PLAN.md -- Dashboard page (budget hero, plan info card, upcoming appointments)
- [ ] 08-03-PLAN.md -- Invoices page (invoice list, preview modal, PDF route for participant access)
- [ ] 08-04-PLAN.md -- Profile page + verification checkpoint (read-only profile, logout, final verification)

---

### Phase 9: Notifications

**Goal:** Workers and participants receive timely email notifications for shift assignments, cancellations, and invoice finalizations -- keeping everyone informed without manual communication.

**Depends on:** Phase 4, Phase 7

**Requirements:**
- NOTF-01: Worker receives email when assigned a new shift
- NOTF-02: Worker receives email when their shift is cancelled
- NOTF-03: Participant receives email when an invoice is finalized

**Success Criteria** (what must be TRUE):
1. Creating a shift and assigning a worker triggers an email to that worker with shift details
2. Cancelling a shift triggers an email to the assigned worker with the cancellation reason
3. Finalizing an invoice triggers an email to the participant with a link to view it
4. Emails arrive within 60 seconds of the triggering action

**Plans:** 3 plans

Plans:
- [ ] 09-01-PLAN.md -- Notification infrastructure (send-email helper, HTML templates, types)
- [ ] 09-02-PLAN.md -- Shift notifications (assignment email, cancellation email, dialog update)
- [ ] 09-03-PLAN.md -- Invoice notification (finalize route triggers participant email)

---

### Phase 10: Worker Screening

**Goal:** The system actively enforces worker compliance by blocking shift assignment for expired screening checks and warning admin about upcoming expirations.

**Depends on:** Phase 3, Phase 4

**Requirements:**
- SCRN-01: System blocks assigning worker with expired NDIS check to new shifts (hard error)
- SCRN-02: System warns if worker NDIS check expires within 90 days (yellow warning, allows override)
- SCRN-03: Admin dashboard widget shows workers with expired or expiring checks

**Success Criteria** (what must be TRUE):
1. Attempting to assign a worker with an expired NDIS check to a shift fails with a clear error message
2. Assigning a worker whose check expires within 90 days shows a yellow warning but allows override
3. Admin dashboard displays a widget listing all workers with expired or soon-to-expire checks

**Plans:** 2 plans

Plans:
- [ ] 10-01-PLAN.md -- Shift form NDIS validation (blocking expired, warning expiring)
- [ ] 10-02-PLAN.md -- Dashboard compliance widget (workers with expired/expiring checks)

---

### Phase 11: Compliance and Incidents

**Goal:** Workers and admins can report incidents with severity tracking and NDIA notification deadlines, participants can view appointments and request cancellations, and a compliance health dashboard provides organizational oversight.

**Depends on:** Phase 4, Phase 7, Phase 10

**Requirements:**
- INCD-01: Worker or Admin can report incident with type, severity, description, and actions taken
- INCD-02: Incident tracks lifecycle (open to in_review to closed)
- INCD-03: System highlights incidents requiring NDIA reporting within 24 hours
- INCD-04: Coordinator can mark incident as reported to NDIA with reference number
- INCD-05: Incident list with filters by severity, status, type
- COMP-01: Dashboard shows overall compliance health score (percentage)
- COMP-02: Dashboard shows status for participants, workers, incidents, documentation
- COMP-03: Compliance report exportable as PDF
- PTPL-06: Participant sees upcoming appointments with worker name and time
- PTPL-07: Participant can request shift cancellations (admin receives and approves/rejects)
- AUTH-09: Participant can use magic link via email to log in
- SHFT-10: Calendar view for shifts (day, week, month views)
- SHFT-11: Recurring shift creation ("repeat weekly for N weeks")

**Success Criteria** (what must be TRUE):
1. Worker or admin can submit an incident report and it appears in the incident list with its severity
2. Incidents requiring NDIA reporting show a 24-hour countdown timer and visual urgency indicator
3. Compliance dashboard displays an overall health score based on worker checks, incidents, and documentation
4. Participant can view upcoming appointments and submit a cancellation request that admin can approve/reject
5. Admin can create a recurring shift that generates multiple shifts across weeks

**Plans:** TBD

---

### Phase 12: Reporting and Export

**Goal:** Admin can generate budget, revenue, worker hours, and participant activity reports with filtering and export to CSV, Excel, and PDF -- supporting accounting workflows and NDIS audits.

**Depends on:** Phase 7

**Requirements:**
- REPT-01: Budget utilization report with participant breakdown and alerts
- REPT-02: Revenue report with monthly trends and support type breakdown
- REPT-03: Worker hours report with per-worker stats and averages
- REPT-04: Participant activity report with shift history and budget projections
- REPT-05: All reports filterable by date range, participant, worker, support type
- REPT-06: All reports exportable as CSV and Excel
- REPT-07: All reports exportable as PDF
- REPT-08: Charts and data visualization (budget bars, revenue trends, hours distribution)
- EXPRT-01: Export invoices to CSV for accounting software import (Xero/MYOB compatible)
- EXPRT-02: Export participant list to CSV
- EXPRT-03: Export worker hours to CSV

**Success Criteria** (what must be TRUE):
1. Admin can generate a budget utilization report showing each participant's used vs remaining budget
2. Revenue report displays monthly trends with support type breakdown and totals
3. All reports can be filtered by date range and exported as CSV, Excel, or PDF
4. Exported invoice CSV is importable into Xero or MYOB without manual reformatting
5. Charts and data visualizations render correctly for budget bars and revenue trends

**Plans:** 6 plans

Plans:
- [ ] 12-01-PLAN.md -- Report foundation (dependencies, ReportLayout, DateRangePicker, CSV export helper)
- [ ] 12-02-PLAN.md -- Budget utilization report (bar chart, alerts, CSV export)
- [ ] 12-03-PLAN.md -- Revenue trends report (line chart, support type breakdown, CSV export)
- [ ] 12-04-PLAN.md -- Worker hours and participant activity reports (tabular data, CSV export)
- [ ] 12-05-PLAN.md -- Excel and PDF export for all reports (SheetJS, @react-pdf/renderer)
- [ ] 12-06-PLAN.md -- Accounting exports (Xero/MYOB CSV, participant list, worker hours)

---

### Phase 13: Scale Features

**Goal:** The platform supports multi-organization tenancy, SMS shift reminders, participant goal tracking, and direct integrations with NDIA and Xero APIs -- enabling Ephraim Care to grow and the platform to serve additional providers.

**Depends on:** Phase 12

**Requirements:**
- SCALE-01: Multi-organization support (multiple NDIS providers on one platform)
- SCALE-02: SMS reminders for upcoming shifts (worker and participant)
- SCALE-03: Participant goal tracking with progress notes
- SCALE-04: NDIA API integration for direct claims submission
- SCALE-05: Xero API integration for automated accounting sync
- SCALE-06: Biometric login (fingerprint/face) for worker mobile app
- SCALE-07: Advanced offline support (offline check-in/out, photo attachments)
- SCALE-08: Bulk shift creation ("schedule 3x per week for a month")

**Success Criteria** (what must be TRUE):
1. A second NDIS provider can be onboarded with their own data completely isolated from Ephraim Care
2. Workers and participants receive SMS reminders before upcoming shifts
3. Participants have goals with progress notes that admin and coordinators can track
4. Invoices can be submitted directly to NDIA via API without manual CSV upload
5. Invoice and payment data syncs automatically to Xero without manual export/import

**Plans:** 12 plans

Plans:
- [ ] 13-01-PLAN.md -- Multi-org schema + platform admin foundation (RLS, organizations table, platform_admin role)
- [ ] 13-02-PLAN.md -- Organization registration + onboarding flow (signup, Stripe checkout, provisioning)
- [ ] 13-03-PLAN.md -- Organization settings + API credentials (settings page, encrypted credential storage)
- [ ] 13-04-PLAN.md -- Twilio SMS infrastructure (service, delivery tracking, phone validation)
- [ ] 13-05-PLAN.md -- Shift SMS reminders (24h + 2h before shift, cron jobs)
- [ ] 13-06-PLAN.md -- Xero OAuth2 connection flow (connect, token refresh, disconnect)
- [ ] 13-07-PLAN.md -- Xero invoice sync on finalize (contact mapping, invoice push, error handling)
- [ ] 13-08-PLAN.md -- Participant goal tracking (goals table, progress notes, NDIS domains)
- [ ] 13-09-PLAN.md -- Mobile biometrics + PIN fallback (FaceID/TouchID, secure PIN storage)
- [ ] 13-10-PLAN.md -- Offline photo capture + sync (3 photos per shift, compression, auto-delete)
- [ ] 13-11-PLAN.md -- Bulk shift creation with preview (conflict detection, single notification)
- [ ] 13-12-PLAN.md -- NDIA CSV auto-generate + one-click download (PACE format, validation)

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11 -> 12 -> 13
Note: Phases 2 and 3 can execute in parallel (both depend only on Phase 1).

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 9/9 | Complete | 2026-01-24 |
| 2. Participant Management | 5/5 | Complete | 2026-01-24 |
| 3. Worker Management | 5/5 | Complete | 2026-01-24 |
| 4. Shift Scheduling | 4/4 | Complete | 2026-01-24 |
| 5. Worker Mobile App | 9/9 | Complete | 2026-01-25 |
| 6. Case Notes | 4/4 | Complete | 2026-01-25 |
| 7. Invoicing | 7/7 | Complete | 2026-01-25 |
| 8. Participant Portal | 4/4 | Complete | 2026-01-26 |
| 9. Notifications | 3/3 | Complete | 2026-01-26 |
| 10. Worker Screening | 2/2 | Complete | 2026-01-26 |
| 11. Compliance and Incidents | 7/7 | Complete | 2026-01-26 |
| 12. Reporting and Export | 6/6 | Complete | 2026-01-27 |
| 13. Scale Features | 12/12 | Complete | 2026-01-27 |

---
*Roadmap created: 2026-01-24*
*Phase 1 planned: 2026-01-24*
*Phase 7 planned: 2026-01-25*
*Phase 8 complete: 2026-01-26*
*Phase 9 complete: 2026-01-26*
*Phase 10 complete: 2026-01-26*
*Phase 11 complete: 2026-01-26*
*Phase 12 complete: 2026-01-27*
*Phase 13 complete: 2026-01-27*
*Milestone v1.0 complete: 2026-01-27*
