# BRAIN.md - Ephraim Care Portal Technical Reference

> **Purpose:** Complete technical reference for the Ephraim Care NDIS Portal build.
> **Last Updated:** January 27, 2026
> **Builder:** OpBros (Claude Code)

---

## Quick Reference

| Item | Value |
|------|-------|
| **Project Name** | Ephraim Care NDIS Portal |
| **Tech Stack** | Next.js 14 + Supabase + TypeScript |
| **Deployment** | Vercel |
| **Database** | PostgreSQL (Supabase) |
| **Live URL** | https://ephraimcare-ndis-portal-admin.vercel.app |

---

## 1. Environment Keys

### Supabase (Database & Auth)

| Key | Purpose | Where Used |
|-----|---------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Client & Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key for client | Client-side auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin key | API routes only |

**Supabase Project Details:**
- **Project ID:** `vkjxqvfzhiglpqvlehsk`
- **Region:** AWS ap-southeast-2 (Sydney)
- **Organization:** `mkbhhynumxkmciuueyaf`
- **Dashboard:** https://supabase.com/dashboard/project/vkjxqvfzhiglpqvlehsk

### Email (Resend)

| Key | Purpose | Where Used |
|-----|---------|------------|
| `RESEND_API_KEY` | Send transactional emails | Worker invites, notifications |
| `RESEND_FROM_EMAIL` | Sender address | Email templates |
| `ADMIN_EMAIL` | Admin notification recipient | Error alerts |

**Resend Dashboard:** https://resend.com/emails

### SMS (Twilio) - Optional

| Key | Purpose |
|-----|---------|
| `TWILIO_ACCOUNT_SID` | Twilio account identifier |
| `TWILIO_AUTH_TOKEN` | Twilio authentication |
| `TWILIO_PHONE_NUMBER` | Sender phone number |

### Accounting (Xero) - Optional

| Key | Purpose |
|-----|---------|
| `XERO_CLIENT_ID` | OAuth client ID |
| `XERO_CLIENT_SECRET` | OAuth client secret |

### Cron Jobs

| Key | Purpose |
|-----|---------|
| `CRON_SECRET` | Secure cron endpoint access |

---

## 2. Database Schema

### Core Tables

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE STRUCTURE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  organizations ─┬─► participants ─┬─► ndis_plans            │
│                 │                 │                         │
│                 │                 └─► case_notes            │
│                 │                                           │
│                 ├─► workers ─────────► shifts ◄─────────────┤
│                 │                       │                   │
│                 │                       ├─► shift_check_ins │
│                 │                       │                   │
│                 │                       └─► shift_photos    │
│                 │                                           │
│                 ├─► invoices ────────► invoice_items        │
│                 │                                           │
│                 ├─► incidents                               │
│                 │                                           │
│                 └─► profiles (auth)                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Table Definitions

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `organizations` | Multi-tenant org data | id, name, ndis_registration |
| `profiles` | User authentication | id, email, role, organization_id |
| `participants` | NDIS participants | id, ndis_number, first_name, last_name |
| `workers` | Support workers | id, profile_id, hourly_rate, services_provided |
| `ndis_plans` | NDIS funding plans | id, participant_id, total_budget, start_date |
| `plan_budget_categories` | Budget breakdown | id, plan_id, category, amount |
| `shifts` | Scheduled support sessions | id, participant_id, worker_id, support_type |
| `shift_check_ins` | GPS check-in/out | id, shift_id, check_in_time, location |
| `case_notes` | Session documentation | id, shift_id, content, concern_flag |
| `invoices` | Billing records | id, participant_id, total_amount, status |
| `invoice_items` | Line items | id, invoice_id, shift_id, amount |
| `incidents` | Incident reports | id, type, severity, description |

### Custom Types (Enums)

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'worker', 'participant', 'family');

-- Shift status workflow
CREATE TYPE shift_status AS ENUM (
  'pending',      -- Awaiting worker assignment
  'scheduled',    -- Confirmed
  'in_progress',  -- Worker checked in
  'completed',    -- Worker checked out
  'cancelled'     -- Cancelled
);

-- Invoice status
CREATE TYPE invoice_status AS ENUM (
  'draft',        -- Being prepared
  'pending',      -- Ready for submission
  'submitted',    -- Sent to NDIS
  'paid',         -- Payment received
  'overdue'       -- Past due date
);

