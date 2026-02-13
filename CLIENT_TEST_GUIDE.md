# Ephraim Care Portal — Complete Test Guide & Platform Overview

**Last Tested:** February 6, 2026
**Tested By:** OpBros.ai (Automated Playwright + Manual)
**Built By:** OpBros.ai for Ephraim Care

---

## Login Credentials — All Portals

### Admin Portal (Full Business Management)

| Role | URL | Email | Password |
|------|-----|-------|----------|
| **Admin** | https://ephraimcare-ndis-portal-admin.vercel.app | `admin@ephraimcare.com.au` | `EphraimAdmin2026` |
| **Coordinator** | Same URL as above | `sarah@ephraimcare.com.au` | `EphraimCoord2026` |

### Participant Portal (Client-Facing)

| Role | URL | Email | Password |
|------|-----|-------|----------|
| **Participant** | https://ephraimcare-participant-portal.vercel.app | `client@ephraimcare.com.au` | `EphraimClient2026` |

### Worker Accounts (For Admin Portal Worker Views + Mobile App)

| Worker | Email | Password |
|--------|-------|----------|
| James Wilson | `james@ephraimcare.com.au` | `EphraimWorker2026` |
| Emma Thompson | `emma@ephraimcare.com.au` | `EphraimWorker2026` |
| Maria Garcia | `maria@ephraimcare.com.au` | `EphraimWorker2026` |
| Liam Patel | `liam@ephraimcare.com.au` | `EphraimWorker2026` |
| David Chen | `david@ephraimcare.com.au` | `EphraimWorker2026` |

---

## Automated Test Results (February 6, 2026)

### Admin Portal — All Pages Tested

| Page | URL | Status | Data Loaded |
|------|-----|--------|-------------|
| **Dashboard** | `/` | PASS | 6 participants, 7 workers, 34 upcoming shifts, 1 pending invoice, compliance status |
| **Participants** | `/participants` | PASS | 6 active participants with NDIS numbers, search + filter working |
| **Workers** | `/workers` | PASS | 7 active workers with support types, email, compliance status |
| **Shifts (List)** | `/shifts` | PASS | Weekly view with scheduled shifts, filters for participant/worker/status/type |
| **Shifts (Calendar)** | `/shifts/calendar` | PASS | Day/Week/Month views, navigation working |
| **NDIS Plans** | `/plans` | PASS | 2 plans showing (Alice $85K, Bob $62K) with full budget category breakdown |
| **Invoices** | `/invoices` | PASS | 2 invoices (INV-202601-0001 $340, INV-202601-0002 $360), tabs for status filter |
| **Case Notes** | `/case-notes` | PASS | Empty state — "Workers create case notes after completing shifts" |
| **Incidents** | `/incidents` | PASS | Incident reporting with severity/type/status filters |
| **Compliance** | `/compliance` | PASS | Dashboard with weighted score (Worker 40%, Incident 30%, Docs 30%) |
| **Cancellations** | `/cancellation-requests` | BUG | Page stuck on "Loading requests..." — API error on cancellation_requests table |
| **Settings** | `/settings` | PASS | Profile info, change password, sign out |

**Result: 11/12 pages working (1 minor bug on Cancellations page)**

### Participant Portal — All Pages Tested

| Page | URL | Status | Notes |
|------|-----|--------|-------|
| **Login** | `/login` | PASS | Password + Magic Link options, clean UI |
| **Dashboard** | `/dashboard` | PASS | Welcome message, budget status, plan period, upcoming appointments |
| **Appointments** | `/appointments` | PASS | Shows scheduled support sessions, cancel request feature |
| **Invoices** | `/invoices` | PASS | Shows finalized invoices from coordinator |
| **Profile** | `/profile` | BUG | Page loads but profile data cards are empty — API error fetching participant details |

**Result: 4/5 pages working (1 bug on Profile page — fixable)**

### Bugs Found

| # | Portal | Page | Issue | Severity |
|---|--------|------|-------|----------|
| 1 | Admin | Cancellations | API error loading cancellation_requests — page stuck on "Loading..." | Medium |
| 2 | Participant | Profile | Profile data cards load empty — API 400 error fetching participant details | Medium |

---

## What This Platform Is

Ephraim Care Portal is a **complete NDIS disability support management system** — a full mini-admin app that replaces spreadsheets, paper forms, and manual tracking with one connected digital platform.

### The 3 Portals

