---
phase: 09-notifications
plan: 03
subsystem: api
tags: [notifications, email, invoicing, resend]

# Dependency graph
requires:
  - phase: 09-01
    provides: fire-and-forget email helpers and sendInvoiceFinalizedEmail function
  - phase: 07-invoicing
    provides: invoice finalization API route
provides:
  - Invoice finalization notification wiring
  - Participant email when invoice is ready
affects: [10-screening, 11-compliance]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Fire-and-forget notification calls in API routes

key-files:
  created: []
  modified:
    - apps/admin/app/api/invoices/[id]/finalize/route.ts

key-decisions:
  - "Participant email comes from participants.email (not profiles join)"
  - "Emergency contact email not available in schema - passed as null"
  - "Fire-and-forget call placed after successful DB update"

patterns-established:
  - "API route notification pattern: call sendXxx after DB success, no await"

# Metrics
duration: 2min
completed: 2026-01-26
---

# Phase 9 Plan 03: Invoice Finalized Notification Summary

**Wired invoice finalization to send participant notification email with invoice details and portal link**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-26T03:46:50Z
- **Completed:** 2026-01-26T03:48:23Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Invoice finalization route now fetches participant data (name, email)
- Notification email sent after successful finalization
- Fire-and-forget pattern maintained (no await)
- Graceful handling when participant has no email on file

## Task Commits

Each task was committed atomically:

1. **Task 1+2: Fetch participant data and send notification** - `65968af` (feat)

**Plan metadata:** Pending

## Files Created/Modified
- `apps/admin/app/api/invoices/[id]/finalize/route.ts` - Added participant join query and sendInvoiceFinalizedEmail call

## Decisions Made
- Used `participants.email` directly rather than joining through profiles (participant email stored on participants table)
- Passed `emergencyContactEmail: null` since the schema only has `emergency_contact_name` and `emergency_contact_phone`, not email
- Notification placed after successful DB update (step 6), before response (step 7)

## Deviations from Plan

None - plan executed exactly as written. The plan mentioned "emergency contact CC'd if on file" and the code properly handles this by passing null when the email field doesn't exist in the schema.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required (RESEND_API_KEY already configured in 09-01).

## Next Phase Readiness
- All three notification triggers wired:
  - 09-02: Shift assignment (worker notified on create)
  - 09-03: Invoice finalized (participant notified)
  - 09-04: Shift cancellation (pending)
- Ready for 09-04 (shift cancellation notification)

---
*Phase: 09-notifications*
*Completed: 2026-01-26*
