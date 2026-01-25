---
phase: 07-invoicing
plan: 05
subsystem: ui
tags: [invoice, react, tanstack-query, preview, finalize]

# Dependency graph
requires:
  - phase: 07-02
    provides: Invoice calculation utilities and constants
  - phase: 07-04
    provides: useGenerateInvoice hook (parallel plan)
provides:
  - Invoice list page with status filtering
  - Invoice detail page with professional preview
  - Finalize invoice API endpoint
  - LineItemsTable component
  - InvoicePreview component
affects: [07-06-pdf-export, 07-07-csv-export]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Client-side invoice list with TanStack Query status filter
    - Professional invoice preview with business details
    - AlertDialog confirmation for destructive actions

key-files:
  created:
    - apps/admin/app/(protected)/invoices/[id]/page.tsx
    - apps/admin/app/api/invoices/[id]/finalize/route.ts
    - apps/admin/components/invoices/InvoicePreview.tsx
    - apps/admin/components/invoices/LineItemsTable.tsx
    - apps/admin/hooks/use-invoices.ts
  modified:
    - apps/admin/app/(protected)/invoices/page.tsx

key-decisions:
  - "useInvoices hook created as blocking deviation (Rule 3) since Plan 07-04 runs in parallel"
  - "Draft watermark using absolute positioning with opacity for visual draft indicator"
  - "Finalize confirmation uses AlertDialog with explicit warning about locked state"

patterns-established:
  - "Invoice preview renders EPHRAIM_CARE_DETAILS from constants for consistent business info"
  - "Line items table shows 6 columns: Date, Service, Day Type, Hours, Rate, Total"
  - "Status-based UI: isDraft shows edit actions, isFinalized shows locked notice + download"

# Metrics
duration: 8min
completed: 2026-01-25
---

# Phase 7 Plan 5: Invoice List, Detail, and Finalize Summary

**Invoice list page with status filtering, professional preview component, and finalize API for draft-to-submitted transition**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-25T01:12:55Z
- **Completed:** 2026-01-25T01:21:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Replaced server-side invoice list page with client-side TanStack Query implementation with status filter tabs
- Created professional invoice preview component showing full business details, participant info, and line items
- Built finalize API that transitions draft invoices to submitted status with finalized_at timestamp
- Implemented locked state UI for finalized invoices (no edit/delete, download PDF button)

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace invoice list page and create finalize API** - `a6ebd99` (feat)
2. **Task 2: Create invoice detail page and preview components** - `b4175de` (feat)

## Files Created/Modified

- `apps/admin/app/(protected)/invoices/page.tsx` - Client component with TanStack Query, status filter tabs
- `apps/admin/app/(protected)/invoices/[id]/page.tsx` - Invoice detail page with Finalize/Delete actions
- `apps/admin/app/api/invoices/[id]/finalize/route.ts` - POST handler for draft to submitted transition
- `apps/admin/components/invoices/InvoicePreview.tsx` - Professional invoice preview with business details
- `apps/admin/components/invoices/LineItemsTable.tsx` - Line items table (date, service, day type, hours, rate, total)
- `apps/admin/hooks/use-invoices.ts` - useInvoices, useInvoice, useFinalizeInvoice, useDeleteInvoice hooks

## Decisions Made

- Created use-invoices.ts hook file as blocking deviation (Rule 3) since Plan 07-04 runs in parallel and hadn't created it yet
- Used absolute positioned DRAFT watermark with low opacity for clear visual indication
- Finalize action requires AlertDialog confirmation warning about locked state
- Delete draft action available but also requires confirmation dialog

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created use-invoices.ts hook file**
- **Found during:** Task 1 (Invoice list page)
- **Issue:** Plan specifies useInvoices() hook but 07-04 (running in parallel) hadn't created hooks file yet
- **Fix:** Created hooks file with useInvoices, useInvoice, useFinalizeInvoice, useDeleteInvoice
- **Files modified:** apps/admin/hooks/use-invoices.ts
- **Verification:** TypeScript compiles, hooks work correctly
- **Committed in:** a6ebd99 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Blocking deviation necessary for compilation. Plan 07-04 also modifies this file (added useGenerateInvoice).

## Issues Encountered

None - execution proceeded smoothly after creating the blocking hook file.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Invoice list and detail pages fully functional
- Finalize API ready for use
- Ready for Plan 07-06 (PDF export) - download button already wired to /api/invoices/[id]/pdf
- Ready for Plan 07-07 (CSV export)

---
*Phase: 07-invoicing*
*Completed: 2026-01-25*
