---
phase: 02
plan: 02
subsystem: participant-management
tags: [tanstack-query, data-table, supabase, react, next.js]
dependency-graph:
  requires: [02-01, 02-03]
  provides: [participant-list-page, participant-query-hooks, participant-search]
  affects: [02-04, 02-05]
tech-stack:
  added: []
  patterns: [server-initial-fetch, client-query-revalidation, deferred-search]
key-files:
  created:
    - apps/admin/hooks/use-participants.ts
    - apps/admin/components/participants/participant-columns.tsx
    - apps/admin/components/participants/participant-search.tsx
    - apps/admin/components/participants/participant-list.tsx
  modified:
    - apps/admin/app/(protected)/participants/page.tsx
decisions:
  - Supabase .from() cast to any for update operations (postgrest-js v12 generic issue)
  - Server fetches active participants initially; client queries take over with TanStack Query
  - useDeferredValue for search debounce (React 19 pattern, no external debounce lib)
metrics:
  duration: ~5min
  completed: 2026-01-24
---

# Phase 2 Plan 2: Participant List Page Summary

**One-liner:** Participant list with DataTable, server-side initial fetch, client-side search/filter via TanStack Query hooks

## What Was Built

### Task 1: TanStack Query Hooks (use-participants.ts)
- `useParticipants({ search, status })` - List query with search/status filtering
- `useParticipant(id)` - Single participant with active NDIS plan
- `useUpdateParticipant()` - Mutation with cache invalidation (strips ndis_number)
- `useArchiveParticipant()` - Soft-delete mutation
- `useHasActiveShifts(participantId)` - Check for active shifts before archiving
- Re-exports `useCheckNdisNumber` and `useCreateParticipant` from sibling files

### Task 2: Column Definitions + Search
- `participantColumns` - Name (sortable, linked), NDIS Number (mono), Status (badge)
- `ParticipantSearch` - Input with search icon + status select dropdown

### Task 3: List Page
- `ParticipantList` - Client component with deferred search, status filter, skeleton loading
- `page.tsx` - Server component with initial data fetch, header with count, Add Participant button

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Server initial fetch + client TanStack Query | SSR for first paint, client for interactivity |
| useDeferredValue for search | React 19 native, no debounce dependency |
| Cast supabase .from() as any for updates | postgrest-js v12 generic type issue (same pattern as 02-03) |
| Re-export hooks from use-participants.ts | Single import point for consumers while keeping dedicated files |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compilation: PASS (pnpm --filter @ephraimcare/admin typecheck)
- Next.js build: PASS (pnpm build --filter=@ephraimcare/admin)
- /participants route: 19.2 kB First Load JS

## Commits

| Hash | Message |
|------|---------|
| b8760b7 | feat(02-02): create TanStack Query hooks for participant list |
| cc68a3d | feat(02-02): create participant column definitions and search component |
| d2887f2 | feat(02-02): build participant list page with DataTable and server-side initial fetch |

## Next Phase Readiness

Plan 02-04 (Participant Detail Page) can proceed:
- Query hooks for single participant exist (`useParticipant`, `useUpdateParticipant`)
- Column definitions and list page provide navigation links to detail pages
- All CRUD hooks are in place for the detail/edit flow
