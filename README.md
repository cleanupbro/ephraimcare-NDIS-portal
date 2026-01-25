# Ephraim Care NDIS Management Platform

A comprehensive web and mobile platform for **Ephraim Care** — an NDIS (National Disability Insurance Scheme) provider in Western Sydney, Australia — to manage participants, workers, shifts, case notes, invoicing, and compliance.

> **Delivered by [OpBros.ai](https://opbros.online)** — AI-powered automation solutions

---

## Overview

This platform replaces Ephraim Care's Excel/email/phone-based workflow with a unified system designed to scale from 20 to 200+ participants while maintaining full NDIS compliance.

### Core Value

> Schedule shifts, track worker check-ins, and generate accurate invoices from actual hours worked — without spreadsheets, duplicate data entry, or compliance gaps.

---

## Features

### Admin Portal (`apps/admin`)
- **Participant Management** — Full CRUD with NDIS plan details, budget tracking, and archive functionality
- **Worker Management** — Staff profiles with qualifications, compliance dates (NDIS Check, WWCC), and invite system
- **Shift Scheduling** — Create and manage shifts with conflict detection, validation, and status tracking
- **Case Notes Review** — View and filter worker-submitted case notes with admin comments
- **Invoicing** — Generate invoices from completed shifts with lesser-of billing, GST calculation, and PDF export
- **PACE CSV Export** — NDIS bulk payment file generation for claims submission

### Participant Portal (`apps/participant`)
- **Dashboard** — Plan status, budget utilization with color-coded progress bar, upcoming appointments
- **Invoice Downloads** — View and download finalized invoices as PDF
- **Read-Only Access** — Secure, participant-isolated view of their own data

### Worker Mobile App (`apps/worker-mobile`)
- **Today's Shifts** — View scheduled shifts with participant details and medical alerts
- **GPS Check-In/Out** — Location-verified attendance with live timer
- **Case Notes** — Document care delivered after each shift
- **Weekly Schedule** — Calendar view of upcoming shifts
- **Offline Support** — Cached data and queued sync for poor connectivity

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Web Framework** | Next.js 15.5 (App Router) |
| **Mobile** | React Native + Expo SDK 52 |
| **Database** | Supabase (PostgreSQL + RLS) |
| **Auth** | Supabase Auth (email/password) |
| **State Management** | TanStack Query (React Query) + Zustand |
| **UI Components** | shadcn/ui + Tailwind CSS |
| **PDF Generation** | @react-pdf/renderer |
| **Hosting** | Vercel (web), Expo Go (mobile) |
| **Monorepo** | Turborepo + pnpm |

---

## Project Structure

```
ephraimcare-portal-2026/
├── apps/
│   ├── admin/              # Admin web portal (Next.js)
│   ├── participant/        # Participant web portal (Next.js)
│   └── worker-mobile/      # Worker mobile app (Expo)
├── packages/
│   ├── config/             # Shared ESLint, TypeScript configs
│   ├── supabase/           # Database types, migrations
│   ├── types/              # Shared TypeScript types
│   ├── ui/                 # Shared UI components (shadcn/ui)
│   └── utils/              # Shared utilities, validators
├── supabase/
│   ├── migrations/         # SQL migration files
│   └── seed.sql            # Demo data for testing
└── .planning/              # GSD workflow planning files
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase account
- Expo Go app (for mobile testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/cleanupbro/ephraimcare-NDIS-portal.git
cd ephraimcare-NDIS-portal

# Install dependencies
pnpm install

# Set up environment variables
cp apps/admin/.env.example apps/admin/.env.local
cp apps/participant/.env.example apps/participant/.env.local
cp apps/worker-mobile/.env.example apps/worker-mobile/.env

# Run database migrations
pnpm db:migrate

# Seed demo data (optional)
pnpm db:seed
```

### Environment Variables

Each app requires Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Development

```bash
# Start all apps
pnpm dev

# Start specific app
pnpm dev --filter admin
pnpm dev --filter participant
pnpm dev --filter worker-mobile
```

| App | URL |
|-----|-----|
| Admin Portal | http://localhost:3000 |
| Participant Portal | http://localhost:3001 |
| Worker Mobile | Expo Go QR code |

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts with role (admin, coordinator, worker, participant) |
| `participants` | NDIS participant records |
| `ndis_plans` | Plan details with budget and dates |
| `workers` | Staff profiles with compliance dates |
| `shifts` | Scheduled appointments |
| `shift_check_ins` | GPS-verified attendance records |
| `case_notes` | Worker-submitted care documentation |
| `invoices` | Generated invoices with line items |
| `support_type_rates` | Configurable hourly rates |
| `public_holidays` | Holiday calendar for rate adjustments |

### Row Level Security (RLS)

All tables are protected by RLS policies ensuring:
- **Organization isolation** — Users only see their organization's data
- **Participant isolation** — Participants only see their own records
- **Worker isolation** — Workers only see their assigned shifts and own case notes

---

## Phases & Progress

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 1 | Foundation | ✅ Complete | 9/9 |
| 2 | Participant Management | ✅ Complete | 5/5 |
| 3 | Worker Management | ✅ Complete | 5/5 |
| 4 | Shift Scheduling | ✅ Complete | 4/4 |
| 5 | Worker Mobile App | ✅ Complete | 9/9 |
| 6 | Case Notes | ✅ Complete | 4/4 |
| 7 | Invoicing | ✅ Complete | 7/7 |
| 8 | Participant Portal | 🔄 Planning | 4 plans |
| 9 | Notifications | ⏳ Pending | — |
| 10 | Worker Screening | ⏳ Pending | — |
| 11 | Compliance & Incidents | ⏳ Pending | — |
| 12 | Reporting & Export | ⏳ Pending | — |
| 13 | Scale Features | ⏳ Pending | — |

**Overall Progress:** 57% (43 of ~75 plans completed)

---

## NDIS Compliance

This platform is built with NDIS compliance requirements in mind:

- **Worker Screening** — Validates NDIS Worker Check and WWCC expiry dates
- **Incident Reporting** — Tracks incidents with NDIA 24-hour notification deadlines
- **Case Notes** — Provides evidence trail for care delivered
- **Audit Trail** — All records include `created_at`, `updated_at`, `created_by`
- **Data Isolation** — RLS ensures participants cannot access other participants' data
- **Billing Accuracy** — Lesser-of-scheduled-vs-actual prevents overbilling

---

## Key Business Rules

| Rule | Implementation |
|------|---------------|
| Billing calculation | Lesser of scheduled vs actual duration |
| GST | Always 10% on all invoices |
| Invoice numbering | Gapless sequential (INV-YYYY-NNN) |
| Shift conflicts | Warning with admin override (not blocking) |
| Plan validity | Warning if outside plan dates (not blocking) |
| Auto-checkout | 30 minutes after scheduled end via pg_cron |
| Case note visibility | Internal only (not visible to participants) |

---

## Deployment

### Web Apps (Vercel)

```bash
# Deploy admin portal
vercel --prod --cwd apps/admin

# Deploy participant portal
vercel --prod --cwd apps/participant
```

### Mobile App (Expo)

```bash
# Development build
cd apps/worker-mobile
eas build --platform ios --profile development
eas build --platform android --profile development

# Production (Expo Go for now)
expo start
```

---

## Brand Guidelines

| Element | Value |
|---------|-------|
| Primary Color | `#66BB6A` (green) |
| Accent Color | `#00BFA5` (teal) |
| Heading Font | Montserrat |
| Body Font | Inter |
| Border Radius | 8px |
| Footer | "Powered by OpBros" |

---

## Contributing

This is a client project managed by OpBros.ai. For questions or support:

- **Client:** Ephraim Care (Liverpool, NSW)
- **Developer:** OpBros.ai ([opbros.online](https://opbros.online))
- **Contact:** cleanupbros.au@gmail.com

---

## License

Private — All rights reserved. This software is proprietary to Ephraim Care.

---

*Built with Claude Code by OpBros.ai*
