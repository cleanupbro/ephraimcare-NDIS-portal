# Ephraim Care NDIS Platform

A **free, open-source** NDIS (National Disability Insurance Scheme) management platform for disability service providers in Australia. Built with Next.js 14, React Native/Expo, and Supabase.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)
![Expo](https://img.shields.io/badge/Expo-SDK_53-white.svg)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)

> **Originally built for [Ephraim Care](https://ephraimcare.com.au)** — NDIS provider in Western Sydney, Australia
>
> **Delivered by [OpBros.ai](https://opbros.online)** — AI-powered automation solutions

---

## What Can This Platform Do?

- 📋 **Manage participants** with NDIS plan tracking and budget monitoring
- 👷 **Manage workers** with compliance tracking (NDIS Worker Check, WWCC expiry)
- 📅 **Schedule shifts** with conflict detection, calendar views, and bulk creation
- 📱 **Mobile app for workers** with GPS check-in/out, offline support, and biometric auth
- 💰 **Generate invoices** with NDIS-compliant billing (lesser-of rule, PACE CSV export)
- 📊 **Run reports** on budget, revenue, hours, and activity with CSV/Excel/PDF export
- 🏢 **Multi-organization support** for agencies managing multiple NDIS providers
- 📧 **Email & SMS notifications** for shift assignments and reminders
- 🔗 **Xero integration** for accounting sync

---

## Quick Start

### Prerequisites

- **Node.js 18+** and **pnpm** (we use pnpm workspaces)
- **Supabase account** (free tier works for development)
- **Expo Go app** on your phone (for mobile testing)

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ephraimcare-portal.git
cd ephraimcare-portal
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings > API** and copy your:
   - Project URL (e.g., `https://abc123.supabase.co`)
   - Anon public key
   - Service role key (keep this secret!)

3. Run the database migrations:
   ```bash
   # Option A: Using Supabase CLI
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push

   # Option B: Manually via SQL Editor
   # Copy each file from supabase/migrations/ into the Supabase SQL Editor
   # and run them in numerical order (001, 002, 003...)
   ```

### Step 4: Configure Environment Variables

Create `.env.local` files in each app:

**apps/admin/.env.local:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional: Email notifications
RESEND_API_KEY=re_xxxxxxxxxxxx

# Optional: SMS notifications
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Optional: Xero integration
XERO_CLIENT_ID=your_client_id
XERO_CLIENT_SECRET=your_client_secret
```

**apps/participant/.env.local:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**apps/worker-mobile/.env:**
```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 5: Run the Development Servers

```bash
# Start all apps at once
pnpm dev

# Or start individually:
pnpm --filter admin dev          # Admin portal at http://localhost:3000
pnpm --filter participant dev    # Participant portal at http://localhost:3001
pnpm --filter worker-mobile start # Mobile app via Expo Go
```

### Step 6: Seed Demo Data (Optional)

```bash
pnpm --filter admin db:seed
```

Creates 5 participants, 5 workers, 20 shifts, and 2 invoices for testing.

---

## Project Structure

```
ephraimcare-portal/
├── apps/
│   ├── admin/              # Next.js 14 admin portal
│   │   ├── app/            # App Router pages
│   │   ├── components/     # UI components
│   │   ├── hooks/          # React Query hooks
│   │   └── lib/            # Utilities and constants
│   ├── participant/        # Next.js 14 participant portal
│   │   └── app/            # Dashboard, invoices, profile
│   └── worker-mobile/      # Expo SDK 53 React Native app
│       ├── app/            # Expo Router screens
│       ├── components/     # Mobile UI components
│       └── lib/            # Offline sync, GPS, biometrics
├── packages/
│   ├── types/              # Shared TypeScript types
│   ├── supabase/           # Supabase client configuration
│   ├── ui/                 # Shared UI components (shadcn/ui)
│   ├── utils/              # Shared utilities and validators
│   └── config/             # Shared ESLint, TypeScript config
├── supabase/
│   └── migrations/         # 15+ SQL migration files
└── .planning/              # Project documentation
    ├── PROJECT.md          # Requirements and decisions
    ├── STATE.md            # Current progress
    └── milestones/         # Archived milestone records
```

---

## Features by App

### Admin Portal (apps/admin)

| Page | Features |
|------|----------|
| **Dashboard** | Shift overview, compliance widget, quick actions |
| **Participants** | List, create (multi-step form), edit, archive, budget tracking |
| **Workers** | List, create with invite email, compliance status, resend invites |
| **Shifts** | List (grouped by day), calendar view, create, edit, cancel, bulk create |
| **Case Notes** | Review notes by participant, filter by worker/date, admin comments |
| **Invoices** | Generate from shifts, preview, finalize, PDF export, PACE CSV |
| **Incidents** | Report incidents, NDIA notification workflow, severity tracking |
| **Compliance** | Health score dashboard, expiring checks, documentation status |
| **Reports** | Budget utilization, revenue trends, worker hours, activity reports |
| **Settings** | Support type rates, public holidays, Xero connection, SMS setup |

### Participant Portal (apps/participant)

| Page | Features |
|------|----------|
| **Dashboard** | Budget progress bar, plan info, days remaining, alerts |
| **Appointments** | Upcoming shifts with worker name and time |
| **Invoices** | View finalized invoices, download as PDF |
| **Profile** | Personal information (read-only), logout |

### Worker Mobile App (apps/worker-mobile)

| Screen | Features |
|--------|----------|
| **Login** | Email/password, biometric auth (Face ID/Touch ID) |
| **Home** | Today's shifts, quick check-in, active timer |
| **Shift Detail** | Participant info, medical alerts, GPS check-in/out |
| **Live Timer** | Elapsed time during shift, check-out button |
| **Case Notes** | Add note after checkout, edit within 24h |
| **Schedule** | Weekly calendar, upcoming shifts |
| **My Notes** | Pending notes badge, submitted notes list |
| **Profile** | Personal info, logout |

**Offline Features:**
- Cached shift data for 24 hours
- Offline check-in/out with sync queue
- Photo capture with local storage
- Automatic sync on reconnection

---

## API Keys & Services

### Required (Free Tier Available)

| Service | Purpose | Sign Up |
|---------|---------|---------|
| **Supabase** | Database, Auth, Storage, RLS | [supabase.com](https://supabase.com) |

### Optional (For Full Functionality)

| Service | Purpose | Sign Up | Notes |
|---------|---------|---------|-------|
| **Resend** | Email notifications | [resend.com](https://resend.com) | 3,000 emails/month free |
| **Twilio** | SMS shift reminders | [twilio.com](https://twilio.com) | Pay-as-you-go |
| **Xero** | Accounting sync | [developer.xero.com](https://developer.xero.com) | OAuth2 app required |

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `organizations` | Multi-tenant org data, API credentials |
| `profiles` | User accounts with role (admin, coordinator, worker, participant) |
| `participants` | Participant records with NDIS number, contacts |
| `ndis_plans` | Plan details (budget, start/end dates) |
| `plan_budgets` | Budget allocations by support category |
| `workers` | Worker profiles with compliance dates |
| `shifts` | Scheduled shifts with status tracking |
| `shift_check_ins` | GPS location and timestamps |
| `case_notes` | Worker documentation after shifts |
| `case_note_admin_comments` | Private admin comments |
| `invoices` | Invoice headers with totals |
| `invoice_line_items` | Shift-based billing lines |
| `invoice_counter` | Gapless sequential numbering |
| `support_type_rates` | Configurable hourly rates |
| `public_holidays` | Holiday calendar for rate adjustments |
| `incidents` | Incident reports with NDIA workflow |
| `participant_goals` | Goal tracking with progress notes |

### Security

- **Row Level Security (RLS)** on all tables
- Organization-level data isolation
- Participant-only access to own data
- Worker-only access to assigned shifts

---

## Key Business Rules

| Rule | Implementation |
|------|---------------|
| **Billing calculation** | Lesser of scheduled vs actual duration |
| **GST** | Always 10% on all invoices (Australian requirement) |
| **Invoice numbering** | Gapless sequential: INV-2026-001, INV-2026-002... |
| **Shift conflicts** | Warning with override (workers can do back-to-back) |
| **Plan validity** | Warning if outside plan dates (plans get extended) |
| **Auto-checkout** | 30 minutes after scheduled end (pg_cron job) |
| **Case notes** | Internal only — not visible to participants |
| **Support type mismatch** | Hard error if worker not qualified |
| **Screening expiry** | Block if expired, warn if within 90 days |

---

## Customization

### Branding

Update colors in these files:

```typescript
// apps/admin/app/globals.css - CSS variables
:root {
  --primary: #66BB6A;  // Green
  --accent: #00BFA5;   // Teal
}

// apps/admin/components/pdf/pdf-styles.ts - PDF export
const BRAND = {
  primaryColor: '#66BB6A',
  accentColor: '#00BFA5',
}

// apps/worker-mobile/constants/colors.ts - Mobile app
export const COLORS = {
  primary: '#66BB6A',
  accent: '#00BFA5',
}
```

### Support Types

Edit `packages/utils/src/constants.ts`:

```typescript
export const SUPPORT_TYPES = [
  'personal_care',
  'community_access',
  'respite',
  'domestic_assistance',
  'transport',
  // Add your support types...
] as const
```

### Rates & Holidays

Configure in the admin portal:
- **Settings > Support Type Rates** — Hourly rates by support type
- **Settings > Public Holidays** — Holiday dates for rate adjustments

---

## Deployment

### Vercel (Web Apps)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy admin portal
cd apps/admin
vercel --prod

# Deploy participant portal
cd apps/participant
vercel --prod
```

Set environment variables in Vercel dashboard for each project.

### Expo (Mobile App)

**For testing (Expo Go):**
```bash
cd apps/worker-mobile
npx expo start
# Scan QR code with Expo Go app
```

**For production (App Store / Play Store):**
```bash
# Requires Apple/Google developer accounts
npx expo build:ios
npx expo build:android
```

---

## Contributing

This is now **open-source** and contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

- TypeScript strict mode
- ESLint + Prettier for code style
- TanStack Query for server state
- Zod for validation
- shadcn/ui components

---

## License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

You are free to:
- Use this commercially
- Modify and distribute
- Use privately

Just keep the attribution.

---

## Credits

- **Originally built for:** [Ephraim Care](https://ephraimcare.com.au)
- **Developed by:** [OpBros.ai](https://opbros.online)
- **Built with:** [Claude Code](https://claude.ai/code) + GSD Workflow

---

**"Powered by OpBros"** — If you use this project, we'd appreciate keeping the footer link!

## Support

- **Issues:** Open a GitHub issue for bugs or feature requests
- **Discussions:** Use GitHub Discussions for questions
- **Email:** contact@opbros.online

---

*This project was built in 4 days using Claude Code and the GSD (Get Shit Done) workflow — 13 phases, 77 plans, ~36,649 lines of TypeScript.*
