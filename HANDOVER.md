# Ephraim Care NDIS Portal — Client Handover Package

**Prepared for:** Meshach — Ephraim Care  
**Prepared by:** OpBros.ai (Shamal Krishna & Hafsah Nuzhat)  
**Date:** February 13, 2026
**Version:** 1.1  
**Status:** ✅ LIVE & Operational

---

## Table of Contents

1. [What You're Getting](#1-what-youre-getting)
2. [Live Portal URLs](#2-live-portal-urls)
3. [Login Credentials — All Portals](#3-login-credentials--all-portals)
4. [Admin Portal — Full Guide](#4-admin-portal--full-guide)
5. [Participant Portal — Full Guide](#5-participant-portal--full-guide)
6. [Worker Mobile App — Full Guide](#6-worker-mobile-app--full-guide)
7. [NDIS Compliance Features](#7-ndis-compliance-features)
8. [Integrations (Email, SMS, Xero)](#8-integrations-email-sms-xero)
9. [Database & Server Infrastructure](#9-database--server-infrastructure)
10. [Sample Data Pre-Loaded](#10-sample-data-pre-loaded)
11. [Known Issues & Fixes Required](#11-known-issues--fixes-required)
12. [How to Set Up From Scratch](#12-how-to-set-up-from-scratch)
13. [Monthly Running Costs](#13-monthly-running-costs)
14. [Future Upgrade Path](#14-future-upgrade-path)
15. [Step-by-Step Walkthroughs](#15-step-by-step-walkthroughs)
16. [Support & Contact](#16-support--contact)

---

## 1. What You're Getting

A **complete NDIS disability support management platform** — 3 connected applications that replace spreadsheets, paper forms, and manual tracking with one digital system.

| Application | Type | Who Uses It | Status |
|-------------|------|-------------|--------|
| **Admin Portal** | Web (Desktop & Mobile-friendly) | Meshach + Coordinators | ✅ LIVE |
| **Participant Portal** | Web (Desktop & Mobile-friendly) | NDIS Participants & Families | ✅ LIVE |
| **Worker Mobile App** | Mobile (iOS & Android) | Support Workers | ✅ Ready (Expo Go) |

### What Was Built (13 Development Phases)

| # | Phase | What It Covers |
|---|-------|---------------|
| 1 | Foundation & Auth | Login system, user roles, security |
| 2 | Participant Management | Add/edit participants, NDIS numbers, contacts |
| 3 | Worker Management | Add workers, invite via email, qualifications |
| 4 | Shift Scheduling | Calendar, list view, recurring shifts, bulk creation |
| 5 | Worker Mobile App | GPS clock in/out, live timer, biometric login |
| 6 | Case Notes | Post-shift documentation, concerns, 24hr edit lock |
| 7 | Invoicing & Billing | NDIS-compliant invoicing, PDF, PACE CSV, Xero sync |
| 8 | Participant Portal | Self-service: appointments, invoices, budget view |
| 9 | Notifications | Email & SMS shift reminders, invoice alerts |
| 10 | Worker Screening | NDIS Worker Check, WWCC, First Aid, Police Check tracking |
| 11 | Compliance & Incidents | Compliance scoring, incident reporting, NDIA deadlines |
| 12 | Reporting & Analytics | Revenue, hours, budget, activity reports + CSV/Excel export |
| 13 | Scale Features | Multi-org foundation, photo uploads, goals tracking |

---

## 2. Live Portal URLs

| Portal | URL | Auto-Deploys? |
|--------|-----|---------------|
| **Admin Portal** | https://ephraimcare-ndis-portal-admin.vercel.app | ✅ Yes (on push to `main`) |
| **Participant Portal** | https://ephraimcare-participant-portal.vercel.app | ✅ Yes (on push to `main`) |
| **Worker Mobile App** | Via Expo Go app (scan QR code) | Manual start |
| **GitHub Repository** | https://github.com/cleanupbro/ephraimcare-NDIS-portal | — |

### Custom Domain Setup (When Ready)

You can connect your own domains in Vercel:

| Portal | Suggested Domain |
|--------|-----------------|
| Admin | `admin.ephraimcare.com.au` |
| Participant | `portal.ephraimcare.com.au` |

---

## 3. Login Credentials — All Portals

### Admin Portal

| Role | Email | Password | Access Level |
|------|-------|----------|-------------|
| **Admin** (Full Access) | `admin@ephraimcare.com.au` | `EphraimAdmin2026` | All features, settings, billing |
| **Coordinator** | `sarah@ephraimcare.com.au` | `EphraimCoord2026` | Day-to-day operations, no billing settings |

### Participant Portal

| Role | Email | Password |
|------|-------|----------|
| **Participant** (Test) | `client@ephraimcare.com.au` | `EphraimClient2026` |

### Worker Accounts (Mobile App + Admin Worker Views)

| Worker Name | Email | Password |
|-------------|-------|----------|
| James Wilson | `james@ephraimcare.com.au` | `EphraimWorker2026` |
| Emma Thompson | `emma@ephraimcare.com.au` | `EphraimWorker2026` |
| Maria Garcia | `maria@ephraimcare.com.au` | `EphraimWorker2026` |
| Liam Patel | `liam@ephraimcare.com.au` | `EphraimWorker2026` |
| David Chen | `david@ephraimcare.com.au` | `EphraimWorker2026` |

> ⚠️ **Important:** Change all passwords before going live with real data. These are demo credentials.

---

## 4. Admin Portal — Full Guide

**URL:** https://ephraimcare-ndis-portal-admin.vercel.app  
**Login:** `admin@ephraimcare.com.au` / `EphraimAdmin2026`

The Admin Portal is the main control centre for running Ephraim Care's NDIS operations. Here's every page and what it does:

> **Login screenshot:** `docs/screenshots/01-login.png` — Clean email/password form with green branding.

### 4.1 Dashboard (`/`)

> **Screenshot:** `docs/screenshots/02-dashboard.png`

Your home screen. Shows at a glance:
- **Live counts** — total participants, workers, today's shifts, pending invoices
- **Compliance status** — organization health score
- **Quick actions** — buttons to schedule a shift, add a participant, create an invoice
- **Upcoming shifts** — counter for the week ahead

### 4.2 Participant Management

> **Screenshots:** `docs/screenshots/03-participants-list.png`, `04-participant-detail.png`, `05-create-participant.png`

| Page | Path | What You Do |
|------|------|-------------|
| **Participant List** | `/participants` | View all participants. Search by name or NDIS number. Filter by active/archived. |
| **Add New Participant** | `/participants/new` | 4-step wizard: (1) Basic Info, (2) NDIS Plan Details, (3) Emergency Contacts, (4) Support Needs. |
| **Participant Detail** | `/participants/[id]` | Full profile with tabs: Info, Case Notes, Goals, Budget tracking. See all shifts and invoices for this person. |
| **Goal Tracking** | `/participants/[id]/goals` | Set and track participant goals across sessions. |

**Fields stored per participant:**
- First name, last name, date of birth
- NDIS number (format: 43XXXXXXX)
- Email, phone, address
- Emergency contact (name, phone, relationship)
- Support needs, medical alerts, notes
- Active/archived status

### 4.3 Worker Management

> **Screenshots:** `docs/screenshots/06-workers-list.png`, `07-worker-detail.png`

| Page | Path | What You Do |
|------|------|-------------|
| **Worker List** | `/workers` | View all workers with compliance status dots (green/amber/red). |
| **Add New Worker** | `/workers/new` | Create worker profile + invite via email (they receive a signup link). |
| **Worker Detail** | `/workers/[id]` | Full profile: support types, qualifications, hourly rate, compliance checks, hours stats. |

**Fields stored per worker:**
- Name, email, phone
- Employee ID
- Support types (Personal Care, Community Access, Transport, etc.)
- Qualifications (Cert III, First Aid, etc.)
- Hourly rate
- Compliance documents with expiry dates

### 4.4 Shift Scheduling

> **Screenshots:** `docs/screenshots/08-shifts-list.png`, `09-shifts-calendar.png`, `10-create-shift.png`

| Page | Path | What You Do |
|------|------|-------------|
| **Shift List** | `/shifts` | View all shifts for the week. Filter by participant, worker, status, or support type. |
| **Calendar View** | `/shifts/calendar` | Visual day/week/month calendar of all shifts. Navigate with arrows. |
| **New Shift** | `/shifts/new` | Create a single shift: pick participant + worker + date/time + support type. |
| **Bulk Create** | `/shifts/bulk` | Create recurring shifts (e.g., "3x per week for 4 weeks"). |
| **Recurring Templates** | `/shifts/recurring` | Set up repeating shift patterns. |

**Shift statuses:** Pending → Scheduled → In Progress → Completed → Cancelled

**Conflict detection:** The system warns you if a worker is already booked for the same time.

### 4.5 Invoicing & Billing

> **Screenshots:** `docs/screenshots/11-invoices-list.png`, `13-generate-invoice.png`

| Page | Path | What You Do |
|------|------|-------------|
| **Invoice List** | `/invoices` | View all invoices. Filter by status: Draft, Pending, Submitted, Paid, Overdue. |
| **Generate Invoice** | `/invoices/generate` | Select a participant + date range → system generates an invoice from completed shifts. |
| **Invoice Detail** | `/invoices/[id]` | View line items, totals, GST. Options: Finalize, Download PDF, Export PACE CSV. |
| **NDIA Export** | `/invoices/ndia-export` | Export invoices in NDIA PACE format for bulk claiming through the NDIA portal. |

**How billing works:**
1. Worker clocks in/out of a shift (with GPS)
2. System records actual start/end times
3. You generate an invoice for a date range
4. System auto-calculates using the **"lesser of" rule** — bills whichever is shorter: scheduled time or actual time
5. Rates auto-adjust for: weekday / Saturday / Sunday / public holiday
6. **GST (10%)** is automatically added
7. Invoice number format: `INV-YYYYMM-####` (e.g., INV-202601-0001)

### 4.6 Case Notes

> **Screenshot:** `docs/screenshots/14-case-notes.png`

| Page | Path | What You Do |
|------|------|-------------|
| **All Case Notes** | `/case-notes` | View all case notes from all workers across the organisation. |

Workers create case notes after completing shifts (from the mobile app). Each note includes:
- Session summary
- Concern flag (if there's an issue to raise)
- Goals addressed
- 24-hour edit window (can't change notes after 24 hours for compliance)

### 4.7 Incidents

> **Screenshot:** `docs/screenshots/15-incidents.png`

| Page | Path | What You Do |
|------|------|-------------|
| **Incident List** | `/incidents` | View and filter incidents by severity (low/medium/high/critical), type, status. |
| **New Incident** | `/incidents/new` | Report a new incident with description, severity, people involved. |

**NDIA compliance feature:** A countdown timer shows the 5-day deadline for mandatory NDIA reporting on serious incidents.

### 4.8 Compliance Dashboard

> **Screenshot:** `docs/screenshots/16-compliance.png`

| Page | Path | What You Do |
|------|------|-------------|
| **Compliance** | `/compliance` | Organisation compliance health score dashboard. |

**How the score works (weighted average):**
- Worker Compliance: **40%** (are all checks current?)
- Incident Resolution: **30%** (are incidents being handled on time?)
- Documentation: **30%** (are case notes being filed?)

**Colour coding:** 🟢 Green (80%+) | 🟠 Amber (60–79%) | 🔴 Red (<60%)

**Worker screening tracking:**
- NDIS Worker Check
- Working With Children Check (WWCC)
- First Aid Certificate
- Police Check
- 90-day expiry warnings
- Blocks shift assignments for workers with expired checks

### 4.9 Cancellation Requests

> **Screenshot:** `docs/screenshots/17-cancellations.png`

| Page | Path | What You Do |
|------|------|-------------|
| **Cancellations** | `/cancellation-requests` | View and approve/deny cancellation requests from participants. |

### 4.10 Reports & Analytics

> **Screenshots:** `docs/screenshots/18-reports.png`, `19-revenue-report.png`

| Page | Path | What You Do |
|------|------|-------------|
| **Report Hub** | `/reports` | Choose from the reports below. |
| **Revenue Report** | `/reports/revenue` | Monthly revenue breakdown with charts, by support type. |
| **Worker Hours** | `/reports/worker-hours` | Hours worked by each worker, by support type. |
| **Budget Report** | `/reports/budget` | Budget utilization per participant — how much of their NDIS plan is used. |
| **Activity Report** | `/reports/participant-activity` | Participant activity summary across shifts. |
| **Accounting Exports** | `/reports/accounting-exports` | Export data in BAS/accounting formats (CSV, Excel). |

All reports support **CSV and Excel download**.

### 4.11 Settings

> **Screenshots:** `docs/screenshots/20-settings.png`, `21-settings-rates.png`

| Page | Path | What You Do |
|------|------|-------------|
| **Profile** | `/settings` | View/edit your profile, change password, sign out. |
| **Support Type Rates** | `/settings/rates` | Set hourly rates by support type and day type (weekday/Sat/Sun/holiday). |
| **Public Holidays** | `/settings/holidays` | Add public holidays — these affect billing rates automatically. |
| **Integrations** | `/settings/integrations` | Connect Xero accounting, configure SMS (Twilio), email settings. |

---

## 5. Participant Portal — Full Guide

**URL:** https://ephraimcare-participant-portal.vercel.app  
**Login:** `client@ephraimcare.com.au` / `EphraimClient2026`

The Participant Portal gives NDIS participants and their families a window into their support — building transparency and trust.

### 5.1 Login (`/login`)

- Email + password login
- Magic link option (passwordless — participant receives a login link via email)
- Clean, simple interface

### 5.2 Dashboard (`/dashboard`)

The home screen shows:
- **Welcome message** with participant name
- **Budget status** — progress bar showing how much of the NDIS plan budget has been used
- **Plan period** — start/end dates and days remaining
- **Upcoming appointments** — next scheduled support sessions
- **Recent invoices** — latest billing activity

### 5.3 Appointments (`/appointments`)

- View all upcoming support sessions (worker name, time, type, date)
- View past appointments
- **Request cancellation** — submit a cancellation request for an upcoming appointment (admin reviews and approves/denies)

### 5.4 Invoices (`/invoices`)

- View all finalized invoices from the coordinator
- See line-by-line breakdown (service, hours, rate, total)
- **Download PDF** — professional PDF invoice for records

### 5.5 Profile (`/profile`)

- View personal information (name, NDIS number, contact details)
- Edit contact information
- View organization details

### 5.6 Sidebar Navigation

Always visible:
- Participant's name
- NDIS number
- Navigation links: Dashboard, Appointments, Invoices, Profile
- **Sign Out** button

---

## 6. Worker Mobile App — Full Guide

**Platform:** iOS & Android (via Expo Go for now)  
**Framework:** React Native (Expo 53)

The Worker Mobile App is how your support workers manage their day — clocking in/out with GPS verification, viewing their schedule, and writing case notes.

### 6.1 How Workers Access the App

1. Worker downloads **Expo Go** from the App Store (iOS) or Play Store (Android)
2. You run the dev server: `cd apps/worker-mobile && pnpm dev`
3. Worker scans the QR code shown in terminal
4. App loads — they log in with their credentials

> 💡 **For production:** The app can be published to App Store/Play Store via Expo Application Services (EAS). This is an additional step.

### 6.2 Login Screen

- Email + password login
- **Biometric login** (Face ID / Touch ID) — optional toggle in settings
- Secure token storage on device

### 6.3 Home Tab (Today's Shifts)

- Shows today's assigned shifts
- Each shift card shows: participant name, time, support type, address
- **Quick check-in button** — tap to start a shift
- **Active shift timer** — live countdown while a shift is in progress

### 6.4 Shift Detail & Clock In/Out

When a worker taps a shift:
1. **Participant info** — name, address, medical alerts (if any)
2. **Check In** button — records:
   - Exact GPS coordinates (latitude/longitude)
   - Timestamp
   - Verifies worker is at the participant's location
3. **Live timer** — shows how long the shift has been running
4. **Check Out** button — records:
   - End GPS coordinates
   - End timestamp
   - Prompts worker to write a case note

### 6.5 Schedule Tab

- Weekly calendar view
- Upcoming shifts listed by day
- Navigate between weeks

### 6.6 Case Notes Tab (My Notes)

- **Pending notes** — shifts that need case notes written
- **Submitted notes** — previously written notes
- **Create note** — free text + concern flag + goals addressed
- **24-hour edit window** — notes lock after 24 hours for compliance

### 6.7 Profile Tab

- View personal info (name, email, employee ID)
- Toggle biometric login on/off
- View support types and qualifications
- **Sign Out**

### 6.8 Offline Support

The app includes:
- Local SQLite cache for shift data
- AsyncStorage for auth tokens
- Automatic sync when back online

---

## 7. NDIS Compliance Features

Key compliance features built into the platform:

### Billing Compliance

| Rule | How It's Implemented |
|------|---------------------|
| **Lesser-of billing** | System automatically bills the shorter of scheduled vs actual shift time |
| **Day-type rates** | Weekday / Saturday / Sunday / Public Holiday rates applied automatically |
| **GST (10%)** | Auto-calculated on all invoices |
| **Budget tracking** | Real-time tracking: Core, Capacity Building, Capital categories |
| **PACE CSV export** | One-click export in NDIA claim format for portal upload |
| **Invoice numbering** | Sequential format: INV-YYYYMM-#### |

### Worker Compliance Tracking

| Check | Feature |
|-------|---------|
| **NDIS Worker Screening** | Tracked with expiry date, 90-day warning |
| **Working With Children Check** | Tracked with expiry date, 90-day warning |
| **First Aid Certificate** | Tracked with expiry date, 90-day warning |
| **Police Check** | Tracked with expiry date, 90-day warning |
| **Shift blocking** | Workers with expired checks can't be assigned shifts |

### Incident Reporting

- Severity levels: Low / Medium / High / Critical
- **NDIA 5-day reporting deadline** countdown for mandatory incidents
- Status tracking: Open → Under Review → Resolved / Reported to NDIA

### Documentation

- Case notes required after every shift (worker mobile app)
- 24-hour edit lock on notes
- Compliance score tracks documentation completeness

---

## 8. Integrations (Email, SMS, Xero)

### Email Notifications (Resend)

| Event | Who Gets Emailed |
|-------|-----------------|
| Shift assigned to worker | Worker |
| Shift cancelled | Worker |
| Invoice finalized | Participant |
| Worker invited | New worker (signup link) |
| Password reset | User |

**Setup:** Add `RESEND_API_KEY` to Vercel environment variables. Free tier: 3,000 emails/month.

### SMS Notifications (Twilio)

| Event | Who Gets SMS | When |
|-------|-------------|------|
| Shift reminder | Worker | 24 hours before |
| Shift reminder | Worker | 2 hours before |

**Setup:** Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` to Vercel. Cost: ~$0.05/SMS.

### Xero Accounting Integration

Sync invoices directly to Xero. Setup:

1. Go to https://developer.xero.com/app/manage → click **"New app"**
2. Set redirect URI to: `https://ephraimcare-ndis-portal-admin.vercel.app/api/xero/callback`
3. Copy **Client ID** and **Client Secret**
4. Add `XERO_CLIENT_ID` and `XERO_CLIENT_SECRET` to Vercel env vars
5. In Admin Portal → **Settings > Integrations** → click **"Connect to Xero"**
6. Once connected: finalized invoices auto-sync to Xero

---

## 9. Database & Server Infrastructure

### Architecture

| Layer | Technology | Details |
|-------|-----------|---------|
| **Frontend** | Next.js 15 + React 19 | Server-side rendering, app router |
| **Styling** | Tailwind CSS v4 + shadcn/ui | Component library  |
| **State** | TanStack Query v5 | Server state management with caching |
| **Database** | Supabase (PostgreSQL 15+) | Sydney region, Row Level Security |
| **Auth** | Supabase Auth | Email/password, magic links, SSR cookies |
| **Mobile** | Expo 53 (React Native 0.79) | iOS & Android |
| **Hosting** | Vercel | Auto-deploy on push to `main` branch |
| **Email** | Resend | Transactional emails |
| **SMS** | Twilio | Shift reminders |
| **Accounting** | Xero | Invoice sync |

### Database Tables (30 Migrations)

The database includes tables for:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles with roles (admin/coordinator/worker) |
| `organizations` | Multi-org support with ABN |
| `participants` | NDIS participant records |
| `workers` | Worker profiles, qualifications, rates |
| `ndis_plans` | NDIS plan budgets by category |
| `service_agreements` | Service agreement tracking |
| `shifts` | Shift scheduling with times, status, GPS |
| `shift_check_ins` | GPS check-in/out records |
| `case_notes` | Post-shift documentation |
| `invoices` / `invoice_line_items` | Billing with line items |
| `incidents` | Incident reports with NDIA workflow |
| `notifications` | System notifications log |
| `ndis_price_guide` | NDIS rate lookup |
| `organization_credentials` | Integration credentials (Xero tokens) |
| `participant_goals` | Goal tracking per participant |
| `shift_photos` | Photo evidence per shift |

**Security:** All tables have Row Level Security (RLS) policies — users can only see data from their own organization.

### Hosting (Vercel)

- **Auto-deploy:** Every push to `main` branch on GitHub triggers a new deployment
- **Dashboard:** https://vercel.com/sams-projects-3dc6d62d/ephraimcare-ndis-portal-admin
- **SSL:** HTTPS enforced automatically by Vercel

---

## 10. Sample Data Pre-Loaded

The system comes pre-loaded with demo data for testing:

### Participants (6)

| Name | NDIS Number | Status |
|------|-------------|--------|
| Alice Johnson | 431000001 | Active |
| Bob Smith | 431000002 | Active |
| Carol Williams | 431000003 | Active |
| Daniel Brown | 431000004 | Active |
| Eve Davis | 431000005 | Active |
| Test Participant | 431999999 | Active |

### Workers (7)

| Name | Support Types |
|------|--------------| 
| James Wilson | Personal Care, Community Access |
| Emma Thompson | Personal Care, Capacity Building |
| Maria Garcia | Personal Care, Domestic Assistance |
| Liam Patel | Domestic Assistance, Community Access |
| David Chen | Community Access, Transport |
| Test Worker | Personal Care, Community Access |

### NDIS Plans (2)

| Participant | Budget | Categories |
|-------------|--------|------------|
| Alice Johnson | $85,000 | Core ($45K + $5K), Capacity Building ($25K), Capital ($10K) |
| Bob Smith | $62,000 | Core ($35K + $12K), Capacity Building ($15K) |

### Invoices (2)

| Invoice # | Participant | Amount | Status |
|-----------|-------------|--------|--------|
| INV-202601-0001 | Alice Johnson | $340.00 | Pending |
| INV-202601-0002 | Bob Smith | $360.00 | Draft |

> 💡 This is demo data for testing. When you start using the system for real, you can archive these test records and add your actual participants and workers.

---

## 11. Known Issues & Fixes Required

### Before Going Live with Real Data

| # | Issue | Where | Fix Required |
|---|-------|-------|-------------|
| 1 | **Demo email domain** | Email sender | Change from `onboarding@resend.dev` to your verified domain in Resend |
| 2 | **Hardcoded admin email** | Notification CC | Set `ADMIN_EMAIL` environment variable in Vercel |
| 3 | **Missing favicon** | Browser tab | Add your company favicon to `/public/favicon.ico` |

### Known Bugs (Minor)

| # | Portal | Page | Issue | Impact | Status |
|---|--------|------|-------|--------|--------|
| 1 | ~~Admin~~ | ~~Cancellations~~ | ~~Page stuck on "Loading..."~~ | ~~Low~~ | **FIXED** (Feb 2026) |
| 2 | ~~Participant~~ | ~~Profile~~ | ~~Profile data cards show empty~~ | ~~Low~~ | **FIXED** (Feb 2026) — address mapping + notes field corrected |
| 3 | Admin | Invoice Detail | Invoice detail page shows "Application error" (RangeError: Invalid time value) when clicking an invoice | Medium — invoice list works, PDF generation works | Open |
| 4 | Admin | Worker Compliance | Worker compliance status shows "Checks not set" for all workers | Low — compliance columns exist in DB but no data populated yet | Expected (add data when going live) |

### Recommended NDIS Rate Configuration

Once live, go to **Admin Portal → Settings → Support Type Rates** and add your actual rates:

| Support Type | Suggested Rate | NDIS Code |
|-------------|----------------|-----------|
| Personal Care | $65.47/hr | 01_011_0107_1_1 |
| Community Access | $67.56/hr | 04_102_0125_6_1 |
| Respite | $65.47/hr | 01_039_0115_1_1 |
| Domestic Assistance | $53.86/hr | 01_019_0120_1_1 |
| Transport | $0.97/km | 04_104_0125_6_1 |

> Check the current NDIS Price Guide for the most up-to-date rates.

### Public Holidays to Add

Go to **Admin Portal → Settings → Public Holidays** and add for 2026:

| Date | Holiday |
|------|---------|
| 2026-01-01 | New Year's Day |
| 2026-01-26 | Australia Day |
| 2026-04-03 | Good Friday |
| 2026-04-04 | Easter Saturday |
| 2026-04-06 | Easter Monday |
| 2026-04-25 | ANZAC Day |
| 2026-06-08 | Queen's Birthday (NSW) |
| 2026-12-25 | Christmas Day |
| 2026-12-26 | Boxing Day |

---

## 12. How to Set Up From Scratch

If you ever need to rebuild or set up on a new environment:

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → sign up
2. Click **"New Project"** → name it `ephraim-care-prod`
3. Copy your API keys from **Settings → API**

### Step 2: Run Database Migrations

**Option A — Supabase CLI (Recommended):**
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

**Option B — Manual SQL:**
1. Go to Supabase → **SQL Editor**
2. Copy each file from `supabase/migrations/` one by one (there are 30 files)
3. Run them in order (001, 002, 003...)

### Step 3: Deploy to Vercel

```bash
npm install -g vercel

# Admin portal
cd apps/admin
vercel --prod

# Participant portal  
cd ../participant
vercel --prod
```

Then add environment variables in Vercel dashboard:

```
# Required
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=https://your-admin-url.vercel.app

# Recommended
ADMIN_EMAIL=admin@ephraimcare.com.au
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=notifications@ephraimcare.com.au

# Optional
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+61xxxxxxxxxx
XERO_CLIENT_ID=your_xero_id
XERO_CLIENT_SECRET=your_xero_secret
```

### Step 4: Create User Accounts

1. Go to Supabase → **Authentication → Users**
2. Click **"Add User"** → **"Create new user"** for each account
3. Copy the UUID for each user
4. Go to **SQL Editor** and run the profile creation SQL (provided in `docs/HANDOFF.md`)

### Step 5: Configure Mobile App

1. Update `.env` in `apps/worker-mobile/` with your Supabase keys
2. Workers install **Expo Go** on their phones
3. Run `cd apps/worker-mobile && pnpm dev`
4. Workers scan the QR code to load the app

---

## 13. Monthly Running Costs

| Service | Free Tier | Your Estimated Use | Monthly Cost |
|---------|-----------|-------------------|-------------|
| **Supabase** | 500MB DB, 1GB storage | Light use | **$0** |
| **Vercel** | 100GB bandwidth | ~5GB | **$0** |
| **Resend** | 3,000 emails/month | ~500 emails | **$0** |
| **Twilio** | — | ~200 SMS | **~$10** |
| **Total** | | | **~$10/month** |

If you grow beyond free tiers:
- Supabase Pro: $25/month
- Vercel Pro: $20/month

---

## 14. Future Upgrade Path

### Quick Wins (v1.1 — hours of work)

| Feature | Effort | Impact |
|---------|--------|--------|
| Custom email domain | 2 hours | Professional `@ephraimcare.com.au` emails |
| Company logo & favicon | 1 hour | Brand consistency |
| ~~Fix cancellations page bug~~ | — | **DONE** (Feb 2026) |
| ~~Fix participant profile bug~~ | — | **DONE** (Feb 2026) |
| Fix invoice detail page bug | 2 hours | View individual invoice details |

### Future Features (v2.0)

| Feature | Description |
|---------|-------------|
| **Document Management** | Upload/store participant documents (plans, assessments) |
| **Rostering Optimization** | AI-suggested shift assignments based on worker availability |
| **Family Portal** | Read-only access for participant families |
| **Bulk SMS** | Send reminders to multiple workers at once |
| **REST API** | API for third-party integrations |
| **App Store Publish** | Publish worker app to App Store / Google Play |

---

## 15. Step-by-Step Walkthroughs

### How to Add a New Participant

1. Log in to the Admin Portal (`docs/screenshots/01-login.png`)
2. Click **"Add Participant"** on the Dashboard or go to **Participants > Add Participant** (`docs/screenshots/05-create-participant.png`)
3. **Step 1 — Basic Info:** Enter first name, last name, NDIS number (9 digits starting with 43), date of birth, phone, email
4. **Step 2 — Plan Details:** Enter NDIS plan number, start/end dates, budget amounts by category (Core, Capacity Building, Capital)
5. **Step 3 — Contacts:** Enter address and emergency contact details
6. **Step 4 — Support Needs:** Add notes about their support requirements, medical alerts
7. Click **Submit** — participant appears in the list (`docs/screenshots/03-participants-list.png`)

### How to Schedule a Shift

1. Go to **Shifts > New Shift** (`docs/screenshots/10-create-shift.png`)
2. Select a **Participant** from the dropdown
3. Select a **Support Type** (Personal Care, Community Access, etc.)
4. Select a **Worker** (only shows workers qualified for that support type)
5. Pick the **Date** and **Start Time**
6. Choose a **Duration** (1h, 1.5h, 2h, 3h, 4h, 8h, or custom)
7. Click **Schedule Shift** — it appears in the list (`docs/screenshots/08-shifts-list.png`) and calendar (`docs/screenshots/09-shifts-calendar.png`)

### How to Generate an Invoice

1. Go to **Invoices > Generate Invoice** (`docs/screenshots/13-generate-invoice.png`)
2. Select a **Participant** from the dropdown
3. Set the **Period Start** and **Period End** dates
4. Click **Generate Invoice** — system auto-calculates from completed shifts using the lesser-of rule
5. Review the invoice in the list (`docs/screenshots/11-invoices-list.png`)
6. From the invoice, you can: **Finalize**, **Download PDF**, or **Export PACE CSV**

### How to Check Compliance

1. Go to **Compliance** (`docs/screenshots/16-compliance.png`)
2. View the **donut chart** — shows overall health score (green = 80%+, amber = 60-79%, red = <60%)
3. Check the three component scores:
   - **Worker Compliance (40%):** Are all worker screening checks current?
   - **Incident Resolution (30%):** Are incidents being handled on time?
   - **Documentation (30%):** Are case notes being filed after shifts?
4. Click **Export Report** to download a compliance summary

### How Workers Use the Mobile App

The Worker Mobile App (Expo Go) is how support workers manage their day:
1. Worker opens Expo Go on their phone and scans the QR code
2. Logs in with their credentials (e.g., `james@ephraimcare.com.au`)
3. **Home tab** shows today's shifts — tap a shift to see participant details
4. **Check In** button records GPS coordinates and start time
5. **Live timer** shows the shift duration while working
6. **Check Out** records end time and GPS — prompts for a case note
7. **Schedule tab** shows upcoming shifts for the week
8. **My Notes tab** shows pending and submitted case notes

> Note: The mobile app runs via Expo Go (development mode). For production, it can be published to the App Store / Google Play via EAS.

---

## 16. Support & Contact

### OpBros.ai — Your Developer

| Channel | Contact |
|---------|---------|
| **Email** | contact@opbros.online |
| **Phone** | +61 406 764 585 |
| **Website** | [opbros.online](https://opbros.online) |
| **GitHub Issues** | [github.com/cleanupbro/ephraimcare-NDIS-portal/issues](https://github.com/cleanupbro/ephraimcare-NDIS-portal/issues) |

### What's Included

- ✅ Bug fixes for delivered features
- ✅ Help with deployment issues
- ✅ Guidance on Supabase/Vercel configuration
- ✅ Help adding real participant/worker data

### What's Extra (Quoted Separately)

- New feature development
- Custom integrations
- Staff training sessions
- App Store publishing
- Custom domain setup

---

**Delivered with ❤️ by [OpBros.ai](https://opbros.online)**

*13 phases • 30 database migrations • 3 applications • ~36,649 lines of TypeScript*

*"Powered by OpBros" — AI Automation for Better Business*
