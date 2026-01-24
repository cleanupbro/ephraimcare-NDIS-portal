# Project State: Ephraim Care

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-24)

**Core value:** Schedule shifts, track check-ins, generate invoices from actual hours worked
**Current focus:** Phase 3 in progress (Worker Management).

## Current Position

Phase: 3 of 13 (Worker Management)
Plan: 1 of 5 in current phase
Status: In progress
Last activity: 2026-01-24 -- Completed 03-01-PLAN.md (Foundation: schemas, types, migration)

Progress: [██████░░░░] 19%

## Performance Metrics

**Velocity:**
- Total plans completed: 15 (Phase 1: 9, Phase 2: 5, Phase 3: 1)
- Average duration: --
- Total execution time: --

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 9/9 | -- | -- |
| 2 | 5/5 | -- | -- |
| 3 | 1/5 | -- | -- |

**Recent Trend:**
- Last 5 plans: --
- Trend: --

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Foundation phase: RLS + audit trail + timezone handling MUST come before any feature work (cannot be retrofitted)
- Build order: Shifts before mobile, invoicing before participant portal, screening before compliance dashboard
- RLS helper functions use SECURITY DEFINER with COALESCE fallback (works without custom JWT hook enabled)
- Cookie typing uses explicit CookieToSet[] for Supabase SSR v0.6.1 compatibility
- Form schemas (apps/admin/lib/participants/schemas.ts) are separate from server schemas (packages/utils/src/validators.ts) -- stricter multi-step form validation vs basic server-side
- shadcn/ui components created manually in monorepo (CLI doesn't work well with pnpm workspaces)
- Per-step independent useForm instances (not shared FormProvider) for React 19 compatibility
- Supabase inserts use type assertions (as any) due to postgrest-js v12 Generic type resolution issue
- Dedicated hook files for form needs (use-check-ndis.ts, use-create-participant.ts) to avoid conflicts with parallel plan 02-02
- use-participants.ts re-exports from sibling hook files (single import point for consumers)
- useDeferredValue for search debounce (React 19 native pattern, no external lib)
- Server-side initial fetch + client TanStack Query for list pages (SSR first paint + client interactivity)
- Custom amber badge class for plan countdown (avoids adding variant to shared Badge component)
- plan_budgets queried with (as any) type assertion due to missing PostgREST type mapping
- Budget bar caps at 100% display even when overspent (Math.min)
- participantEditSchema omits ndis_number (separate from participantFullSchema used for creation)
- NDIS number shown as locked static text with Lock icon (not disabled input)
- Edit available for both active and archived participants; Archive only for active
- Type-to-confirm archive requires exact case-sensitive full name match
- Worker compliance stored as columns on workers table (Option B) for MVP -- only 2 check types
- 90-day threshold for compliance expiring status (industry standard)
- workerEditSchema omits email (auth identity, matches participant pattern)

### Pending Todos

- Hook consolidation complete: use-participants.ts re-exports from use-check-ndis.ts and use-create-participant.ts

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-01-24
Stopped at: Completed 03-01-PLAN.md (Foundation: schemas, types, migration)
Resume file: None

## Phase Progress

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 1 | Foundation | Complete | 9/9 |
| 2 | Participant Management | Complete | 5/5 |
| 3 | Worker Management | In progress | 1/5 |
| 4 | Shift Scheduling | Pending | 0/0 |
| 5 | Worker Mobile App | Pending | 0/0 |
| 6 | Case Notes | Pending | 0/0 |
| 7 | Invoicing | Pending | 0/0 |
| 8 | Participant Portal | Pending | 0/0 |
| 9 | Notifications | Pending | 0/0 |
| 10 | Worker Screening | Pending | 0/0 |
| 11 | Compliance and Incidents | Pending | 0/0 |
| 12 | Reporting and Export | Pending | 0/0 |
| 13 | Scale Features | Pending | 0/0 |

## Session Log

| Date | Action | Result |
|------|--------|--------|
| 2026-01-24 | Project initialized | PROJECT.md, config.json, research, REQUIREMENTS.md created |
| 2026-01-24 | Roadmap created | 13 phases, 108 requirements mapped, ROADMAP.md + STATE.md written |
| 2026-01-24 | Phase 1 built | Monorepo, migrations, auth, seed data, all pages, RLS fix |
| 2026-01-24 | Phase 1 UAT | 12/12 tests passed, no issues |
| 2026-01-24 | Phase 2 Plan 01 executed | Schemas + DataTable + 15 UI components installed |
| 2026-01-24 | Phase 2 Plan 03 executed | Multi-step form, Zustand store, NDIS check, DB types fixed |
| 2026-01-24 | Phase 2 Plan 02 executed | Participant list page, query hooks, search/filter, DataTable |
| 2026-01-24 | Phase 2 Plan 04 executed | Detail page, budget progress bar, plan countdown badge |
| 2026-01-24 | Phase 2 Plan 05 executed | Edit form (read-only NDIS), archive dialog, detail actions |
| 2026-01-24 | Phase 2 verified | 9/9 requirements verified, VERIFICATION.md created |
| 2026-01-24 | Phase 3 Plan 01 executed | Migration, Zod schemas, constants, domain types |
