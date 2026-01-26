---
phase: 09-notifications
plan: 02
subsystem: notifications
tags: [email, shifts, hooks, tanstack-query]

dependency_graph:
  requires: [09-01]
  provides: [shift-assignment-email-trigger, shift-cancellation-email-trigger]
  affects: [09-03]

tech_stack:
  added: []
  patterns: [fire-and-forget-notification, mutation-with-notification]

file_tracking:
  key_files:
    created: []
    modified:
      - apps/admin/hooks/use-create-shift.ts
      - apps/admin/hooks/use-cancel-shift.ts

decisions:
  - id: notif-data-fetch
    choice: Fetch notification data with separate query after mutation
    rationale: Keeps mutation signature unchanged, callers unaffected

metrics:
  duration: ~5 minutes
  completed: 2026-01-26
---

# Phase 09 Plan 02: Wire Shift Notifications Summary

**One-liner:** Fire-and-forget email triggers wired into shift creation and cancellation hooks.

## What Was Built

### Shift Assignment Notification (NOTF-01)
Updated `use-create-shift.ts` to send email when a shift is scheduled:
- Import `sendShiftAssignmentEmail` from `@/lib/notifications`
- Modified select query to fetch `worker.profile.email`, `worker.profile.first_name`, and participant name
- Added `CreatedShiftWithNotificationData` type for response shape
- Call notification in `onSuccess` without await (fire-and-forget)

### Shift Cancellation Notification (NOTF-02)
Updated `use-cancel-shift.ts` to send email when a shift is cancelled:
- Import `sendShiftCancellationEmail` from `@/lib/notifications`
- Fetch notification data after cancel update with separate query
- Send to worker always, participant if email on file
- Preserve existing mutation signature (`{ id: string }` return type)
- Fire-and-forget pattern (no await)

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data fetch pattern | Separate query after mutation | Keeps return type unchanged, no caller impact |
| Notification timing | In mutationFn (cancel) / onSuccess (create) | Create has data from select; cancel needs additional query |

## Deviations from Plan

None - plan executed exactly as written.

## Success Criteria Verification

- [x] use-create-shift.ts fetches worker/participant data and sends assignment email
- [x] use-cancel-shift.ts fetches notification data internally and sends cancellation email
- [x] All notification calls are fire-and-forget (no await)
- [x] Existing mutation signatures preserved (callers unaffected)
- [x] TypeScript compiles without errors

## Files Modified

| File | Changes |
|------|---------|
| `apps/admin/hooks/use-create-shift.ts` | +37/-6 lines - notification trigger on shift creation |
| `apps/admin/hooks/use-cancel-shift.ts` | +42 lines - notification trigger on shift cancellation |

## Next Phase Readiness

Plan 09-03 (Invoice Finalization Notification) can proceed:
- Notification infrastructure from 09-01 available
- Same fire-and-forget pattern established
- `sendInvoiceFinalizedEmail` function ready to wire into finalize route

---

*Phase: 09-notifications*
*Plan: 02*
*Completed: 2026-01-26*