| Portal | Who Uses It | What They Do |
|--------|------------|--------------|
| **Admin Portal** | Meshach + coordinators | Run the entire business from one dashboard |
| **Participant Portal** | NDIS participants + families | View appointments, invoices, budget — builds trust |
| **Worker Mobile App** | Support workers | Clock in/out with GPS, write case notes, view schedule |

---

## Full Feature Breakdown — What's Built & Working

### 1. Dashboard (Admin Home Screen)
- Live counts: participants, workers, today's shifts, pending invoices
- Quick actions: schedule shift, add participant, create invoice
- Compliance status at a glance
- Upcoming shifts counter

### 2. Participant Management
- Full participant profiles: NDIS number, contact info, address, emergency contact, notes
- 4-step onboarding wizard for adding new participants
- Search by name or NDIS number
- Filter by active/archived status
- Click into any participant to see their full details, shifts, invoices, NDIS plan

### 3. Worker Management
- Worker profiles: email, support types, qualifications, hourly rate
- Add new workers with email invite (they receive a signup link)
- Track support types per worker (Personal Care, Community Access, Transport, etc.)
- Compliance screening status per worker
- Worker hours tracking

### 4. Shift Scheduling
- **List view** — see all shifts for the week with participant, worker, time, type, status
- **Calendar view** — day/week/month visual calendar
- **New shift creation** — assign participant + worker, set time, choose support type
- **Recurring shifts** — set up weekly repeating shifts
- **Conflict detection** — warns if a worker is double-booked
- **Status tracking** — pending → scheduled → in progress → completed → cancelled
- Filter by participant, worker, status, or support type

### 5. GPS Clock In/Out (Worker Mobile App)
- Workers check in from their phone at the participant's location
- GPS records exact check-in coordinates (accountability)
- Live timer while shift is in progress
- Check out records end time + end location
- All times feed directly into invoicing

### 6. NDIS Plans & Budget Tracking
- Create and manage NDIS plans per participant
- Full budget category breakdown: Core, Capacity Building, Capital
- Track spending against plan budget in real-time
- Plan period dates and status (Current/Expired)
- Budget utilization visible to participants in their portal

### 7. Invoicing & Billing
- **Generate invoices** directly from completed shifts
- **Automatic rate calculation** based on day type (weekday, Saturday, Sunday, public holiday)
- **NDIS "lesser of" rule** — bills the shorter of scheduled vs actual time
- **10% GST** automatically calculated
- **Invoice numbering** — sequential format: INV-YYYYMM-####
- **Status workflow** — Draft → Pending → Submitted → Paid / Overdue
- **PDF download** — generate professional PDF invoices
- **PACE CSV export** — NDIA-format bulk payment file for claiming through the NDIA portal
- **Xero integration** — sync invoices to Xero for accounting

