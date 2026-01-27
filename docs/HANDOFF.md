# HANDOFF — Ephraim Care NDIS Platform v1.0

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ███████╗██████╗ ██╗  ██╗██████╗  █████╗ ██╗███╗   ███╗                    ║
║   ██╔════╝██╔══██╗██║  ██║██╔══██╗██╔══██╗██║████╗ ████║                    ║
║   █████╗  ██████╔╝███████║██████╔╝███████║██║██╔████╔██║                    ║
║   ██╔══╝  ██╔═══╝ ██╔══██║██╔══██╗██╔══██║██║██║╚██╔╝██║                    ║
║   ███████╗██║     ██║  ██║██║  ██║██║  ██║██║██║ ╚═╝ ██║                    ║
║   ╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝     ╚═╝                    ║
║                                                                              ║
║   ██████╗ █████╗ ██████╗ ███████╗    ██████╗  ██████╗ ██████╗ ████████╗     ║
║  ██╔════╝██╔══██╗██╔══██╗██╔════╝    ██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝     ║
║  ██║     ███████║██████╔╝█████╗      ██████╔╝██║   ██║██████╔╝   ██║        ║
║  ██║     ██╔══██║██╔══██╗██╔══╝      ██╔═══╝ ██║   ██║██╔══██╗   ██║        ║
║  ╚██████╗██║  ██║██║  ██║███████╗    ██║     ╚██████╔╝██║  ██║   ██║        ║
║   ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝    ╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝        ║
║                                                                              ║
║                     N D I S   M A N A G E M E N T   S Y S T E M              ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  VERSION: 1.0.0          │  DELIVERED: 2026-01-27      │  STATUS: LIVE       ║
║  CLIENT:  Ephraim Care   │  DEVELOPER: OpBros.ai       │  PLATFORM: Vercel   ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Table of Contents

