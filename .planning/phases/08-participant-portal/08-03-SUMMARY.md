---
phase: 08-participant-portal
plan: 03
subsystem: ui
tags: [react-pdf, invoices, pdf, participant-portal, tanstack-query]

# Dependency graph
requires:
  - phase: 08-01
    provides: Auth + protected layout for participant portal
  - phase: 07
    provides: Invoice generation, InvoicePDF component pattern
provides:
  - Participant invoice list with hooks
  - Invoice preview modal with line items
  - Participant-scoped PDF download API
  - Invoices page with empty state
affects: [08-04, 08-05]

# Tech tracking
tech-stack:
  added: ["@react-pdf/renderer (participant app)"]
  patterns:
    - "Participant hooks exclude drafts (neq status draft)"
    - "PDF route checks participant role before access"

key-files:
  created:
    - apps/participant/hooks/use-participant-invoices.ts
    - apps/participant/components/invoices/invoice-table.tsx
    - apps/participant/components/invoices/invoice-preview-modal.tsx
    - apps/participant/app/(protected)/invoices/page.tsx
    - apps/participant/app/api/invoices/[id]/pdf/route.ts
    - apps/participant/components/pdf/InvoicePDF.tsx
    - apps/participant/components/pdf/pdf-styles.ts
    - apps/participant/lib/invoices/constants.ts
    - apps/participant/lib/invoices/types.ts
    - apps/participant/lib/invoices/calculations.ts
  modified:
    - apps/participant/package.json

key-decisions:
  - "Transform billable_minutes to quantity_hours in hook for display"
  - "Copy InvoicePDF from admin (identical rendering, different access control)"
  - "PDF route verifies participant role before allowing download"

patterns-established:
  - "Participant hooks filter status != draft (participants only see finalized)"
  - "Participant API routes check profile.role = participant"

# Metrics
duration: 5min
completed: 2026-01-25
---

# Phase 8 Plan 03: Invoices Summary

**Participant invoice list with preview modal and PDF download using @react-pdf/renderer**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-25T03:14:33Z
- **Completed:** 2026-01-25T03:19:34Z
- **Tasks:** 4
- **Files modified:** 14

## Accomplishments
- Invoice list hooks filtering out draft invoices
- Interactive invoice table with clickable numbers opening preview modal
- Modal displaying line items, period, subtotal, GST, total with download button
- Participant-scoped PDF download API with role verification
- Empty state showing friendly message when no invoices exist

## Task Commits

Each task was committed atomically:

1. **Task 1: Create invoice hooks** - `9866903` (feat)
2. **Task 2: Create invoice table and preview modal** - `a7f1cfc` (feat)
3. **Task 3: Create PDF route and component** - `d58e5a6` (feat)
4. **Task 4: Create invoices page** - `00d3587` (feat)

## Files Created/Modified

### Created
- `apps/participant/hooks/use-participant-invoices.ts` - useParticipantInvoices and useParticipantInvoice hooks
- `apps/participant/components/invoices/invoice-table.tsx` - Invoice list table with clickable numbers
- `apps/participant/components/invoices/invoice-preview-modal.tsx` - Modal with line items and download
- `apps/participant/app/(protected)/invoices/page.tsx` - Invoices page with loading/error states
- `apps/participant/app/api/invoices/[id]/pdf/route.ts` - PDF download endpoint
- `apps/participant/components/pdf/InvoicePDF.tsx` - PDF document component
- `apps/participant/components/pdf/pdf-styles.ts` - PDF styles with brand colors
- `apps/participant/lib/invoices/constants.ts` - Ephraim Care business details
- `apps/participant/lib/invoices/types.ts` - Invoice TypeScript types
- `apps/participant/lib/invoices/calculations.ts` - formatHours helper
- `apps/participant/public/fonts/Inter-*.ttf` - PDF fonts

### Modified
- `apps/participant/package.json` - Added @react-pdf/renderer dependency

## Decisions Made
- **Transform minutes to hours in hook:** billable_minutes converted to quantity_hours for display in modal (60 min = 1.00 hr)
- **Copy InvoicePDF from admin:** Identical component (same branding, same layout), different access control in route
- **Participant role check in PDF route:** Explicit profile.role === 'participant' check in addition to RLS

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Invoices page complete with full CRUD-Read functionality
- Ready for shifts page (plan 08-04) and services page (plan 08-05)
- Invoice viewing tested via typecheck; manual verification at localhost:3001/invoices

---
*Phase: 08-participant-portal*
*Completed: 2026-01-25*
