# Requirements: Ephraim Care NDIS Platform

**Defined:** 2026-01-24
**Core Value:** Ephraim Care can schedule shifts, track worker check-ins, and generate accurate invoices from actual hours worked.

## v1 Requirements

### Authentication (AUTH)

- [ ] **AUTH-01**: Admin can log in with email and password
- [ ] **AUTH-02**: Admin can reset password via email link
- [ ] **AUTH-03**: Session auto-logout after 8 hours of inactivity
- [ ] **AUTH-04**: Worker can log in with email and password (mobile-optimized)
- [ ] **AUTH-05**: Participant can log in with email and password
- [ ] **AUTH-06**: Role-based access control enforces 4 distinct roles (Admin, Coordinator, Worker, Participant)
- [ ] **AUTH-07**: RLS prevents cross-organization data access
- [ ] **AUTH-08**: Failed login shows clear error messages

### Participant Management (PART)

- [x] **PART-01**: Admin can view list of all participants with search by name/NDIS number and filter by status
- [x] **PART-02**: Admin can create participant using multi-step form (basic info, plan details, contacts, support needs)
- [x] **PART-03**: Admin can view participant detail page with personal info, NDIS plan, contacts, support needs, quick stats
- [x] **PART-04**: Admin can edit participant details (except NDIS number and plan dates which are read-only)
- [x] **PART-05**: Admin can archive participant (soft delete -- data preserved, hidden from active list)
- [x] **PART-06**: Participant record shows budget used percentage (calculated from invoiced amounts)
- [x] **PART-07**: Participant record shows days until plan ends
- [x] **PART-08**: Form validation enforces required fields, date logic, and format checks
- [x] **PART-09**: NDIS number is unique and validated (6-7 digits format)

### Worker Management (WORK)

- [x] **WORK-01**: Admin can view list of all workers with search by name/email and filter by status
- [x] **WORK-02**: Admin can create new worker with name, contact, support types, qualifications, compliance dates
- [x] **WORK-03**: Admin can view worker detail page with scheduling stats (hours this month/week, next shift)
- [x] **WORK-04**: Admin can edit worker details (except email which is primary key)
- [x] **WORK-05**: New worker receives welcome email with login credentials
- [x] **WORK-06**: Worker profile stores support types, certifications, years of experience
- [x] **WORK-07**: Worker profile stores NDIS Worker Check number and expiry date
- [x] **WORK-08**: Worker profile stores Working with Children Check expiry date

### Worker Screening (SCRN)

- [ ] **SCRN-01**: System blocks assigning worker with expired NDIS check to new shifts (hard error)
- [ ] **SCRN-02**: System warns if worker NDIS check expires within 90 days (yellow warning, allows override)
- [ ] **SCRN-03**: Admin dashboard widget shows workers with expired or expiring checks

### Shift Scheduling (SHFT)

- [x] **SHFT-01**: Admin can create shift with participant, worker, date, start/end time, support type, and notes
- [x] **SHFT-02**: Admin can edit shift details (time, worker, notes, status) if shift is not completed
- [x] **SHFT-03**: Admin can cancel shift with reason (shift preserved in database, status = cancelled)
- [x] **SHFT-04**: Shift list view shows shifts grouped by day with status color coding
- [x] **SHFT-05**: System warns on overlapping worker shifts (allows creation with admin override)
- [x] **SHFT-06**: System warns when scheduling outside participant plan dates (allows with override)
- [x] **SHFT-07**: System validates worker support types match shift support type
- [x] **SHFT-08**: Shift statuses: pending, proposed, confirmed, in_progress, completed, cancelled
- [x] **SHFT-09**: Filter shifts by participant, worker, status, or date range

### Worker Mobile App (MOBL)

