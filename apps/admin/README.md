# Admin Portal — `@ephraimcare/admin`

Next.js 15 web application for Ephraim Care administrators and coordinators.

**Live URL:** https://ephraimcare-ndis-portal-admin.vercel.app
**Dev port:** 3000

## Structure

```
apps/admin/
├── app/
│   ├── (auth)/               → Login, register, reset-password (public)
│   ├── (protected)/          → All authenticated routes (see below)
│   ├── api/                  → API routes (see api/README.md)
│   └── layout.tsx            → Root layout (QueryProvider, Toaster, favicon)
├── components/               → UI components by domain (see components/README.md)
├── hooks/                    → Custom React Query hooks (see hooks/README.md)
├── lib/                      → Business logic & utilities (see lib/README.md)
├── providers/                → React context providers
└── public/                   → Static assets (favicon.ico, favicon.svg, fonts, images)
```

## Pages (Protected Routes)

| Route | Description |
|-------|-------------|
| `/` | Dashboard — compliance score, upcoming shifts, revenue widget |
| `/participants` | Participant list with search/filter |
| `/participants/[id]` | Participant detail (tabs: info, case notes, goals, budget) |
| `/participants/new` | 4-step participant creation wizard |
| `/workers` | Worker list with compliance status indicators |
| `/workers/[id]` | Worker detail (info, compliance, stats) |
| `/workers/new` | Worker invite form (creates auth user + sends email) |
| `/shifts` | Shift list view with date/status filters |
| `/shifts/calendar` | Calendar grid view of shifts |
| `/shifts/new` | Create shift (participant, worker, time, service type) |
| `/shifts/bulk` | Bulk shift creation wizard |
| `/shifts/recurring` | Recurring shift templates |
| `/invoices` | Invoice list with status filters |
| `/invoices/[id]` | Invoice detail with line items |
| `/invoices/generate` | Generate invoice from completed shifts |
| `/invoices/ndia-export` | Export NDIA-format CSV for claims |
| `/incidents` | Incident reports with NDIA countdown |
| `/incidents/new` | Create incident report |
| `/case-notes` | All case notes across participants |
| `/compliance` | NDIA compliance dashboard and scoring |
| `/cancellation-requests` | Shift cancellation requests from workers |
| `/reports` | Report hub (revenue, hours, budget, activity) |
| `/reports/revenue` | Revenue breakdown with charts |
| `/reports/worker-hours` | Worker hours by support type |
| `/reports/budget` | Budget utilization per participant |
| `/reports/participant-activity` | Participant activity metrics |
| `/reports/accounting-exports` | BAS/accounting format exports |
| `/settings` | Settings overview |
| `/settings/rates` | Hourly rates by support type and day type |
| `/settings/holidays` | Public holiday management (affects rates) |
| `/settings/integrations` | Xero, SMS, email integration config |

## Environment Variables

All variables from root `.env.local` plus:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Yes (prod) | Admin portal URL for magic links |
| `NEXT_PUBLIC_ADMIN_URL` | Yes (prod) | Admin portal base URL |
| `NEXT_PUBLIC_PARTICIPANT_URL` | No | Participant portal URL (for invoice emails) |
| `NEXT_PUBLIC_WORKER_APP_URL` | No | Worker app URL (for shift assignment emails) |
| `RESEND_FROM_EMAIL` | Recommended | Email sender address |
| `ADMIN_EMAIL` | Recommended | Admin CC email for notifications |

## Key Patterns

- **Auth:** Supabase SSR cookies via `@supabase/ssr` middleware
- **Data fetching:** TanStack React Query hooks in `hooks/` directory
- **Forms:** Zod schemas in `lib/*/schemas.ts`, multi-step forms use Zustand stores
- **Notifications:** Fire-and-forget emails via Resend (never blocks the request)
- **Session:** 8-hour auto-timeout via `useSessionTimeout` hook
