---
phase: 03-worker-management
plan: 02
subsystem: admin-ui
tags: [datatable, tanstack-query, search, filter, compliance]
dependency-graph:
  requires: [03-01]
  provides: [worker-list-page, worker-search, worker-columns]
  affects: [03-03, 03-04, 03-05]
tech-stack:
  added: []
  patterns: [server-initial-fetch-client-query, useDeferredValue-search, compliance-traffic-light]
key-files:
  created:
    - apps/admin/components/workers/worker-columns.tsx
    - apps/admin/components/workers/worker-search.tsx
    - apps/admin/components/workers/worker-list.tsx
    - apps/admin/hooks/use-workers.ts
  modified:
    - apps/admin/app/(protected)/workers/page.tsx
decisions:
  - "Add Worker button in search bar (not page header) for consistency with filter controls"
  - "Client-side search filter (not PostgREST) due to profile join requirement"
  - "Status filter uses active/inactive/all (not active/archived) matching worker domain language"
metrics:
  duration: 2m 28s
  completed: 2026-01-24
---

# Phase 3 Plan 02: Worker List Page Summary

**One-liner:** DataTable-based worker list with name/email search, active/inactive status filter, compliance traffic light dots, and support type badges.

## What Was Built

### Worker Column Definitions (worker-columns.tsx)
- 6 columns: Name (sortable, linked), Email (truncated), Support Types (badges with +N overflow), Status (compliance dot), Hours This Week (placeholder), Actions (dropdown)
- Compliance traffic light using `getOverallComplianceStatus` from constants
- Color-coded 10px dot: green (valid), amber (expiring), red (expired), gray (not set)
- Title attribute on dot showing status text

### Worker Search Bar (worker-search.tsx)
- Search input with icon, placeholder "Search by name or email..."
- Status select: Active (default), Inactive, All
- "Add Worker" button linking to /workers/new

### Worker List Component (worker-list.tsx)
- Client component receiving initialData from server
- useDeferredValue for debounced search
- useWorkers hook for client-side queries
- Skeleton loading state, DataTable rendering

### Query Hook (use-workers.ts)
- TanStack Query with queryKey: ['workers', { search, status }]
- Supabase query with `profiles!inner` join (first_name, last_name, email, phone)
- Server-side status filter via `.eq('is_active', ...)`
- Client-side name/email search filter on returned data
- 30s staleTime

### Server Page (workers/page.tsx)
- Server-side initial fetch with profile join, active filter
- Type assertion pattern matching participant page
- Metadata: "Workers | Ephraim Care"
- Active worker count in description

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Client-side search (not PostgREST ilike) | Profile join means search on joined fields not supported by PostgREST `.or()` on foreign table |
| Status: active/inactive/all | Workers use "inactive" terminology (not "archived" like participants) |
| Add Worker in search bar | Keeps action close to filter controls, follows clean layout |
| Support type badges capped at 2 | Prevents table row height blow-up with many services |
| Hours This Week as placeholder | Shift data not available until Phase 4 |

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| e25b710 | feat(03-02): add worker DataTable column definitions with compliance dot |
| d1a5b56 | feat(03-02): add worker search, list component, and query hook |
| 7f585f5 | feat(03-02): add worker list server page with initial data fetch |

## Verification

1. /workers page loads with "Workers" heading and DataTable - PASS
2. Table shows Name, Email, Support Types, Status (dot), Hours This Week, Actions - PASS
3. Search filters by name or email (client-side) - PASS
4. Status dropdown filters by active/inactive/all - PASS
5. Compliance dot uses getOverallComplianceStatus with correct colors - PASS
6. "Add Worker" button links to /workers/new - PASS

## Next Phase Readiness

- Worker list page complete for navigation
- Detail page (03-04) can link from Name column and View action
- Create form (03-03) can link from Add Worker button
- Edit (03-05) can link from Edit action in dropdown
