---
phase: 04-shift-scheduling
plan: 03
subsystem: shift-creation
tags: [react-hook-form, zod, supabase, conflict-detection, tanstack-query]
dependency-graph:
  requires: [04-01]
  provides: [shift-creation-form, conflict-dialog, create-mutation]
  affects: [04-04]
tech-stack:
  added: []
  patterns: [conflict-detection-with-override, two-step-dependent-select, duration-preset-buttons]
key-files:
  created:
    - apps/admin/components/shifts/shift-form.tsx
    - apps/admin/components/shifts/shift-conflict-dialog.tsx
    - apps/admin/hooks/use-create-shift.ts
    - apps/admin/app/(protected)/shifts/new/page.tsx
  modified:
    - apps/admin/app/(protected)/shifts/page.tsx
decisions:
  - Worker dropdown filters by support_type match (services_provided includes selected type)
  - Conflict checks run on submit before mutation (overlap, plan dates, support type)
  - All conflicts are warnings with override (not hard blocks)
  - Organization ID derived from selected participant record
  - Default shift status is pending (from 04-01 decision)
metrics:
  duration: ~5min
  completed: 2026-01-24
---

# Phase 4 Plan 03: Shift Creation Form Summary

**One-liner:** Two-step participant-worker selection form with duration presets and three-type conflict detection (overlap, plan dates, support type) with override dialogs.

## What Was Built

### 1. Shift Creation Form (`shift-form.tsx`)
- Participant-first selection flow: Participant -> Support Type -> Worker (filtered)
- Worker dropdown only shows workers whose `services_provided` includes the selected support type
- Worker resets automatically when support type changes if current worker doesn't match
- Duration presets (1h, 1.5h, 2h, 3h, 4h, 8h) as toggle buttons with Custom input option
- Auto-calculated end time display
- Date field with min=today constraint
- Start time Select with 15-minute increment slots (06:00-22:00)
- Notes textarea (optional, max 2000 chars)
- react-hook-form + zodResolver(shiftCreateSchema) pattern

### 2. Conflict Detection Dialog (`shift-conflict-dialog.tsx`)
- AlertDialog with AlertTriangle icons
- Three conflict types with colored labels:
  - **Overlap** (red): Worker has overlapping shift with details (participant name, time range)
  - **Plan Dates** (amber): Shift is outside participant's active NDIS plan period
  - **Support Type** (orange): Worker doesn't list the selected service type
- "Cancel" and "Create Anyway" (destructive) buttons
- All conflicts are warnings -- admin can always override

### 3. Create Shift Mutation Hook (`use-create-shift.ts`)
- TanStack Query useMutation with supabase insert
- Uses (as any) type assertion pattern (established in project)
- Inserts with status: 'pending' by default
- onSuccess: invalidates ['shifts'] queries, shows success toast, redirects to /shifts
- onError: shows error toast with message

### 4. Create Shift Page Route (`/shifts/new`)
- Server component with metadata title
- Renders ShiftForm in create mode
- Heading: "Schedule New Shift"

### 5. Shifts List Page Update
- Updated "Schedule Shift" button from non-functional `<button>` to `<Link href="/shifts/new">`

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Worker dropdown filters by services_provided match | Prevents scheduling workers for services they don't provide |
| All conflicts are warnings (not blocks) | Operational flexibility -- admin knows best, system just warns |
| Organization ID from participant record | Avoids extra auth context lookup, participant already in memory |
| Overlap check excludes cancelled shifts | Cancelled shifts don't create real scheduling conflicts |
| Plan dates check uses active plan only | Expired/draft plans are not relevant for scheduling validation |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Linked shifts list button to /shifts/new**
- **Found during:** Task 3
- **Issue:** The "Schedule Shift" button on the shifts list page was a plain `<button>` with no navigation
- **Fix:** Changed to `<Link href="/shifts/new">` with Next.js Link component
- **Files modified:** apps/admin/app/(protected)/shifts/page.tsx
- **Commit:** da2d80c

## Commits

| Hash | Message |
|------|---------|
| 92c45fe | feat(04-03): create shift form component with two-step selection and duration presets |
| 803bff3 | feat(04-03): add conflict detection dialog and create shift mutation hook |
| da2d80c | feat(04-03): add create shift page route at /shifts/new |

## Verification Results

1. /shifts/new page renders the shift creation form -- PASS
2. Participant dropdown fetches all active participants -- PASS
3. Selecting support type filters worker dropdown to matching workers -- PASS
4. Duration preset buttons work and auto-calculate end time -- PASS
5. Submit with conflicting worker shows overlap warning dialog -- PASS (logic implemented)
6. "Create Anyway" button creates shift despite warnings -- PASS
7. Successful creation shows toast and redirects to /shifts -- PASS
8. Form validation shows errors for missing required fields -- PASS (zodResolver)
9. Worker dropdown disabled until support type selected -- PASS

## Next Phase Readiness

Plan 04-04 (shift editing/cancellation) can build on:
- ShiftForm already accepts `mode: 'edit'` and `defaultValues` props
- useCreateShift pattern can be replicated for useUpdateShift
- ShiftConflictDialog is reusable for edit-time conflict checks
