---
phase: 12-reporting-and-export
plan: 03
subsystem: ui
tags: [recharts, revenue, invoices, line-chart, csv-export, support-type]

# Dependency graph
requires:
  - phase: 12-01
    provides: recharts, ReportLayout, DateRangePicker, CSV export helpers
  - phase: 07-invoicing
    provides: invoices table with subtotal, gst, total, status fields
provides:
  - useRevenueReport hook aggregating invoices by month with support type breakdown
  - RevenueLineChart component showing monthly revenue trends
  - Revenue report page at /reports/revenue
  - Support type breakdown visualization
affects: [12-05 participant-activity, 12-06 export-formats]

# Tech tracking
tech-stack:
  added: []
  patterns: [revenue aggregation with date-fns eachMonthOfInterval, support type percentage calculation]

key-files:
  created:
    - apps/admin/hooks/use-revenue-report.ts
    - apps/admin/components/reports/charts/RevenueLineChart.tsx
    - apps/admin/app/(protected)/reports/revenue/page.tsx
  modified: []

key-decisions:
  - "6-month default view for revenue trends (better financial overview than 1 month)"
  - "Support type breakdown uses progress bars with percentage display"
  - "Months with no invoices show $0 (full date range coverage)"

patterns-established:
  - "Revenue hook generates all months in range with eachMonthOfInterval"
  - "Support type breakdown calculated from invoice_line_items join"
  - "Line chart uses teal for total revenue, violet dashed for subtotal"

# Metrics
duration: 7min
completed: 2026-01-27
---

# Phase 12 Plan 03: Revenue Trends Report Summary

**Revenue report page with line chart, support type breakdown, monthly table, and CSV export using TanStack Query aggregation**

## Performance

- **Duration:** 7 min
- **Started:** 2026-01-26T13:34:02Z
- **Completed:** 2026-01-26T13:41:31Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments
- Created useRevenueReport hook that aggregates invoices by month with support type breakdown
- Built RevenueLineChart component using Recharts with brand colors (teal/violet)
- Created revenue report page with line chart, support type card, and monthly data table
- Implemented CSV export for revenue data

## Task Commits

Each task was committed atomically:

1. **Task 1: Create revenue report data hook** - `cfcecf4` (feat)
2. **Task 2: Create revenue line chart component** - `206721f` (feat)
3. **Task 3: Create revenue report page** - `f2194f2` (feat)

## Files Created/Modified
- `apps/admin/hooks/use-revenue-report.ts` - TanStack Query hook for revenue aggregation by month, support type breakdown calculation
- `apps/admin/components/reports/charts/RevenueLineChart.tsx` - Recharts line chart with total revenue and subtotal lines
- `apps/admin/app/(protected)/reports/revenue/page.tsx` - Revenue report page with chart, support type card, monthly table, CSV export

## Decisions Made
- Defaulted to 6-month view instead of "This Month" preset (revenue trends need longer timeframe for meaningful analysis)
- Support type breakdown uses color-coded progress bars with percentage values
- Months without invoices display $0 to maintain consistent date coverage across the chart
- Excluded draft and cancelled invoices from revenue calculations

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Revenue report page fully functional at /reports/revenue
- Pattern established for support type breakdown visualization (reusable)
- Ready for Plan 12-04 (Worker Hours Report) or Plan 12-05 (Participant Activity)

---
*Phase: 12-reporting-and-export*
*Completed: 2026-01-27*