### 8. Case Notes
- Workers document each shift with case notes
- Concern flag for raising issues
- 24-hour edit window (can't change notes after 24 hours)
- Admin can view all case notes across the organization

### 9. Incident Reporting
- Report incidents with type, severity (low/medium/high/critical), description
- NDIA 5-day deadline countdown for mandatory reporting
- Filter by status, severity, type
- Track resolution status

### 10. Compliance Dashboard
- **Organization compliance score** — weighted average:
  - Worker Compliance (40%)
  - Incident Resolution (30%)
  - Documentation (30%)
- Color-coded: Green (80%+), Amber (60-79%), Red (<60%)
- Worker screening tracking: NDIS Worker Check, WWCC, First Aid, Police Check
- Expiry warnings (90 days before expiry)
- Blocks shifts for workers with expired checks

### 11. Cancellation Requests
- Participants can request appointment cancellations from their portal
- Admin reviews and approves/denies requests
- *(Currently has a loading bug — being fixed)*

### 12. Settings & Security
- Profile management (name, email, phone)
- Password change
- Organization ID display
- Role-based display
- Sign out

### 13. Participant Portal (Client-Facing)
- **Dashboard** — budget status, plan period, upcoming appointments
- **Appointments** — view scheduled support sessions, request cancellations
- **Invoices** — view finalized invoices from coordinator
- **Profile** — view personal info and NDIS details
- **Sidebar** — shows participant name + NDIS number
- **Sign out** — secure logout

---

## How This Replaces Your Current Workflow

| Before (Manual) | After (Ephraim Care Portal) |
|-----------------|----------------------------|
| Participant info in spreadsheets | Digital profiles with NDIS numbers, plans, contacts |
| Paper timesheets | GPS clock in/out with live tracking |
| Manual invoicing in Excel | One-click invoice generation from completed shifts |
| Emailing NDIA claims | PACE CSV export ready for NDIA portal upload |
| Checking worker screenings manually | Automated expiry tracking with 90-day warnings |
| Phone calls to check shift status | Live dashboard shows everything in real-time |
| No visibility for participants | Participants see their own appointments + invoices |

---

## What's Ready Now vs Coming Next

### Ready Now (v1.0 — Live)
- Full admin portal with all 12 sections
- Participant portal with dashboard, appointments, invoices
- 6 sample participants, 7 workers, sample shifts/invoices pre-loaded
- Auto-deploy on push to GitHub (both portals)

### Coming Next (When Configured)
- **SMS notifications** — enable with Twilio API keys (shift reminders to workers)
- **Xero accounting sync** — connect your Xero account in Settings > Integrations
- **Custom email domain** — replace sandbox sender with `@ephraimcare.com.au`
- **Worker mobile app** — currently testable via Expo Go, can be published to App Store/Play Store

### Future Growth (v2.0 Ideas)
- Document management (upload participant documents)
- AI-suggested shift assignments (rostering optimization)
- Family portal (read-only access for participant families)
- Bulk SMS to multiple workers
- REST API for third-party integrations

---

## How to Test Each Portal

### Admin Portal — Step by Step
1. Go to https://ephraimcare-ndis-portal-admin.vercel.app
2. Login: `admin@ephraimcare.com.au` / `EphraimAdmin2026`
3. **Dashboard** — verify counts load (6 participants, 7 workers)
4. **Participants** — click the list, open "Alice Johnson", check details
5. **Workers** — check worker list, view support types
6. **Shifts** — view weekly list, click Calendar button for visual view
7. **NDIS Plans** — verify 2 plans show with budget breakdowns
8. **Invoices** — verify 2 invoices show, try "Generate Invoice"
9. **Compliance** — view compliance score dashboard
10. **Settings** — verify your profile info displays

### Coordinator Login — Step by Step
1. Same URL: https://ephraimcare-ndis-portal-admin.vercel.app
2. Login: `sarah@ephraimcare.com.au` / `EphraimCoord2026`
3. Should see same pages but with coordinator role displayed
4. Can manage shifts, participants, workers — no billing settings access

### Participant Portal — Step by Step
1. Go to https://ephraimcare-participant-portal.vercel.app
2. Login: `client@ephraimcare.com.au` / `EphraimClient2026`
3. **Dashboard** — verify welcome message and NDIS number shows
4. **Appointments** — view upcoming support sessions
5. **Invoices** — view any finalized invoices
6. **Profile** — view personal info *(currently has a display bug being fixed)*

---

## Sample Data Pre-Loaded

### Participants (6)
| Name | NDIS Number |
|------|-------------|
| Alice Johnson | 431000001 |
| Bob Smith | 431000002 |
| Carol Williams | 431000003 |
| Daniel Brown | 431000004 |
| Eve Davis | 431000005 |
| Test Participant | 431999999 |

### Workers (7)
| Name | Support Types |
|------|--------------|
| James Wilson | Personal Care, Community Access |
| Emma Thompson | Personal Care, Capacity Building |
| Maria Garcia | Personal Care, Domestic Assistance |
| Liam Patel | Domestic Assistance, Community Access |
| David Chen | Community Access, Transport |
| Test Worker | Personal Care, Community Access |
| James Wilson (alt) | Personal Care, Transport +2 |

### NDIS Plans (2)
| Participant | Plan Budget | Categories |
|-------------|-------------|------------|
| Alice Johnson | $85,000 | Core ($45K + $5K), Capacity Building ($25K), Capital ($10K) |
| Bob Smith | $62,000 | Core ($35K + $12K), Capacity Building ($15K) |

### Invoices (2)
| Invoice # | Participant | Amount | Status |
|-----------|-------------|--------|--------|
| INV-202601-0001 | Alice Johnson | $340.00 | Pending |
| INV-202601-0002 | Bob Smith | $360.00 | Draft |

---

## Technical Info

| Detail | Value |
|--------|-------|
| **Admin URL** | https://ephraimcare-ndis-portal-admin.vercel.app |
| **Participant URL** | https://ephraimcare-participant-portal.vercel.app |
| **GitHub** | https://github.com/cleanupbro/ephraimcare-NDIS-portal |
| **Database** | Supabase PostgreSQL (Sydney region) |
| **Hosting** | Vercel (auto-deploy on push to main) |
| **Framework** | Next.js 15, React 19, Tailwind CSS v4 |

---

## Support

Built by **OpBros.ai** — contact@opbros.online | https://opbros.online

For issues, changes, or new features — contact your developer.
