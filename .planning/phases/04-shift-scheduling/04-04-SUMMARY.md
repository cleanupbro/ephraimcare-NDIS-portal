---
phase: 04-shift-scheduling
plan: 04
subsystem: shift-management-ui
tags: [filters, detail-sheet, inline-edit, cancel-flow, mutations]
dependency-graph:
  requires: ["04-01", "04-02", "04-03"]
  provides: ["shift-filtering", "shift-detail-view", "shift-edit", "shift-cancel"]
  affects: ["05-worker-mobile"]
tech-stack:
  added: []
  patterns: ["client-side-filtering", "inline-edit-mode", "sheet-detail-panel", "cancel-with-reason-dialog"]
key-files:
  created:
    - apps/admin/components/shifts/shift-filters.tsx
    - apps/admin/components/shifts/shift-detail-sheet.tsx
    - apps/admin/components/shifts/shift-cancel-dialog.tsx
    - apps/admin/hooks/use-update-shift.ts
    - apps/admin/hooks/use-cancel-shift.ts
  modified:
    - apps/admin/components/shifts/shift-list.tsx
decisions:
  - id: client-side-filtering
    decision: "Client-side filtering applied to useShifts result (no server-side filter params)"
    reasoning: "Week-scoped data is small enough; avoids additional API complexity"
  - id: cancelled-hidden-by-default
    decision: "Cancelled shifts excluded unless status filter explicitly set to 'cancelled'"
    reasoning: "Reduces noise in day-to-day view; admins opt-in to see cancelled"
  - id: inline-edit-pattern
    decision: "Edit mode is inline within the detail sheet (not separate page/dialog)"
    reasoning: "Minimal context switch; admin stays in list view context"
  - id: from-as-any-pattern
    decision: "PostgREST type assertion applied to .from('shifts') as any (not on data)"
    reasoning: "Matches established pattern in use-participants.ts and use-workers.ts"
metrics:
  duration: "3m 5s"
  completed: "2026-01-24"
---

# Phase 4 Plan 4: Shift Filtering, Detail Sheet, Edit & Cancel Summary

**One-liner:** Filter bar with 4 dimensions, side-panel detail sheet with inline edit, and cancel-with-reason dialog for complete shift management without page navigation.

## What Was Built

### 1. Shift Filters Component (`shift-filters.tsx`)
- Horizontal filter bar with 4 Select dropdowns: Participant, Worker, Status, Support Type
- Participant and Worker dropdowns populated from Supabase on mount
- Status dropdown puts "Cancelled" last (opt-in visibility)
- All filters work simultaneously with `ShiftFilterState` object

### 2. Shift Detail Sheet (`shift-detail-sheet.tsx`)
- Side panel (Sheet) showing full shift details (worker, type, date, time, duration, status, notes)
- View mode: read-only detail rows with formatted data
- Edit mode: inline form with worker select, date picker, time slot select, duration presets, notes textarea
- Actions section: "Edit Shift" and "Cancel Shift" buttons (hidden for completed/cancelled)
- Cancellation reason shown in view mode for cancelled shifts
- Workers fetched on-demand when entering edit mode

### 3. Cancel Dialog (`shift-cancel-dialog.tsx`)
- AlertDialog with reason textarea (validated via shiftCancelSchema)
- "Keep Shift" dismiss and "Cancel Shift" destructive action
- Reason cleared and dialog closed on successful cancellation
- Pending state shown during mutation

### 4. Update Shift Hook (`use-update-shift.ts`)
- useMutation accepting partial shift fields (worker_id, scheduled_start/end, notes)
- Recalculates scheduled_end from start + duration in the sheet
- Invalidates ['shifts'] queries on success
- Toast notifications for success/error

### 5. Cancel Shift Hook (`use-cancel-shift.ts`)
- useMutation accepting `{ cancellation_reason }`
- Sets status to 'cancelled' and stores reason
- Invalidates ['shifts'] queries on success
- Toast notifications for success/error

### 6. Updated Shift List (`shift-list.tsx`)
- Integrates ShiftFilters above week navigation
- Client-side filtering: participantId, workerId, status, supportType
- Default behavior: hides cancelled shifts (shown only when status filter = 'cancelled')
- Selected shift state drives ShiftDetailSheet open/close
- ShiftCard onClick sets selected shift

## Verification Results

| Criteria | Status |
|----------|--------|
| Filter dropdowns work independently and simultaneously | PASS |
| Cancelled shifts hidden by default, visible when status filter = 'cancelled' | PASS |
| Clicking shift card opens detail sheet on right | PASS |
| Detail sheet shows all shift fields with formatting | PASS |
| Edit button appears only for non-completed, non-cancelled | PASS |
| Inline edit saves changes and updates list | PASS |
| Cancel button opens dialog, reason changes status | PASS |
| After cancellation, shift disappears from default view | PASS |
| TypeScript compilation clean | PASS |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] PostgREST type assertion placement**
- **Found during:** Task 2
- **Issue:** `(as any)` on the update data object causes TS2345 error; the established project pattern puts `(as any)` on `.from('table')`
- **Fix:** Changed to `(supabase.from('shifts') as any).update({...})` pattern matching use-participants.ts
- **Files modified:** apps/admin/hooks/use-update-shift.ts, apps/admin/hooks/use-cancel-shift.ts
- **Commit:** 3ae446a

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Client-side filtering | Week data is small; avoids API filter complexity |
| Cancelled hidden by default | Less noise; admin opts-in |
| Inline edit in sheet | No page navigation; stays in list context |
| `from('shifts') as any` pattern | Matches established PostgREST workaround |

## Next Phase Readiness

Phase 4 (Shift Scheduling) is now complete with all 4 plans executed:
- 04-01: Data layer (migration, schemas, constants, types)
- 04-02: Shift list page (week nav, cards, grouping)
- 04-03: Create shift form (two-step, conflict detection)
- 04-04: Filtering, detail sheet, edit, cancel

Ready for Phase 5 (Worker Mobile App) which will consume shift data from the worker's perspective.
