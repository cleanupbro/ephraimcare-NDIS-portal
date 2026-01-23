---
phase: 02-participant-management
plan: 05
subsystem: participant-crud
tags: [edit-form, archive, soft-delete, type-confirm, read-only-fields]
requires: ["02-01", "02-02", "02-04"]
provides: ["participant-edit", "participant-archive", "detail-page-actions"]
affects: ["03-worker-management"]
tech-stack:
  added: []
  patterns: ["type-to-confirm-dialog", "read-only-locked-field", "active-shift-blocking"]
key-files:
  created:
    - apps/admin/components/participants/participant-edit-form.tsx
    - apps/admin/app/(protected)/participants/[id]/edit/page.tsx
    - apps/admin/components/participants/archive-dialog.tsx
  modified:
    - apps/admin/lib/participants/schemas.ts
    - apps/admin/components/participants/participant-detail.tsx
decisions:
  - "participantEditSchema omits ndis_number (separate from participantFullSchema used for creation)"
  - "NDIS number shown as locked static text with Lock icon (not disabled input)"
  - "Archive button only visible when participant.is_active is true"
  - "Edit button always visible (admin can update contact info even for archived participants)"
  - "Type-to-confirm requires exact full name match (case-sensitive)"
metrics:
  duration: "74s"
  completed: "2026-01-24"
---

# Phase 2 Plan 5: Edit and Archive Functionality Summary

Edit form with read-only NDIS number, type-to-confirm archive dialog with active shift blocking, and action buttons wired on detail page.

## What Was Delivered

### Participant Edit Form (PART-04)
- Single-page edit form (simpler than multi-step creation wizard)
- Pre-fills all current participant data from server component fetch
- NDIS number displayed as locked static text (Lock icon + muted background)
- Editable fields: name, DOB, phone, email, address, emergency contact, notes
- Validates via participantEditSchema (zodResolver) - omits ndis_number validation
- useUpdateParticipant mutation strips ndis_number from payload
- Success: toast + redirect to detail page; Error: toast with message

### Archive Dialog (PART-05)
- AlertDialog with exact name typing confirmation
- Archive button disabled when useHasActiveShifts returns true
- Clear error message: "Cannot archive: participant has upcoming or active shifts"
- Dialog resets confirmText on close
- On archive: mutation + toast + redirect to /participants
- Confirm button disabled until exact match

### Detail Page Actions
- Edit button (outline, Pencil icon) links to /participants/[id]/edit
- ArchiveDialog rendered only for active participants
- "Archived" badge (destructive variant) shown for inactive participants
- Edit available for both active and archived participants

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 7afa82e | Create participant edit form with read-only NDIS number |
| 2 | e174ed4 | Create type-to-confirm archive dialog |
| 3 | 1c8e3e7 | Wire edit and archive buttons on participant detail page |

## Decisions Made

1. **participantEditSchema separate from participantFullSchema** - Edit schema omits ndis_number entirely since it cannot be changed after creation. Full schema used for creation includes ndis_number validation.

2. **NDIS number as locked static text** - Used a styled div with Lock icon and muted background rather than a disabled input, making it clear this is not an editable field (not just temporarily disabled).

3. **Edit always available, Archive only for active** - Admin may need to update contact info for archived participants (e.g., data correction), but archiving an already-archived participant makes no sense.

4. **Case-sensitive name match for archive** - The confirmation requires the exact name as displayed, providing a friction barrier against accidental archival.

## Deviations from Plan

None - plan executed exactly as written. Tasks 1 and 2 were already committed from a prior execution; Task 3 was the remaining work.

## Verification Results

- [x] `pnpm typecheck` (admin app) passes
- [x] `pnpm build --filter=@ephraimcare/admin` succeeds
- [x] Edit form shows NDIS number as read-only (Lock icon)
- [x] Edit form pre-fills current values from participant prop
- [x] Archive dialog requires exact name match to enable confirm
- [x] Archive blocked when participant has active shifts
- [x] Archived participants show Archived badge, no archive button
- [x] Toast notifications for success/error states
- [x] Edit page route at /participants/[id]/edit with breadcrumb

## Success Criteria Status

- [x] Admin can edit participant details except NDIS number and plan dates (PART-04)
- [x] Admin can archive participant with type-to-confirm and active shift blocking (PART-05)
- [x] Archived participants hidden from default list, accessible via "Archived" filter (PART-05, via useParticipants status filter from 02-02)
- [x] All actions provide clear success/error feedback via toast

## Next Phase Readiness

Phase 2 (Participant Management) is now complete (5/5 plans executed). Ready for Phase 3 (Worker Management).

**Key artifacts for Phase 3:**
- Pattern established: edit form with read-only fields, archive dialog with type-confirm, detail page action buttons
- Hook pattern: useUpdate*, useArchive*, useHasActiveShifts can be replicated for workers
- Schema pattern: separate edit schema (omit immutable fields) from create schema