- [x] **MOBL-01**: Worker sees today's shifts on home screen ordered by time
- [x] **MOBL-02**: Worker can check in with GPS location capture and timestamp recording
- [x] **MOBL-03**: Worker sees live timer with elapsed time during active shift
- [x] **MOBL-04**: Worker can check out with automatic duration calculation
- [x] **MOBL-05**: Worker prompted to add case note after check-out (skip or add now)
- [x] **MOBL-06**: Worker can view weekly schedule with shift details
- [x] **MOBL-07**: Worker sees special instructions and medical alerts before check-in
- [x] **MOBL-08**: App persists login session between app closes (Expo SecureStore)
- [x] **MOBL-09**: App caches today's and upcoming shifts for offline viewing
- [x] **MOBL-10**: System auto-checks out worker 30 minutes after scheduled end time
- [x] **MOBL-11**: Admin can manually override/set check-out time for any shift
- [x] **MOBL-12**: Bottom navigation tabs: Home, Schedule, My Notes, Profile

### Case Notes (NOTE)

- [x] **NOTE-01**: Worker can create case note linked to shift with required text (min 10 chars) and optional concerns
- [x] **NOTE-02**: Admin can view all case notes for a participant with timestamp and worker name
- [x] **NOTE-03**: Admin can filter case notes by date range and worker
- [x] **NOTE-04**: Case note automatically records shift duration, worker, participant, and timestamps
- [x] **NOTE-05**: Case notes are not visible to participants in their portal
- [x] **NOTE-06**: Worker cannot see other workers' case notes

### Invoicing (INVC)

- [x] **INVC-01**: Admin can generate invoice for a participant within a specified date range
- [x] **INVC-02**: Invoice calculates billable hours as lesser of scheduled duration vs actual check-in/out duration
- [x] **INVC-03**: Invoice uses exact minutes for billing (no rounding applied)
- [x] **INVC-04**: Invoice multiplies billable hours by the configured rate for each support type
- [x] **INVC-05**: Invoice displays line items with date, service type, hours, rate, and line total
- [x] **INVC-06**: Invoice calculates GST at 10% on subtotal
- [x] **INVC-07**: Invoice receives unique sequential number in INV-YYYY-NNN format
- [x] **INVC-08**: Admin can approve/finalize invoice (status: draft to final)
- [x] **INVC-09**: Finalized invoices cannot be edited (locked)
- [x] **INVC-10**: Admin can configure support type hourly rates in settings page
- [x] **INVC-11**: Invoice exportable as PDF with Ephraim Care branding (logo, ABN, colors)
- [x] **INVC-12**: System generates NDIS Bulk Payment CSV in PACE-compliant format

### Participant Portal (PTPL)

- [ ] **PTPL-01**: Participant sees dashboard with plan period, days remaining, and budget status
- [ ] **PTPL-02**: Participant sees budget utilization progress bar with used/remaining amounts
- [ ] **PTPL-03**: Participant can download finalized invoices as PDF
- [ ] **PTPL-04**: Participant cannot access other participants' data (RLS enforced)
- [ ] **PTPL-05**: Portal is read-only (no edit or request capabilities in v1)

### Notifications (NOTF)

- [ ] **NOTF-01**: Worker receives email when assigned a new shift
- [ ] **NOTF-02**: Worker receives email when their shift is cancelled
- [ ] **NOTF-03**: Participant receives email when an invoice is finalized

### Foundation & Infrastructure (INFR)