-- Incident severity
CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
```

---

## 3. API Routes

### Admin Portal (`apps/admin/app/api/`)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/workers/invite` | POST | Send worker invitation email |
| `/api/workers/resend-invite` | POST | Resend invitation |
| `/api/invoices/generate` | POST | Generate invoice from shifts |
| `/api/invoices/export-csv` | POST | Export PACE CSV format |
| `/api/invoices/[id]/pdf` | GET | Generate PDF invoice |
| `/api/invoices/[id]/finalize` | POST | Mark invoice as submitted |
| `/api/shifts/recurring` | POST | Create recurring shifts |
| `/api/shifts/[id]/override-checkout` | POST | Admin override checkout |
| `/api/compliance/report` | GET | Generate compliance report |
| `/api/photos/upload` | POST | Upload shift photos |
| `/api/ndia/generate-csv` | POST | NDIA bulk payment CSV |
| `/api/reports/export/participants` | GET | Export participants report |
| `/api/reports/export/worker-hours` | GET | Export worker hours |
| `/api/reports/export/invoices` | GET | Export invoices report |
| `/api/xero/connect` | GET | Initiate Xero OAuth |
| `/api/xero/callback` | GET | Xero OAuth callback |
| `/api/xero/disconnect` | POST | Disconnect Xero |
| `/api/sms/test` | POST | Test SMS sending |
| `/api/cron/send-shift-reminders` | GET/POST | Cron: shift reminders |
| `/api/admin/run-migration` | POST | Run database migration |
| `/api/organizations/register` | POST | Register new organization |

---

## 4. Key Functions & Hooks

### React Query Hooks (apps/admin/hooks/)

| Hook | Purpose | File |
|------|---------|------|
| `useParticipants` | List/search participants | use-participants.ts |
| `useParticipant` | Single participant details | use-participant.ts |
| `useCreateParticipant` | Create participant mutation | use-create-participant.ts |
| `useUpdateParticipant` | Update participant mutation | use-update-participant.ts |
| `useWorkers` | List workers | use-workers.ts |
| `useWorker` | Single worker details | use-worker.ts |
| `useCreateWorker` | Create worker + send invite | use-create-worker.ts |
| `useShifts` | List shifts with filters | use-shifts.ts |
| `useCreateShift` | Create shift (includes support_type) | use-create-shift.ts |
| `useInvoices` | List invoices | use-invoices.ts |
| `useGenerateInvoice` | Generate from shifts | use-generate-invoice.ts |
| `useNdisPlans` | List NDIS plans | use-ndis-plans.ts |
| `useIncidents` | List incidents | use-incidents.ts |
| `useCreateIncident` | Report incident | use-create-incident.ts |
| `useComplianceHealth` | Dashboard metrics | use-compliance-health.ts |

### Database Functions (Supabase)

| Function | Purpose |
|----------|---------|
| `get_user_role()` | Get current user's role |
| `get_user_organization_id()` | Get user's org ID for RLS |
| `calculate_shift_duration()` | Calculate billable hours |
| `get_next_invoice_number()` | Sequential invoice numbering |

### Utility Functions (apps/admin/lib/)

| File | Functions |
|------|-----------|
| `billing/calculate-billable-hours.ts` | Lesser-of billing logic |
| `notifications/send-email.ts` | Resend email wrapper |
| `notifications/send-sms.ts` | Twilio SMS wrapper |
| `xero/sync-invoice.ts` | Xero integration |
| `validations/ndis-number.ts` | NDIS number validation |
| `validations/shift.ts` | Shift conflict detection |

---

## 5. Application Structure

```
ephraimcare-portal-2026/
├── apps/
│   ├── admin/                 # Admin Portal (Next.js)
│   │   ├── app/              # App Router pages
│   │   │   ├── api/          # API routes
│   │   │   ├── participants/ # Participant pages
│   │   │   ├── workers/      # Worker pages
│   │   │   ├── shifts/       # Shift pages
│   │   │   ├── invoices/     # Invoice pages
│   │   │   ├── plans/        # NDIS Plans
│   │   │   ├── incidents/    # Incidents
│   │   │   ├── case-notes/   # Case Notes
│   │   │   ├── compliance/   # Compliance Dashboard
│   │   │   └── settings/     # Settings
│   │   ├── components/       # React components
│   │   ├── hooks/            # React Query hooks
│   │   ├── lib/              # Utilities
│   │   └── types/            # TypeScript types
│   │
│   ├── participant/          # Participant Portal (Next.js)
│   │   └── [similar structure]
│   │
│   └── worker-mobile/        # Worker App (Expo/React Native)
│       └── [mobile structure]
│
├── packages/
│   ├── database/             # Supabase types & client
│   ├── shared/               # Shared utilities
│   └── ui/                   # Shared UI components
│
├── supabase/
│   ├── migrations/           # SQL migrations
│   ├── seed.sql              # Demo data
│   └── config.toml           # Local config
│
├── scripts/
│   └── fix-shifts-schema.ts  # Migration helper
│
└── docs/                     # Documentation
    └── BRAIN.md              # This file
```

---

## 6. Deployment

### Vercel Configuration

| App | URL | Branch |
|-----|-----|--------|
| Admin Portal | ephraimcare-ndis-portal-admin.vercel.app | main |
| Participant Portal | (not deployed) | main |

