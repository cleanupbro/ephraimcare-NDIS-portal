# GEMINI PROTOCOL: EphraimCare Portal v2
*Strategic Intelligence for the Ephraim Care NDIS Portal monorepo.*

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

| Portal | URL |
|--------|-----|
| Admin | https://ephraimcare-ndis-portal-admin.vercel.app |
| Participant | https://ephraimcare-participant-portal.vercel.app |
| Worker Mobile | Expo Go (not web) |

## THINKING RULES
- **Purpose**: Analyze & strategize. Let Claude execute code.
- **Context**: Read README.md files in each folder for context.
- **Boundary**: This project is at `./` (the monorepo root)

## README MAP — Read These for Context

| README | Covers |
|--------|--------|
| `README.md` (root) | Full project overview, tech stack, features |
| `apps/admin/README.md` | Admin portal — pages, env vars, patterns |
| `apps/admin/app/api/README.md` | All API routes |
| `apps/admin/hooks/README.md` | All React Query hooks |
| `apps/admin/lib/README.md` | Business logic (invoicing, email, Xero, SMS) |
| `apps/admin/components/README.md` | All UI components by domain |
| `apps/participant/README.md` | Participant portal |
| `apps/worker-mobile/README.md` | Mobile app (Expo) |
| `packages/types/README.md` | Database + domain types |
| `packages/utils/README.md` | Shared utilities |
| `packages/ui/README.md` | UI components (shadcn/ui) |
| `packages/supabase/README.md` | Supabase client |
| `packages/config/README.md` | Shared configs |
| `CLIENT_TEST_GUIDE.md` | Client test guide with credentials |

## TECH STACK

Next.js 15 + React 19 + Tailwind v4 + Supabase + Expo 53 + TanStack Query + Zod

## KEY CONSIDERATIONS
- NDIS data sensitivity — all tables have Row Level Security
- Multi-tenant architecture — organization_id isolation
- Australian compliance: GST 10%, NDIA reporting deadlines
- Billing uses "lesser of" rule (scheduled vs actual time)
- GPS verification on worker check-in/out

## STRATEGIC LOOP
1. Read README.md in the target folder
2. Understand current state from CLIENT_TEST_GUIDE.md
3. Plan changes
4. Coordinate with Claude for execution

## CLIENT INFO
- **Client:** Meshach (Ephraim Care)
- **Type:** NDIS Provider, Liverpool NSW
- **Built by:** OpBros.ai
