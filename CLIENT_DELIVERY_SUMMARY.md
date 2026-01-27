# Ephraim Care NDIS Platform — Client Delivery Summary

**Delivered:** 2026-01-27
**Version:** v1.0
**Client:** Ephraim Care
**Developer:** OpBros.ai

---

## What Was Built

A complete NDIS management platform with **3 applications**:

1. **Admin Portal** (web) — For Ephraim Care staff to manage participants, workers, shifts, invoices
2. **Participant Portal** (web) — For participants/families to view their plan status and invoices
3. **Worker Mobile App** — For support workers to check in/out of shifts with GPS

---

## Application URLs

Once deployed, your applications will be at:

| Application | Suggested URL | Purpose |
|-------------|---------------|---------|
| Admin Portal | admin.ephraimcare.com.au | Staff management |
| Participant Portal | portal.ephraimcare.com.au | Participant access |
| Worker Mobile | Expo Go / App Store | Worker check-in/out |

---

## What Each Page Does

### Admin Portal (apps/admin)

| Page | URL Path | What It Does |
|------|----------|--------------|
| **Login** | `/login` | Staff sign in with email/password |
| **Dashboard** | `/` | Overview: today's shifts, compliance alerts, quick actions |
| **Participants List** | `/participants` | View all participants with search/filter |
| **Create Participant** | `/participants/new` | 4-step form: basic info, plan, contacts, support needs |
| **Participant Detail** | `/participants/[id]` | View participant with budget progress, case notes tab |
| **Workers List** | `/workers` | View all workers with compliance status dots |
| **Create Worker** | `/workers/new` | Create worker + send invite email |
| **Worker Detail** | `/workers/[id]` | View worker with hours stats, compliance section |
| **Shifts List** | `/shifts` | View shifts by week, grouped by day, with filters |
| **Calendar View** | `/shifts/calendar` | Day/week/month calendar of shifts |
| **Bulk Create** | `/shifts/bulk` | Create recurring shifts (e.g., "3x per week for 4 weeks") |
| **Invoices List** | `/invoices` | View all invoices with status filter |
| **Generate Invoice** | `/invoices/generate` | Select participant + date range → generate invoice |
| **Invoice Detail** | `/invoices/[id]` | Preview, finalize, download PDF, export PACE CSV |
| **Incidents** | `/incidents` | Report and track incidents with NDIA workflow |
| **Compliance** | `/compliance` | Health score dashboard, expiring checks list |
| **Reports** | `/reports` | Budget, revenue, hours, activity reports |
| **Budget Report** | `/reports/budget` | Budget utilization by participant with charts |
| **Revenue Report** | `/reports/revenue` | Monthly revenue trends by support type |
| **Hours Report** | `/reports/hours` | Worker hours with averages |
| **Activity Report** | `/reports/activity` | Participant activity summary |
| **Accounting Exports** | `/reports/accounting-exports` | Xero/MYOB CSV downloads |
| **Settings: Rates** | `/settings/rates` | Configure hourly rates by support type |
| **Settings: Holidays** | `/settings/holidays` | Add public holidays for rate adjustments |
| **Settings: Integrations** | `/settings/integrations` | Connect Xero, configure SMS |
| **Settings: Goals** | `/participants/[id]/goals` | Participant goal tracking |

### Participant Portal (apps/participant)

| Page | URL Path | What It Does |
|------|----------|--------------|
| **Login** | `/login` | Participant sign in (email/password or magic link) |
| **Dashboard** | `/` | Budget progress bar, plan info, days remaining |
| **Appointments** | `/appointments` | Upcoming shifts with worker names |
| **Invoices** | `/invoices` | View finalized invoices, download PDF |
| **Profile** | `/profile` | Personal info (read-only), logout |

### Worker Mobile App (apps/worker-mobile)

| Screen | Tab | What It Does |
|--------|-----|--------------|
| **Login** | — | Email/password + Face ID/Touch ID option |
| **Home** | Home | Today's shifts, quick check-in button |
| **Shift Detail** | — | Participant info, medical alerts, check-in button |
| **Active Shift** | — | Live timer, check-out button |
| **Case Note** | — | Add note after checkout (required) |
| **Schedule** | Schedule | Weekly calendar of upcoming shifts |
| **My Notes** | My Notes | Pending notes, submitted notes list |
| **Profile** | Profile | Personal info, biometrics toggle, logout |

---

## What You Need to Sign Up For

### Required (Free Tier Available)

