---
phase: 12-reporting-and-export
plan: 04
subsystem: ui
tags: [reports, tanstack-query, supabase, csv-export, date-fns]

# Dependency graph
requires:
  - phase: 12-01
    provides: ReportLayout, DateRangePicker, CSV export helpers, report types
  - phase: 04-shift-scheduling
    provides: shifts table with worker_id and participant_id
provides:
  - useWorkerHoursReport hook for aggregating completed shifts by worker
  - useParticipantActivityReport hook for aggregating by participant with last shift date
  - Worker hours report page with table and summary statistics
  - Participant activity report page with table and summary statistics
affects: [future payroll workflows, participant engagement tracking]

# Tech tracking
tech-stack:
  added: []
  patterns: [report hooks with totals calculation, entity filter dropdown pattern]

key-files:
  created:
    - apps/admin/hooks/use-worker-hours-report.ts
    - apps/admin/hooks/use-participant-activity-report.ts
    - apps/admin/app/(protected)/reports/worker-hours/page.tsx
    - apps/admin/app/(protected)/reports/participant-activity/page.tsx
  modified:
    - apps/admin/lib/reports/csv-export.ts

key-decisions:
  - "Report hooks return both data array and totals object for summary cards"
  - "Entity filter uses 'all' placeholder value, converted to undefined for query"
  - "Last shift date tracked for participant engagement visibility"
  - "Hours calculated from actual times if available, else scheduled times"

patterns-established:
  - "Report hook returns { data: Row[], totals: { ... } } structure"
  - "Filter dropdown with 'All' option maps to undefined/empty for query"
  - "Sort report data by most relevant metric (hours for workers, shifts for participants)"

# Metrics
duration: 3min
completed: 2026-01-27
---

# Phase 12 Plan 04: Worker Hours and Participant Activity Reports Summary

**Built worker hours and participant activity reports with per-entity shift statistics, date range filtering, entity dropdowns, and CSV export**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-26T13:39:06Z
- **Completed:** 2026-01-26T13:41:40Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Created useWorkerHoursReport hook aggregating completed shifts by worker with shift count, total hours, and average hours per shift
- Created useParticipantActivityReport hook aggregating by participant with shift count, total hours, and last shift date
- Built worker hours report page with summary cards and filterable table
- Built participant activity report page with participant engagement tracking via last shift date
- Fixed generateCsv TypeScript constraint to support typed interfaces

## Task Commits

Each task was committed atomically:

1. **Task 1: Create worker hours and participant activity hooks** - `5698712` (feat)
2. **Task 2: Create worker hours report page** - `b083adc` (feat)
3. **Task 3: Create participant activity report page** - `5dc81a3` (feat)

## Files Created/Modified
- `apps/admin/hooks/use-worker-hours-report.ts` - Aggregates completed shifts by worker (140 lines)
- `apps/admin/hooks/use-participant-activity-report.ts` - Aggregates by participant with last shift date (146 lines)
- `apps/admin/app/(protected)/reports/worker-hours/page.tsx` - Worker hours table with summary stats (136 lines)
- `apps/admin/app/(protected)/reports/participant-activity/page.tsx` - Participant activity table with last shift date (146 lines)
- `apps/admin/lib/reports/csv-export.ts` - Fixed type constraint for generateCsv

## Decisions Made
- Report hooks return `{ data, totals }` structure for unified consumption by layout and export
- Worker filter dropdown uses `useWorkers({ status: 'all' })` to include inactive workers in report
- Participant filter uses `useParticipants({ status: 'all' })` for similar reason
- Hours calculated from actual_start/actual_end when available, falling back to scheduled times
- Worker hours sorted by totalHours descending (most active workers first)
- Participant activity sorted by shiftCount descending (most engaged participants first)
- Last shift date displayed with date-fns formatting for readability

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed generateCsv TypeScript type constraint**
- **Found during:** Task 2 (worker hours report page verification)
- **Issue:** `T extends Record<string, unknown>` required index signature, typed interfaces don't have one
- **Fix:** Changed to `T extends object` which accepts any object type
- **Files modified:** apps/admin/lib/reports/csv-export.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** `5794005`

---

**Total deviations:** 1 auto-fixed (blocking)
**Impact on plan:** Fix was necessary for TypeScript to compile. No scope creep.

## Issues Encountered

None beyond the auto-fixed TypeScript issue.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Worker hours and participant activity reports ready for production
- Both reports accessible from /reports landing page
- CSV export functional for both reports
- Ready for potential Excel/PDF export additions in future

---
*Phase: 12-reporting-and-export*
*Completed: 2026-01-27*
