# Ephraim Care Portal — Client Testing Guide

---

## Portal URLs & Login Credentials

### 1. Admin Portal (Live)
- **URL:** https://ephraimcare-ndis-portal-admin.vercel.app
- **Email:** `admin@ephraimcare.com.au`
- **Password:** `EphraimAdmin2026`
- **Role:** Full admin access

### 2. Coordinator Account
- **URL:** Same admin portal (above)
- **Email:** `sarah@ephraimcare.com.au`
- **Password:** `EphraimCoord2026`
- **Role:** Coordinator (manage shifts, participants, workers — no billing settings)

### 3. Worker Account (for testing mobile app + admin worker views)
- **Email:** `james@ephraimcare.com.au`
- **Password:** `EphraimWorker2026`
- **Role:** Worker

### 4. Participant Portal (Live)
- **URL:** https://ephraimcare-participant-portal.vercel.app
- **Email:** `client@ephraimcare.com.au`
- **Password:** `EphraimClient2026`
- **Role:** Participant (view-only: appointments, invoices, budget)

---

## What This App Is

Ephraim Care Portal is a **complete NDIS disability support management system** built specifically for your business. It replaces spreadsheets, paper forms, and manual tracking with a connected digital platform that your admin team, support workers, and participants can all access.

### The 3 Portals

| Portal | Who Uses It | Purpose |
|--------|------------|---------|
| **Admin Portal** | You + coordinators | Run the business — manage participants, schedule shifts, generate invoices, track compliance, run reports |
| **Worker Mobile App** | Support workers | Clock in/out shifts with GPS verification, write case notes, view their schedule |
| **Participant Portal** | NDIS participants (+ families) | View upcoming appointments, check invoices, see budget remaining |

---

## What It Does & How It Helps Your Business

### Participant Management
- Store all participant info: NDIS number, plan details, contacts, support needs
- Track NDIS plan budgets in real-time (know exactly how much funding is left)
- 4-step onboarding form makes adding new participants fast and error-free
- Archive participants when they leave

### Shift Scheduling
- Create one-off or recurring shifts
- Calendar view shows your whole week at a glance
- Bulk shift creation — schedule a whole week in minutes
- Conflict detection warns if a worker is double-booked
- Workers get email/SMS notifications when assigned

### GPS Clock In/Out (Worker Mobile App)
- Workers check in from their phone at the participant's location
- GPS verification records WHERE they checked in (accountability)
- Live timer tracks shift duration
- Check out records exact end time and location
- All data feeds directly into invoicing

### Invoicing & Billing
- Generate invoices directly from completed shifts
- Automatic rate calculation based on day type (weekday, Saturday, Sunday, public holiday)
- Uses the NDIS "lesser of" rule — bills the shorter of scheduled vs actual time
- 10% GST automatically calculated
- Download PDF invoices
- Export NDIA-format CSV for claiming through the NDIA portal (PACE format)
- Xero accounting integration for automatic bookkeeping sync

### Compliance & NDIA Requirements
- Compliance dashboard scores your organisation's NDIA readiness
- Tracks worker screening expiry dates (NDIS Worker Check, WWCC)
- Warns when screenings are about to expire (90-day warning)
- Blocks shifts for workers with expired checks
- Incident reporting with NDIA 5-day deadline countdown
- Case notes system for documenting participant interactions

### Reports & Analytics
- **Revenue report** — See monthly income trends with charts
- **Worker hours report** — Track hours by worker and support type
- **Budget report** — See how each participant's funding is being used
- **Participant activity report** — Track service delivery metrics
- **Accounting exports** — BAS-ready CSV, Excel, and PDF exports

---

## How It Will Help Your Business Grow

1. **Save hours every week** — No more manual timesheets, spreadsheet invoicing, or paper forms. Everything is automated.

2. **Get paid faster** — Generate NDIA-compliant invoices in seconds. Export CSV directly to the NDIA portal for claiming. No more missed claims.

3. **Stay compliant** — The compliance dashboard tells you exactly where you stand. Never miss a worker screening renewal or NDIA deadline again.

4. **Scale with confidence** — The system handles 5 participants or 500 the same way. As you grow, the platform grows with you. Multi-organization support is built in.

5. **Professional client experience** — Participants and their families can log into their own portal to see appointments and invoices. This builds trust and reduces support calls.

6. **Accurate billing** — GPS verification + automatic time tracking means no more disputes about hours. The "lesser of" rule is applied automatically.

7. **Real-time visibility** — The dashboard shows you shifts, revenue, compliance, and worker status at a glance. Know the state of your business in 10 seconds.

---

## What to Test in Each Portal

### Admin Portal (Priority)
1. **Login** with admin credentials
2. **Dashboard** — check that widgets load (shifts, compliance, revenue)
3. **Participants** — browse the list, click into a participant, view their details
4. **Workers** — browse the list, view worker details and compliance status
5. **Shifts** — view shift list and calendar, try creating a new shift
6. **Invoices** — view invoice list, try generating an invoice
7. **Reports** — check revenue and worker hours reports
8. **Settings** — view rates, holidays, integrations

### Participant Portal (Once Deployed)
1. **Login** with participant credentials
2. **Dashboard** — check budget display and upcoming appointments
3. **Invoices** — view invoice list
4. **Profile** — view participant info

### Worker Mobile App (Expo Go)
1. Download "Expo Go" from App Store / Play Store
2. Login with worker credentials
3. View today's shifts
4. Test check-in/out flow

---

## Known Limitations / Notes

- **Participant portal** is now live at https://ephraimcare-participant-portal.vercel.app
- **Worker mobile app** requires Expo Go for testing (not yet published to App Store)
- **SMS notifications** require Twilio config (currently disabled)
- **Xero integration** requires Xero developer app setup
- **Email sender** uses Resend sandbox unless a verified domain is configured
- Some seed data is pre-loaded (5 sample participants, 5 workers, sample shifts)

---

## Support

Built by **OpBros.ai** — contact@opbros.online

For issues or changes, contact your developer.