### Environment Variables (Vercel Dashboard)

Required in Vercel Project Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://vkjxqvfzhiglpqvlehsk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
NEXT_PUBLIC_SITE_URL=https://ephraimcare-ndis-portal-admin.vercel.app
RESEND_API_KEY=re_...
```

### Build Commands

```bash
# Install dependencies
pnpm install

# Run development
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck
```

---

## 7. Authentication Flow

```
┌──────────────────────────────────────────────────────────┐
│                    AUTH FLOW                              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. User visits login page                               │
│           │                                              │
│           ▼                                              │
│  2. Enter email/password                                 │
│           │                                              │
│           ▼                                              │
│  3. Supabase Auth validates credentials                  │
│           │                                              │
│           ▼                                              │
│  4. JWT token returned with user_id                      │
│           │                                              │
│           ▼                                              │
│  5. Middleware checks role from profiles table           │
│           │                                              │
│           ▼                                              │
│  6. RLS policies filter data by organization_id          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ephraimcare.com.au | EphraimAdmin2026! |

---

## 8. NDIS Compliance Features

### Billing Rules
- **Lesser-of billing:** Bill minimum of scheduled vs actual duration
- **Category tracking:** Core, Capacity Building, Capital
- **Invoice format:** INV-YYYYMM-#### (gapless sequential)

### Worker Compliance
- NDIS Worker Screening Check (number + expiry)
- Working With Children Check (number + expiry)
- First Aid Certificate tracking
- Police Check tracking

### Documentation
- Case notes with 24-hour edit window
- Incident reporting with severity levels
- Shift check-in/out with GPS
- Photo evidence for shifts

---

## 9. Migrations Applied

| Migration | Purpose | Date |
|-----------|---------|------|
| 20260124000001 | Create extensions (uuid-ossp) | Jan 24 |
| 20260124000002 | Create custom types | Jan 24 |
| 20260124000003 | Audit schema | Jan 24 |
| 20260124000004 | Profiles table | Jan 24 |
| 20260124000005 | User roles | Jan 24 |
| 20260124000006 | Participants table | Jan 24 |
| 20260124000007 | Workers table | Jan 24 |
| 20260124000008 | NDIS Plans | Jan 24 |
| 20260124000009 | Service Agreements | Jan 24 |
| 20260124000010 | Shifts table | Jan 24 |
| 20260124000011 | Case Notes | Jan 24 |
| 20260124000012 | Invoices + Items | Jan 24 |
| 20260124000013 | NDIS Price Guide | Jan 24 |
| 20260124000014 | Notifications | Jan 24 |
| 20260124000015 | Error Log | Jan 24 |
| 20260124000016 | RLS Policies | Jan 24 |
| 20260124000017 | RLS Helper Functions | Jan 24 |
| 20260124100001 | Worker Compliance Columns | Jan 24 |
| **20260124200001** | **Shift support_type column** | **Jan 24** |
| 20260124300001 | Shift Check-ins | Jan 24 |
| 20260125000001 | Case Notes Phase 6 | Jan 25 |
| 20260125100001 | Invoicing Phase 7 | Jan 25 |
| 20260126000001 | Incidents Phase 11 | Jan 26 |
| 20260127000001 | Multi-org Foundation | Jan 27 |
| 20260127000002 | Organization Credentials | Jan 27 |
| 20260127000003 | Cron Shift Reminders | Jan 27 |
| 20260127000004 | Xero Invoice Tracking | Jan 27 |
| 20260127000005 | Participant Goals | Jan 27 |
| 20260127000006 | Shift Photos | Jan 27 |
| 20260127000007 | Org NDIS Registration | Jan 27 |

**Note:** Migration `20260124200001` was manually applied via Supabase Management API on Jan 27 to fix the shift creation bug.

---

## 10. Known Issues & Workarounds

| Issue | Status | Workaround |
|-------|--------|------------|
| NDIS Plans no create form | Known | Create via participant wizard |
| Console.log in production | Tech debt | Replace with proper logging |
| Hardcoded admin email | Tech debt | Move to env variable |
| Photo upload no org check | Security | Add org membership validation |

---

## 11. Useful Commands

```bash
# Database
supabase db push              # Push migrations to production
supabase db reset             # Reset local database
supabase gen types typescript # Generate TypeScript types

# Development
pnpm dev                      # Start all apps
pnpm --filter admin dev       # Start admin only
pnpm build                    # Build all apps

# Deployment
vercel --prod                 # Deploy to production

# Testing
pnpm test                     # Run tests
pnpm typecheck                # TypeScript check
```

---

## 12. Contact & Support

**Developer:** OpBros
**Email:** cleanupbros.au@gmail.com
**Phone:** +61 406 764 585
**Website:** https://opbros.online

---

*This document serves as the single source of truth for the Ephraim Care Portal build.*