- [ ] **INFR-01**: Monorepo structure with Turborepo + pnpm (apps/admin, apps/participant, apps/worker-mobile, packages/shared)
- [ ] **INFR-02**: SQL migrations tracked in Git and repeatable from scratch
- [ ] **INFR-03**: Supabase RLS policies enforce organization-level data isolation on all tables
- [ ] **INFR-04**: Error log table in Supabase captures failed operations with user context and timestamps
- [ ] **INFR-05**: Seed data script creates 5 participants, 5 workers, 20 shifts, 2 invoices for testing
- [ ] **INFR-06**: Full automated test coverage (unit tests, integration tests, E2E tests)
- [ ] **INFR-07**: Dev and Prod Supabase environments with separate credentials
- [ ] **INFR-08**: "Powered by OpBros" footer with link to opbros.online on all web portals
- [ ] **INFR-09**: Ephraim Care branding applied (green #66BB6A, teal #00BFA5, Montserrat headings, Inter body, 8px radius)

## v2 Requirements

### Incident Management (INCD)

- **INCD-01**: Worker or Admin can report incident with type, severity, description, and actions taken
- **INCD-02**: Incident tracks lifecycle (open to in_review to closed)
- **INCD-03**: System highlights incidents requiring NDIA reporting within 24 hours
- **INCD-04**: Coordinator can mark incident as reported to NDIA with reference number
- **INCD-05**: Incident list with filters by severity, status, type

### Compliance Dashboard (COMP)

- **COMP-01**: Dashboard shows overall compliance health score (percentage)
- **COMP-02**: Dashboard shows status for participants, workers, incidents, documentation
- **COMP-03**: Compliance report exportable as PDF

### Participant Portal Extensions (PTPL)

- **PTPL-06**: Participant sees upcoming appointments with worker name and time
- **PTPL-07**: Participant can request shift cancellations (admin receives and approves/rejects)

### Auth Extensions (AUTH)

- **AUTH-09**: Participant can use magic link via email to log in

### Shift Extensions (SHFT)

- **SHFT-10**: Calendar view for shifts (day, week, month views)
- **SHFT-11**: Recurring shift creation ("repeat weekly for N weeks")

## v3 Requirements

### Reporting (REPT)

- **REPT-01**: Budget utilization report with participant breakdown and alerts
- **REPT-02**: Revenue report with monthly trends and support type breakdown
- **REPT-03**: Worker hours report with per-worker stats and averages
- **REPT-04**: Participant activity report with shift history and budget projections
- **REPT-05**: All reports filterable by date range, participant, worker, support type
- **REPT-06**: All reports exportable as CSV and Excel
- **REPT-07**: All reports exportable as PDF
- **REPT-08**: Charts and data visualization (budget bars, revenue trends, hours distribution)

### Data Export (EXPRT)

- **EXPRT-01**: Export invoices to CSV for accounting software import (Xero/MYOB compatible)
- **EXPRT-02**: Export participant list to CSV
- **EXPRT-03**: Export worker hours to CSV

## v4 Requirements (Future/Optional)

### Scale Features

- **SCALE-01**: Multi-organization support (multiple NDIS providers on one platform)
- **SCALE-02**: SMS reminders for upcoming shifts (worker and participant)
- **SCALE-03**: Participant goal tracking with progress notes
- **SCALE-04**: NDIA API integration for direct claims submission
- **SCALE-05**: Xero API integration for automated accounting sync
- **SCALE-06**: Biometric login (fingerprint/face) for worker mobile app
- **SCALE-07**: Advanced offline support (offline check-in/out, photo attachments)
- **SCALE-08**: Bulk shift creation ("schedule 3x per week for a month")

## Out of Scope

| Feature | Reason |
|---------|--------|
| Payment processing (Stripe/PayPal) | Invoices generated but payment collected externally via NDIS/plan managers |
| Video conferencing | Not relevant to care delivery workflow |
| Real-time chat | Complexity not justified; existing phone/email sufficient |
| OAuth login (Google/GitHub) | Email/password sufficient for NDIS context; adds security surface |
| Custom branding per org | Single-tenant for Ephraim Care only in v1-v3 |
| Travel time tracking | Not billed by Ephraim Care; adds complexity without value |
| Payroll processing | Out of scope; workers paid separately |
| Allied health tools | Ephraim Care provides support work, not clinical services |
| AI rostering/optimization | Overkill for <20 participants; manual scheduling sufficient |
| Custom form builder | Fixed forms cover all NDIS requirements |
| App Store submission | Expo Go distribution sufficient for testing/early use |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1: Foundation | Pending |
| AUTH-02 | Phase 1: Foundation | Pending |
| AUTH-03 | Phase 1: Foundation | Pending |
| AUTH-04 | Phase 3: Worker Management | Pending |
| AUTH-05 | Phase 5: Worker Mobile App | Pending |
| AUTH-06 | Phase 1: Foundation | Pending |
| AUTH-07 | Phase 1: Foundation | Pending |
| AUTH-08 | Phase 1: Foundation | Pending |
| AUTH-09 | Phase 11: Compliance and Incidents | Pending |
| PART-01 | Phase 2: Participant Management | Complete |
| PART-02 | Phase 2: Participant Management | Complete |
| PART-03 | Phase 2: Participant Management | Complete |
| PART-04 | Phase 2: Participant Management | Complete |
| PART-05 | Phase 2: Participant Management | Complete |
| PART-06 | Phase 2: Participant Management | Complete |
| PART-07 | Phase 2: Participant Management | Complete |
| PART-08 | Phase 2: Participant Management | Complete |
| PART-09 | Phase 2: Participant Management | Complete |
| WORK-01 | Phase 3: Worker Management | Complete |
| WORK-02 | Phase 3: Worker Management | Complete |
| WORK-03 | Phase 3: Worker Management | Complete |
| WORK-04 | Phase 3: Worker Management | Complete |
| WORK-05 | Phase 3: Worker Management | Complete |
| WORK-06 | Phase 3: Worker Management | Complete |
| WORK-07 | Phase 3: Worker Management | Complete |
| WORK-08 | Phase 3: Worker Management | Complete |
| SCRN-01 | Phase 10: Worker Screening | Pending |
| SCRN-02 | Phase 10: Worker Screening | Pending |
| SCRN-03 | Phase 10: Worker Screening | Pending |
| SHFT-01 | Phase 4: Shift Scheduling | Complete |
| SHFT-02 | Phase 4: Shift Scheduling | Complete |
| SHFT-03 | Phase 4: Shift Scheduling | Complete |
| SHFT-04 | Phase 4: Shift Scheduling | Complete |
| SHFT-05 | Phase 4: Shift Scheduling | Complete |
| SHFT-06 | Phase 4: Shift Scheduling | Complete |
| SHFT-07 | Phase 4: Shift Scheduling | Complete |
| SHFT-08 | Phase 4: Shift Scheduling | Complete |
| SHFT-09 | Phase 4: Shift Scheduling | Complete |
| SHFT-10 | Phase 11: Compliance and Incidents | Pending |
| SHFT-11 | Phase 11: Compliance and Incidents | Pending |
| MOBL-01 | Phase 5: Worker Mobile App | Complete |
| MOBL-02 | Phase 5: Worker Mobile App | Complete |
| MOBL-03 | Phase 5: Worker Mobile App | Complete |
| MOBL-04 | Phase 5: Worker Mobile App | Complete |
| MOBL-05 | Phase 5: Worker Mobile App | Complete |
| MOBL-06 | Phase 5: Worker Mobile App | Complete |
| MOBL-07 | Phase 5: Worker Mobile App | Complete |
| MOBL-08 | Phase 5: Worker Mobile App | Complete |
| MOBL-09 | Phase 5: Worker Mobile App | Complete |
| MOBL-10 | Phase 5: Worker Mobile App | Complete |
| MOBL-11 | Phase 5: Worker Mobile App | Complete |
| MOBL-12 | Phase 5: Worker Mobile App | Complete |
| NOTE-01 | Phase 6: Case Notes | Complete |
| NOTE-02 | Phase 6: Case Notes | Complete |
| NOTE-03 | Phase 6: Case Notes | Complete |
| NOTE-04 | Phase 6: Case Notes | Complete |
| NOTE-05 | Phase 6: Case Notes | Complete |
| NOTE-06 | Phase 6: Case Notes | Complete |
| INVC-01 | Phase 7: Invoicing | Pending |
| INVC-02 | Phase 7: Invoicing | Pending |
| INVC-03 | Phase 7: Invoicing | Pending |
| INVC-04 | Phase 7: Invoicing | Pending |
| INVC-05 | Phase 7: Invoicing | Pending |
| INVC-06 | Phase 7: Invoicing | Pending |
| INVC-07 | Phase 7: Invoicing | Pending |
| INVC-08 | Phase 7: Invoicing | Pending |
| INVC-09 | Phase 7: Invoicing | Pending |
| INVC-10 | Phase 7: Invoicing | Pending |
| INVC-11 | Phase 7: Invoicing | Pending |
| INVC-12 | Phase 7: Invoicing | Pending |
| PTPL-01 | Phase 8: Participant Portal | Pending |
| PTPL-02 | Phase 8: Participant Portal | Pending |
| PTPL-03 | Phase 8: Participant Portal | Pending |
| PTPL-04 | Phase 8: Participant Portal | Pending |
| PTPL-05 | Phase 8: Participant Portal | Pending |
| PTPL-06 | Phase 11: Compliance and Incidents | Pending |
| PTPL-07 | Phase 11: Compliance and Incidents | Pending |
| NOTF-01 | Phase 9: Notifications | Pending |
| NOTF-02 | Phase 9: Notifications | Pending |
| NOTF-03 | Phase 9: Notifications | Pending |
| INFR-01 | Phase 1: Foundation | Pending |
| INFR-02 | Phase 1: Foundation | Pending |
| INFR-03 | Phase 1: Foundation | Pending |
| INFR-04 | Phase 1: Foundation | Pending |
| INFR-05 | Phase 1: Foundation | Pending |
| INFR-06 | Phase 1: Foundation | Pending |
| INFR-07 | Phase 1: Foundation | Pending |
| INFR-08 | Phase 1: Foundation | Pending |
| INFR-09 | Phase 1: Foundation | Pending |
| INCD-01 | Phase 11: Compliance and Incidents | Pending |
| INCD-02 | Phase 11: Compliance and Incidents | Pending |
| INCD-03 | Phase 11: Compliance and Incidents | Pending |
| INCD-04 | Phase 11: Compliance and Incidents | Pending |
| INCD-05 | Phase 11: Compliance and Incidents | Pending |
| COMP-01 | Phase 11: Compliance and Incidents | Pending |
| COMP-02 | Phase 11: Compliance and Incidents | Pending |
| COMP-03 | Phase 11: Compliance and Incidents | Pending |
| REPT-01 | Phase 12: Reporting and Export | Pending |
| REPT-02 | Phase 12: Reporting and Export | Pending |
| REPT-03 | Phase 12: Reporting and Export | Pending |
| REPT-04 | Phase 12: Reporting and Export | Pending |
| REPT-05 | Phase 12: Reporting and Export | Pending |
| REPT-06 | Phase 12: Reporting and Export | Pending |
| REPT-07 | Phase 12: Reporting and Export | Pending |
| REPT-08 | Phase 12: Reporting and Export | Pending |
| EXPRT-01 | Phase 12: Reporting and Export | Pending |
| EXPRT-02 | Phase 12: Reporting and Export | Pending |
| EXPRT-03 | Phase 12: Reporting and Export | Pending |
| SCALE-01 | Phase 13: Scale Features | Pending |
| SCALE-02 | Phase 13: Scale Features | Pending |
| SCALE-03 | Phase 13: Scale Features | Pending |
| SCALE-04 | Phase 13: Scale Features | Pending |
| SCALE-05 | Phase 13: Scale Features | Pending |
| SCALE-06 | Phase 13: Scale Features | Pending |
| SCALE-07 | Phase 13: Scale Features | Pending |
| SCALE-08 | Phase 13: Scale Features | Pending |

**Coverage:**
- v1 requirements: 77/77 mapped
- v2 requirements: 12/12 mapped
- v3 requirements: 11/11 mapped
- v4 requirements: 8/8 mapped
- Total: 108/108 requirements mapped
- Unmapped: 0

---
*Requirements defined: 2026-01-24*
*Last updated: 2026-01-24 after roadmap creation (traceability updated with 13-phase structure)*