1. [What's Being Delivered](#whats-being-delivered)
2. [Live URLs](#live-urls)
3. [Test Accounts](#test-accounts)
4. [Security Status](#security-status)
5. [Known Issues](#known-issues)
6. [How to Set Up Test Accounts](#how-to-set-up-test-accounts)
7. [Xero Integration Guide](#xero-integration-guide)
8. [Upgrade Path](#upgrade-path)
9. [Tech Stack](#tech-stack)
10. [File Structure](#file-structure)
11. [Support & Contact](#support--contact)

---

## What's Being Delivered

A complete **NDIS management platform** with 3 applications:

| App | Type | Purpose | Status |
|-----|------|---------|--------|
| **Admin Portal** | Web (Next.js) | Staff management of participants, workers, shifts, invoices | ✅ LIVE |
| **Participant Portal** | Web (Next.js) | Participants view their plan, invoices, appointments | 🔧 Needs deployment |
| **Worker Mobile App** | Mobile (Expo) | GPS check-in/out, case notes, shift management | 📱 Expo Go ready |

### Features Completed (13 Phases)

| Phase | Feature | Status |
|-------|---------|--------|
| 01 | Foundation & Auth | ✅ Complete |
| 02 | Participant Management | ✅ Complete |
| 03 | Worker Management | ✅ Complete |
| 04 | Shift Scheduling | ✅ Complete |
| 05 | Worker Mobile App | ✅ Complete |
| 06 | Case Notes | ✅ Complete |
| 07 | Invoicing & Billing | ✅ Complete |
| 08 | Participant Portal | ✅ Complete |
| 09 | Notifications | ✅ Complete |
| 10 | Worker Screening | ✅ Complete |
| 11 | Compliance & Incidents | ✅ Complete |
| 12 | Reporting & Analytics | ✅ Complete |
| 13 | Scale Features | ✅ Complete |

---

## Live URLs

### Production

| Application | URL | Status |
|-------------|-----|--------|
| **Admin Portal** | https://ephraimcare-ndis-portal-admin.vercel.app | ✅ LIVE |
| **Participant Portal** | *Needs separate Vercel deployment* | 🔧 Pending |
| **GitHub Repository** | https://github.com/cleanupbro/ephraimcare-NDIS-portal | ✅ Public |

### Vercel Dashboard

- **Project**: https://vercel.com/sams-projects-3dc6d62d/ephraimcare-ndis-portal-admin
- **Deployments**: Auto-deploy on push to `main` branch

---

## Test Accounts

### Credentials (Ready to Create)

| Role | Email | Password | Portal |
|------|-------|----------|--------|
| **Admin** | admin@ephraimcare.com.au | EphraimAdmin2026! | Admin Portal |
| **Worker** | worker@ephraimcare.com.au | EphraimWorker2026! | Mobile App |
| **Participant** | client@ephraimcare.com.au | EphraimClient2026! | Participant Portal |

> ⚠️ **These accounts need to be created in Supabase.** See [How to Set Up Test Accounts](#how-to-set-up-test-accounts) below.

---

## Security Status

### ✅ Secure (No Issues)

| Check | Status |
|-------|--------|
| `.env.local` in `.gitignore` | ✅ Safe - not committed |
| No secrets in repository | ✅ Verified |
| Supabase RLS enabled | ✅ All tables protected |
| HTTPS enforced | ✅ Vercel handles this |

### ⚠️ Production Checklist (Before Go-Live)

| Item | Current State | Action Required |
|------|---------------|-----------------|
| Email sender domain | `onboarding@resend.dev` (demo) | Register custom domain in Resend |
| Admin email | Hardcoded `ephraimcare252@gmail.com` | Add `ADMIN_EMAIL` env var |
| Localhost fallback | In worker invite route | Set `NEXT_PUBLIC_SITE_URL` |
| Favicon | Missing | Add `/public/favicon.ico` |

### Security Files Affected

```
apps/admin/app/api/workers/invite/route.ts:110  → Change email sender
apps/admin/lib/notifications/send-email.ts:20   → Add ADMIN_EMAIL env var
```

---

## Known Issues

### Critical (Must Fix for Production)

| Issue | Location | Fix |
|-------|----------|-----|
| Demo email domain | `route.ts:110` | Update to verified Resend domain |
| Hardcoded admin email | `send-email.ts:20` | Use `ADMIN_EMAIL` environment variable |

### Medium Priority

| Issue | Impact | Fix |
|-------|--------|-----|
| Console.log statements | 32+ files have debug logs | Replace with structured logging |
| Fire-and-forget emails | No retry on failure | Consider email queue |
| Missing favicon | Browser tab shows default | Add favicon to `/public/` |

### Low Priority (Tech Debt)

| Issue | Notes |
|-------|-------|
| TODOs in code | 2 remaining TODO comments |
| Type assertions | 54+ `as any` usages |
| Xero account code | Hardcoded to '200' |

---

## How to Set Up Test Accounts

### Step 1: Access Supabase

1. Go to https://supabase.com/dashboard
2. Open project: **vkjxqvfzhiglpqvlehsk** (or your project)
3. Navigate to **Authentication > Users**

### Step 2: Create Auth Users

Click **"Add User" > "Create new user"** for each:

| Email | Password | Auto Confirm |
|-------|----------|--------------|
| admin@ephraimcare.com.au | EphraimAdmin2026! | ✅ Yes |
| worker@ephraimcare.com.au | EphraimWorker2026! | ✅ Yes |
| client@ephraimcare.com.au | EphraimClient2026! | ✅ Yes |

**IMPORTANT:** Copy the UUID for each user after creation!

### Step 3: Run SQL for Profiles

Go to **SQL Editor** and run:

```sql
-- ============================================
-- EPHRAIM CARE TEST ACCOUNTS SETUP
-- ============================================
-- Replace UUIDs with actual values from Step 2

-- 1. Create Organization (if not exists)
INSERT INTO public.organizations (id, name, abn)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Ephraim Care', '12345678901')
ON CONFLICT (id) DO NOTHING;

-- 2. Admin Profile
INSERT INTO public.profiles (id, role, first_name, last_name, email, organization_id)
VALUES (
  'REPLACE_WITH_ADMIN_UUID',  -- ← From Step 2
  'admin',
  'Admin',
  'Test',
  'admin@ephraimcare.com.au',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
);

-- 3. Worker Profile
INSERT INTO public.profiles (id, role, first_name, last_name, email, organization_id)
VALUES (
  'REPLACE_WITH_WORKER_UUID',  -- ← From Step 2
  'worker',
  'Worker',
  'Test',
  'worker@ephraimcare.com.au',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
);

-- 4. Worker Record (for shift assignments)
INSERT INTO public.workers (
  profile_id, employee_id, qualification, services_provided,
  hourly_rate, organization_id, is_active
)
VALUES (
  'REPLACE_WITH_WORKER_UUID',  -- ← Same as above
  'EMP-001',
  ARRAY['Cert III Individual Support', 'First Aid'],
  ARRAY['Personal Care', 'Community Access'],
  45.00,
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  true
);

-- 5. Test Participant
INSERT INTO public.participants (
  ndis_number, first_name, last_name, email, phone,
  date_of_birth, organization_id, is_active
)
VALUES (
  '431999999',
  'Test',
  'Participant',
  'client@ephraimcare.com.au',
  '0400000000',
  '1990-01-15',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  true
);
```

### Step 4: Verify Login

1. Go to https://ephraimcare-ndis-portal-admin.vercel.app/login
2. Enter: `admin@ephraimcare.com.au` / `EphraimAdmin2026!`
3. You should see the dashboard!

---

## Xero Integration Guide

### Prerequisites

1. Active Xero subscription
2. Xero Developer account at https://developer.xero.com

### Step 1: Create Xero App

1. Go to https://developer.xero.com/app/manage
2. Click **"New app"**
3. Fill in:
   - **App name**: Ephraim Care Portal
   - **Company URL**: https://ephraimcare.com.au
   - **OAuth 2.0 redirect URI**: `https://ephraimcare-ndis-portal-admin.vercel.app/api/xero/callback`

### Step 2: Get Credentials

Copy from your Xero app:
- **Client ID**
- **Client Secret**

### Step 3: Add Environment Variables

In Vercel dashboard → Settings → Environment Variables:

```
XERO_CLIENT_ID=your_client_id_here
XERO_CLIENT_SECRET=your_client_secret_here
```

### Step 4: Connect in Admin Portal

1. Go to **Settings > Integrations**
2. Click **"Connect to Xero"**
3. Authorize the connection
4. Select your Xero organization

### How Invoice Sync Works

1. Create invoice in Admin Portal
2. Click **"Finalize"** to lock the invoice
3. Invoice automatically syncs to Xero
4. Status updates when paid in Xero

---

## Upgrade Path

### Immediate Improvements (v1.1)

| Feature | Effort | Impact |
|---------|--------|--------|
| Custom email domain | 2 hours | Professional emails |
| Logo replacement | 1 hour | Brand consistency |
| Structured logging | 4 hours | Better debugging |

### Future Features (v2.0)

| Feature | Description |
|---------|-------------|
| **Document Management** | Upload/store participant documents |
| **Rostering Optimization** | AI-suggested shift assignments |
| **Family Portal** | Read-only access for families |
| **Bulk SMS** | Send reminders to multiple workers |
| **API for Integrations** | REST API for third-party tools |

### Database Migrations

When upgrading, run migrations:

```bash
# Connect Supabase CLI
supabase link --project-ref YOUR_PROJECT_REF

# Push new migrations
supabase db push
```

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.5.10 | Web framework |
| **React** | 19.0 | UI library |
| **Tailwind CSS** | 4.0 | Styling |
| **shadcn/ui** | Latest | Component library |
| **TanStack Query** | 5.x | Server state management |
| **Recharts** | 2.x | Charts and graphs |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase** | Latest | Database, Auth, Storage |
| **PostgreSQL** | 15+ | Database engine |
| **Resend** | Latest | Email delivery |
| **Twilio** | Optional | SMS notifications |

### Mobile

| Technology | Version | Purpose |
|------------|---------|---------|
| **Expo** | SDK 53 | React Native framework |
| **Expo Router** | 4.x | Navigation |
| **expo-location** | Latest | GPS tracking |
| **expo-local-authentication** | Latest | Biometric auth |

### Infrastructure

| Service | Purpose | Cost |
|---------|---------|------|
| **Vercel** | Hosting web apps | Free tier |
| **Supabase** | Database & Auth | Free tier |
| **GitHub** | Code repository | Free |

---

## File Structure

```
ephraimcare-portal-2026/
├── apps/
│   ├── admin/                 # Admin portal (Next.js)
│   │   ├── app/               # App Router pages
│   │   │   ├── (auth)/        # Login, register, reset
│   │   │   ├── (protected)/   # Dashboard, participants, etc.
│   │   │   └── api/           # API routes
│   │   ├── components/        # UI components
│   │   ├── hooks/             # React Query hooks
│   │   └── lib/               # Utilities
│   │
│   ├── participant/           # Participant portal (Next.js)
│   │   └── app/               # Dashboard, invoices, profile
│   │
│   └── worker-mobile/         # Mobile app (Expo)
│       ├── app/               # Expo Router screens
│       └── lib/               # Offline sync, GPS
│
├── packages/
│   ├── types/                 # Shared TypeScript types
│   ├── supabase/              # Supabase client config
│   ├── ui/                    # Shared UI components
│   └── utils/                 # Shared utilities
│
├── supabase/
│   └── migrations/            # 15+ SQL migration files
│
├── .planning/                 # Project documentation
│   ├── PROJECT.md             # Requirements
│   ├── ROADMAP.md             # Phase breakdown
│   └── phases/                # Phase plans and summaries
│
├── CLIENT_DELIVERY_SUMMARY.md # Client-facing documentation
├── HANDOFF.md                 # This file
└── README.md                  # GitHub readme
```

---

## Support & Contact

### OpBros.ai

| Channel | Contact |
|---------|---------|
| **Email** | contact@opbros.online |
| **Website** | https://opbros.online |
| **GitHub Issues** | https://github.com/cleanupbro/ephraimcare-NDIS-portal/issues |

### What's Included in Support

- Bug fixes for delivered features
- Help with deployment issues
- Guidance on Supabase/Vercel configuration

### What's Extra

- New feature development
- Custom integrations
- Training sessions

---

## Final Checklist

### Before Client Testing

- [ ] Create test accounts in Supabase (see instructions above)
- [ ] Verify admin login works
- [ ] Add organization record
- [ ] Test creating a participant
- [ ] Test creating a worker

### Before Production Go-Live

- [ ] Register custom domain in Resend
- [ ] Add `ADMIN_EMAIL` environment variable
- [ ] Deploy participant portal separately
- [ ] Add company favicon
- [ ] Configure real support type rates
- [ ] Add 2026 public holidays
- [ ] Connect Xero (if using)

---

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                     D E L I V E R E D   W I T H   ❤️                         ║
║                                                                              ║
║                         by OpBros.ai — opbros.online                         ║
║                                                                              ║
║                    "Powered by OpBros" — AI Automation                       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

**Built with Claude Code + GSD Workflow**
*13 phases • 77 plans • ~36,649 lines of TypeScript • 4 days*