| Service | What It's For | Sign Up Link | What You Get |
|---------|---------------|--------------|--------------|
| **Supabase** | Database, login system, file storage | [supabase.com](https://supabase.com) | 500MB database, 1GB storage free |
| **Vercel** | Host the web apps | [vercel.com](https://vercel.com) | 100GB bandwidth free |

### Optional (For Full Functionality)

| Service | What It's For | Sign Up Link | Cost |
|---------|---------------|--------------|------|
| **Resend** | Send emails (shift notifications, invoices) | [resend.com](https://resend.com) | 3,000 emails/month free |
| **Twilio** | Send SMS reminders before shifts | [twilio.com](https://twilio.com) | ~$0.05/SMS |
| **Xero** | Sync invoices to accounting | [developer.xero.com](https://developer.xero.com) | Requires Xero subscription |

---

## API Keys You Need

### From Supabase (Required)

Go to your Supabase project → **Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Keep `SUPABASE_SERVICE_ROLE_KEY` secret!** Never expose it in client-side code.

### From Resend (Optional — for emails)

Go to [resend.com](https://resend.com) → **API Keys**:

```
RESEND_API_KEY=re_xxxxxxxxxx
```

### From Twilio (Optional — for SMS)

Go to [twilio.com](https://twilio.com) → **Console Dashboard**:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

You'll need to buy a phone number (~$1/month).

### From Xero (Optional — for accounting)

Go to [developer.xero.com](https://developer.xero.com) → **My Apps** → Create new app:

```
XERO_CLIENT_ID=your_client_id
XERO_CLIENT_SECRET=your_client_secret
```

Set the callback URL to: `https://YOUR_ADMIN_URL/api/xero/callback`

---

## API Calls Made

### Supabase (Database)

All database operations go through Supabase:
- Create/read/update/delete participants, workers, shifts
- Insert check-ins with GPS coordinates
- Generate and store invoices
- Store case notes and incident reports

### Email Notifications (Resend)

| Event | Email Sent To | Template |
|-------|---------------|----------|
| New shift created | Worker | "You've been assigned a shift" |
| Shift cancelled | Worker | "Your shift has been cancelled" |
| Invoice finalized | Participant | "Your invoice is ready" |
| Worker invited | Worker | "Welcome to Ephraim Care" |
| Password reset | User | "Reset your password" |

### SMS Notifications (Twilio)

| Event | SMS Sent To | When |
|-------|-------------|------|
| Shift reminder | Worker | 24 hours before shift |
| Shift reminder | Worker | 2 hours before shift |

### Xero Integration

| Action | API Call |
|--------|----------|
| Connect account | OAuth2 authorization flow |
| Sync invoice | Create invoice in Xero |
| Get contacts | Map participants to Xero contacts |

---

## How to Get It Running

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Name it "ephraim-care-prod" (or similar)
4. Copy your API keys from Settings → API

### Step 2: Run Database Migrations

You have two options:

**Option A: Supabase CLI (recommended)**
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

**Option B: Manual SQL**
1. Go to Supabase → SQL Editor
2. Copy each file from `supabase/migrations/` one by one
3. Run them in order (001, 002, 003...)

### Step 3: Deploy Web Apps to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy admin portal
cd apps/admin
vercel --prod

# Deploy participant portal
cd ../participant
vercel --prod
```

Then set environment variables in Vercel dashboard.

### Step 4: Configure Mobile App

1. Update `.env` in `apps/worker-mobile/` with your Supabase keys
2. Install Expo Go on worker phones
3. Run `npx expo start` and scan QR code

### Step 5: Create Test Accounts

Follow this process for each test account:

#### Test Account Credentials

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Admin | admin@ephraimcare.com.au | EphraimAdmin2026! | Admin portal testing |
| Worker | worker@ephraimcare.com.au | EphraimWorker2026! | Mobile app & worker features |
| Participant | client@ephraimcare.com.au | EphraimClient2026! | Participant portal testing |

#### Step 5a: Create Users in Supabase Auth

1. Go to Supabase → **Authentication → Users**
2. Click **"Add User"** → **"Create new user"**
3. Create each user with the credentials above
4. **Copy the User ID (UUID)** for each user — you'll need it for the SQL below

#### Step 5b: Run SQL to Create Profiles

Go to Supabase → **SQL Editor** and run the following (replace UUIDs with actual values):

```sql
-- ============================================
-- TEST ACCOUNT SETUP
-- ============================================
-- Replace [ADMIN_USER_ID], [WORKER_USER_ID] with the UUIDs
-- from Supabase Authentication after creating users.
-- ============================================

-- Ensure organization exists (idempotent)
INSERT INTO public.organizations (id, name, abn)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Ephraim Care', '12345678901')
ON CONFLICT (id) DO NOTHING;

-- Admin Profile
INSERT INTO public.profiles (id, role, first_name, last_name, email, organization_id)
VALUES (
  '[ADMIN_USER_ID]',  -- ← Replace with UUID from Supabase Auth
  'admin',
  'Admin',
  'Test',
  'admin@ephraimcare.com.au',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
);

-- Worker Profile
INSERT INTO public.profiles (id, role, first_name, last_name, email, organization_id)
VALUES (
  '[WORKER_USER_ID]',  -- ← Replace with UUID from Supabase Auth
  'worker',
  'Worker',
  'Test',
  'worker@ephraimcare.com.au',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
);

-- Worker Record (for shift assignments)
INSERT INTO public.workers (profile_id, employee_id, qualification, services_provided, hourly_rate, organization_id)
VALUES (
  '[WORKER_USER_ID]',  -- ← Same UUID as above
  'EMP-TEST',
  ARRAY['Cert III Individual Support', 'First Aid'],
  ARRAY['Personal Care', 'Community Access'],
  45.00,
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
);

-- Test Participant (for booking shifts)
INSERT INTO public.participants (ndis_number, first_name, last_name, email, phone, organization_id)
VALUES (
  '431999999',
  'Client',
  'Test',
  'client@ephraimcare.com.au',
  '0400000000',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
);
```

#### Step 5c: Verify Login

Test each account:
- **Admin**: Go to `admin.ephraimcare.com.au` → Login
- **Worker**: Open Expo Go app → Login
- **Participant**: Go to `portal.ephraimcare.com.au` → Login

---

## Support Type Rates to Configure

Go to **Admin Portal → Settings → Support Type Rates** and add:

| Support Type | Suggested Rate | NDIS Code |
|--------------|----------------|-----------|
| Personal Care | $65.47/hour | 01_011_0107_1_1 |
| Community Access | $67.56/hour | 04_102_0125_6_1 |
| Respite | $65.47/hour | 01_039_0115_1_1 |
| Domestic Assistance | $53.86/hour | 01_019_0120_1_1 |
| Transport | $0.97/km | 04_104_0125_6_1 |

(Check current NDIS price guide for accurate rates)

---

## Public Holidays to Add

Go to **Admin Portal → Settings → Public Holidays** and add for 2026:

| Date | Holiday |
|------|---------|
| 2026-01-01 | New Year's Day |
| 2026-01-26 | Australia Day (observed) |
| 2026-04-03 | Good Friday |
| 2026-04-04 | Easter Saturday |
| 2026-04-06 | Easter Monday |
| 2026-04-25 | ANZAC Day |
| 2026-06-08 | Queen's Birthday (NSW) |
| 2026-12-25 | Christmas Day |
| 2026-12-26 | Boxing Day |
| 2026-12-28 | Boxing Day (observed) |

---

## Monthly Costs Estimate

| Service | Free Tier | Estimated Use | Monthly Cost |
|---------|-----------|---------------|--------------|
| Supabase | 500MB DB, 1GB storage | Light use | $0 |
| Vercel | 100GB bandwidth | ~5GB | $0 |
| Resend | 3,000 emails | ~500 emails | $0 |
| Twilio | — | ~200 SMS | ~$10 |
| **Total** | | | **~$10/month** |

If you grow beyond free tiers:
- Supabase Pro: $25/month
- Vercel Pro: $20/month

---

## Getting Help

- **Technical Issues:** Contact OpBros.ai at contact@opbros.online
- **GitHub Issues:** Open an issue on the repository
- **Documentation:** See README.md for detailed setup instructions

---

## What's Included

| Deliverable | Location |
|-------------|----------|
| Admin Portal Source | `apps/admin/` |
| Participant Portal Source | `apps/participant/` |
| Worker Mobile App Source | `apps/worker-mobile/` |
| Database Migrations | `supabase/migrations/` |
| Shared Components | `packages/ui/` |
| Shared Utilities | `packages/utils/` |
| Project Documentation | `.planning/` |
| This Summary | `CLIENT_DELIVERY_SUMMARY.md` |
| Setup Guide | `README.md` |

---

---

## Known Issues & Improvements

### Must Fix Before Production

| Issue | Location | Fix Required |
|-------|----------|--------------|
| Demo email domain | `apps/admin/app/api/workers/invite/route.ts:110` | Change `onboarding@resend.dev` to your verified Resend domain |
| Hardcoded admin email | `apps/admin/lib/notifications/send-email.ts:20` | Move to `ADMIN_EMAIL` environment variable |
| Localhost fallback | `apps/admin/app/api/workers/invite/route.ts:93` | Ensure `NEXT_PUBLIC_SITE_URL` is set in production |

### Recommended Improvements

| Improvement | Priority | Notes |
|-------------|----------|-------|
| Replace `console.log` with structured logging | Medium | 32+ files use console.log |
| Add email retry queue | Low | Currently fire-and-forget |
| Add rate limiting to API routes | Medium | Security hardening |
| Replace logo placeholder | Low | Use actual Ephraim Care logo |

### Environment Variables Required for Production

```
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://admin.ephraimcare.com.au

# Recommended
ADMIN_EMAIL=admin@ephraimcare.com.au
RESEND_API_KEY=
RESEND_FROM_EMAIL=notifications@ephraimcare.com.au

# Optional
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
XERO_CLIENT_ID=
XERO_CLIENT_SECRET=
```

---

**Delivered with ❤️ by [OpBros.ai](https://opbros.online)**

*"Powered by OpBros" — AI-powered automation for small businesses*
