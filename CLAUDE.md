# CLAUDE PROTOCOL: EphraimCare Portal v2
*Senior Engineer for the Ephraim Care NDIS Portal monorepo.*

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
Monorepo with 3 apps + 5 shared packages. Built by OpBros.ai for Ephraim Care (Liverpool, Western Sydney).

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

## PROJECT LOCATION

```
/Users/shamalkrishna/Desktop/CLIENT PROJECTS/ephraimcare-portal-2026/
```

## HOW TO NAVIGATE — README MAP

Every major folder has a README.md explaining its contents. Read these instead of scanning files:

| README | What It Covers |
|--------|---------------|
| `README.md` (root) | Full project overview, tech stack, setup, deployment |
| `apps/admin/README.md` | Admin portal — all pages, env vars, patterns |
| `apps/admin/app/api/README.md` | All 20+ API routes with descriptions |
| `apps/admin/hooks/README.md` | All 25 React Query hooks by domain |
| `apps/admin/lib/README.md` | Business logic — invoicing, notifications, Xero, SMS |
| `apps/admin/components/README.md` | All 58 components organized by domain |
| `apps/participant/README.md` | Participant portal — pages, components, hooks |
| `apps/worker-mobile/README.md` | Mobile app — screens, GPS, dependencies |
| `packages/types/README.md` | Database + domain types, regeneration |
| `packages/utils/README.md` | Date/currency utilities, constants |
| `packages/ui/README.md` | shadcn/ui components, global styles |
| `packages/supabase/README.md` | Admin client factory |
| `packages/config/README.md` | Shared ESLint + TypeScript configs |
| `CLIENT_TEST_GUIDE.md` | Client-facing test guide with all credentials |

## TECH STACK

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15.5.10, React 19, Tailwind CSS v4, shadcn/ui |
| Mobile | Expo 53, React Native 0.79, React Native Paper |
| Database | Supabase PostgreSQL + Auth + RLS |
| State | TanStack React Query + Zustand |
| Validation | Zod |
| Email | Resend API (RESEND_FROM_EMAIL env var) |
| SMS | Twilio |
| Accounting | Xero OAuth2 |
| Deploy | Vercel (web), EAS (mobile) |

## KEY FILES (Quick Reference)

| What | File |
|------|------|
| Worker invite + email | `apps/admin/app/api/workers/invite/route.ts` |
| Email sender config | `apps/admin/lib/notifications/send-email.ts` |
| Invoice calculations | `apps/admin/lib/invoices/calculations.ts` |
| Database types | `packages/types/src/database.ts` |
| Domain types | `packages/types/src/domain.ts` |
| Shared constants | `packages/utils/src/constants.ts` |
| Date utilities | `packages/utils/src/dates.ts` |
| Root layout (admin) | `apps/admin/app/layout.tsx` |
| Auth middleware | `apps/admin/lib/supabase/middleware.ts` |
| Env var template | `.env.production.example` |

## WORKFLOW

```bash
pnpm install          # Install all deps
pnpm dev              # Start all dev servers (admin:3000, participant:3001)
pnpm build            # Build all apps
pnpm turbo build --filter=@ephraimcare/admin       # Build admin only
pnpm turbo build --filter=@ephraimcare/participant  # Build participant only
pnpm db:generate-types  # Regenerate Supabase types
```

## DEPLOY

- Push to `main` → auto-deploys admin portal on Vercel
- Participant portal also auto-deploys from `main` (separate Vercel project, root: `apps/participant/`)
- Worker mobile: EAS Build

## SUPABASE

- **Project:** vkjxqvfzhiglpqvlehsk
- **URL:** https://vkjxqvfzhiglpqvlehsk.supabase.co
- **GitHub Repo:** https://github.com/cleanupbro/ephraimcare-NDIS-portal

## ENVIRONMENT VARIABLES (Production)

Required in Vercel for each project:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (admin portal URL)
- `RESEND_FROM_EMAIL` (email sender address)
- `ADMIN_EMAIL` (admin notification CC)
- `RESEND_API_KEY`

## RULES

- Read the relevant README.md before making changes
- Don't hardcode emails/URLs — use env vars
- Test builds with `pnpm turbo build --filter=@ephraimcare/<app>`
- Push to main triggers deploy — only push when ready
- All forms use Zod schemas in `lib/*/schemas.ts`
- All data fetching uses hooks in `hooks/` directory
- Emails are fire-and-forget (never block the request)

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
| Environment variables | Configured on Vercel |

**What's NOT yet configured (optional):**
- Twilio SMS integration (env vars not set)
- Xero accounting sync (OAuth not connected)
- Worker mobile app store publishing (using Expo Go for testing)

## CLIENT INFO
- **Client:** Meshach (Ephraim Care)
- **Type:** NDIS Provider, Liverpool NSW
- **Website:** https://ephraimcare.com.au
- **Built by:** OpBros.ai (Shamal + Hafsah)
