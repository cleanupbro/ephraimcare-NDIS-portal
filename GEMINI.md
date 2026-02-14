# GEMINI PROTOCOL: EphraimCare Portal v2
*Strategic Intelligence for the Ephraim Care NDIS Portal monorepo.*

## FIRST COMMANDS (ALWAYS)
1. Read this file — understand project structure
2. Read the relevant `README.md` in the folder you're working in
3. Check `CLIENT_TEST_GUIDE.md` for live URLs and credentials
4. **Always use github repo for pushing: https://github.com/cleanupbro/ephraimcare-NDIS-portal**

## ON EVERY SESSION START (Standard Workspace)
1. Read `AGENTS.md` and follow all rules.
2. Read every file in `memory/`
3. Read `progress.md`
4. Scan `skills/README.md` for available skills

## ON EVERY SESSION END
1. Update `progress.md` with what was done
2. Append any decisions to `memory/decisions.md`
3. Append any lessons to `memory/lessons.md`
4. Update `memory/stack.md` or `memory/deployment.md` if anything changed

## PROJECT OVERVIEW

**Ephraim Care Portal** — Full-stack NDIS disability support management system.
Monorepo: 3 apps (admin, participant, worker-mobile) + 5 shared packages.

**Location:** `/Users/shamalkrishna/Desktop/CLIENT PROJECTS/ephraimcare-portal-2026/`
**GitHub:** https://github.com/cleanupbro/ephraimcare-NDIS-portal

## LIVE URLS

| Portal | URL | Role |
|--------|-----|------|
| Admin | https://ephraimcare-ndis-portal-admin.vercel.app | admin, coordinator |
| Participant | https://ephraimcare-participant-portal.vercel.app | participant |
| Worker Mobile | Expo Go (not web) | worker |

## TEST CREDENTIALS

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ephraimcare.com.au | EphraimAdmin2026 |
| Coordinator | sarah@ephraimcare.com.au | EphraimCoord2026 |
| Worker | james@ephraimcare.com.au | EphraimWorker2026 |
| Participant | client@ephraimcare.com.au | EphraimClient2026 |

## THINKING RULES
- **Purpose**: Analyze & strategize. Let Claude execute code.
- **Context**: Read README.md files in each folder for context.
- **Boundary**: This project is at `./` (the monorepo root)

## README MAP — Read These for Context

Every major folder has a README.md. Read these instead of scanning files:

| README | Covers |
|--------|--------|
| `README.md` (root) | Full project overview, tech stack, features |
| `apps/admin/README.md` | Admin portal — all pages, env vars, patterns |
| `apps/admin/app/api/README.md` | All 20+ API routes |
| `apps/admin/hooks/README.md` | All 25 React Query hooks |
| `apps/admin/lib/README.md` | Business logic (invoicing, email, Xero, SMS) |
| `apps/admin/components/README.md` | All 58+ UI components by domain |
| `apps/participant/README.md` | Participant portal — pages, hooks, components |
| `apps/worker-mobile/README.md` | Mobile app — screens, GPS, dependencies |
| `packages/types/README.md` | Database + domain types |
| `packages/utils/README.md` | Shared utilities |
| `packages/ui/README.md` | UI components (shadcn/ui) |
| `packages/supabase/README.md` | Supabase client |
| `packages/config/README.md` | Shared configs |
| `CLIENT_TEST_GUIDE.md` | Client test guide with credentials |
| `HANDOVER.md` | Full client handover document |

## TECH STACK

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15.5.10, React 19, Tailwind CSS v4, shadcn/ui |
| Mobile | Expo 53, React Native 0.79, React Native Paper |
| Database | Supabase PostgreSQL + Auth + RLS |
| State | TanStack React Query v5 + Zustand |
| Validation | Zod + React Hook Form |
| Email | Resend API |
| SMS | Twilio (not yet configured) |
| Accounting | Xero OAuth2 (not yet configured) |
| Deploy | Vercel (web), EAS (mobile) |

## KEY CONSIDERATIONS
- NDIS data sensitivity — all tables have Row Level Security
- Multi-tenant architecture — organization_id isolation
- Australian compliance: GST 10%, NDIA reporting deadlines
- Billing uses "lesser of" rule (scheduled vs actual time)
- GPS verification on worker check-in/out
- 8-hour session auto-timeout for security
- Gapless invoice numbering (required by ATO)

## KEY FILES (Quick Reference)

| What | File |
|------|------|
| Worker invite + email | `apps/admin/app/api/workers/invite/route.ts` |
| Email sender config | `apps/admin/lib/notifications/send-email.ts` |
| Invoice calculations | `apps/admin/lib/invoices/calculations.ts` |
| NDIA CSV export | `apps/admin/lib/ndia/generate-claim-csv.ts` |
| Database types | `packages/types/src/database.ts` |
| Domain types | `packages/types/src/domain.ts` |
| Shared constants | `packages/utils/src/constants.ts` |
| Date utilities | `packages/utils/src/dates.ts` |
| Auth middleware | `apps/admin/lib/supabase/middleware.ts` |

## SUPABASE

- **Project:** vkjxqvfzhiglpqvlehsk
- **Region:** Sydney, Australia
- **URL:** https://vkjxqvfzhiglpqvlehsk.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/vkjxqvfzhiglpqvlehsk

## STRATEGIC LOOP
1. Read README.md in the target folder
2. Understand current state from CLIENT_TEST_GUIDE.md
3. Plan changes
4. Coordinate with Claude for execution

## PROJECT STATUS — HANDOVER READY

**Status:** HANDOVER READY (verified Feb 15, 2026)

| Item | Status |
|------|--------|
| Admin Portal (11 pages) | LIVE, all pages verified |
| Participant Portal (4 pages) | LIVE, all pages verified |
| Worker Mobile App | Built, testing via Expo Go |
| All known bugs | FIXED |
| Documentation | Complete — HANDOVER.md, CLIENT_TEST_GUIDE.md, all READMEs |
| Memory files | Filled with real data |

**Not yet configured (optional):**
- Twilio SMS integration
- Xero accounting sync
- App store publishing for worker mobile

## CLIENT INFO
- **Client:** Meshach (Ephraim Care)
- **Type:** NDIS Provider, Liverpool NSW
- **Website:** https://ephraimcare.com.au
- **Built by:** OpBros.ai (Shamal + Hafsah)
