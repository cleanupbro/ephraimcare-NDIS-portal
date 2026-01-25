---
phase: 08-participant-portal
plan: 02
subsystem: ui
tags: [react, tanstack-query, supabase, date-fns, dashboard]

# Dependency graph
requires:
  - phase: 08-01
    provides: Auth layout, protected routes, Supabase client utilities
provides:
  - Participant dashboard page with budget, plan, and appointments
  - useParticipantDashboard hook for dashboard data fetching
  - Budget hero component with color thresholds
  - Plan info card with days remaining
  - Appointments card with worker names
  - Expired plan banner
affects: [08-03, 08-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TanStack Query for client-side data fetching
    - PostgREST type assertions (as any) for Supabase queries
    - maybeSingle() for optional records
    - date-fns for date formatting and calculations

key-files:
  created:
    - apps/participant/hooks/use-participant-dashboard.ts
    - apps/participant/components/dashboard/budget-hero.tsx
    - apps/participant/components/dashboard/plan-info-card.tsx
    - apps/participant/components/dashboard/appointments-card.tsx
    - apps/participant/components/dashboard/expired-plan-banner.tsx
  modified:
    - apps/participant/app/(protected)/dashboard/page.tsx

key-decisions:
  - "Budget bar color thresholds: green (<75%), amber (75-89%), red (>=90%)"
  - "90%+ budget shows inline warning with coordinator contact message"
  - "Days remaining shows amber color when <= 30 days"
  - "Upcoming appointments capped at 5 shifts"

patterns-established:
  - "Participant portal uses same TanStack Query patterns as admin"
  - "Dashboard data fetched in single query with participant/plan/shifts"

# Metrics
duration: 3min
completed: 2026-01-25
---

# Phase 8 Plan 02: Participant Dashboard Summary

**Dashboard with budget hero progress bar, plan period countdown, and upcoming appointments list for participant visibility into NDIS plan status**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-25T03:14:32Z
- **Completed:** 2026-01-25T03:17:43Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Budget hero component with large progress bar and color thresholds (green/amber/red)
- Plan info card showing plan period dates and days remaining countdown
- Appointments card showing next 5 upcoming shifts with worker names and times
- Expired plan banner with contact coordinator message
- Dashboard page composing all components in two-column layout

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useParticipantDashboard hook** - `71c656d` (feat)
2. **Task 2: Create dashboard components** - `0169e42` (feat)
3. **Task 3: Compose dashboard page** - `8283c8d` (feat)

## Files Created/Modified
- `apps/participant/hooks/use-participant-dashboard.ts` - Dashboard data fetching hook (participant, plan, shifts)
- `apps/participant/components/dashboard/budget-hero.tsx` - Large budget progress bar with color thresholds
- `apps/participant/components/dashboard/plan-info-card.tsx` - Plan period and days remaining
- `apps/participant/components/dashboard/appointments-card.tsx` - Upcoming appointments list
- `apps/participant/components/dashboard/expired-plan-banner.tsx` - Red alert banner for expired plans
- `apps/participant/app/(protected)/dashboard/page.tsx` - Dashboard page composing all components

## Decisions Made
- Budget bar uses 75%/90% thresholds (admin uses 70%/90%) - adjusted for participant-facing clarity
- Worker name flattened from nested join (workers.profiles) for simpler component interface
- 5-shift limit on upcoming appointments (matches plan specification)
- Days remaining <= 30 shows amber warning color

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - all tasks completed successfully.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dashboard complete with budget visibility, plan info, and appointments
- Ready for Plan 08-03: Invoice history page
- Ready for Plan 08-04: Shift history page

---
*Phase: 08-participant-portal*
*Completed: 2026-01-25*
