---
phase: 06-case-notes
plan: 01
subsystem: database
tags: [supabase, rls, triggers, zod, case-notes]
dependency-graph:
  requires: [phase-01-foundation, phase-05-worker-mobile]
  provides: [case-notes-schema, concern-flag, admin-comments-table, 24h-edit-window]
  affects: [06-02, 06-03, 06-04]
tech-stack:
  added: []
  patterns: [concern-notification-trigger, 24h-rls-window, admin-isolated-table]
key-files:
  created:
    - supabase/migrations/20260125000001_case_notes_phase6.sql
    - apps/worker-mobile/lib/schemas/case-note.ts
  modified: []
decisions:
  - id: d-0601-01
    choice: "Unique constraint on (shift_id, worker_id) prevents duplicate case notes"
    reason: "One note per shift per worker matches business logic"
  - id: d-0601-02
    choice: "24-hour edit window uses shift_check_ins.check_out_time, not created_at"
    reason: "Workers get 24h from checkout, not from when they wrote the note"
  - id: d-0601-03
    choice: "Admin comments in separate table (not column on case_notes)"
    reason: "RLS isolation ensures workers cannot see private admin commentary"
  - id: d-0601-04
    choice: "Participant visibility policy dropped entirely"
    reason: "Case notes are clinical records, participants should not see them"
metrics:
  duration: "1m 44s"
  completed: "2026-01-25"
---

# Phase 6 Plan 01: Case Notes Database Foundation Summary

**One-liner:** concern_flag + admin_comments table + 24h RLS window + Zod validation schema for case notes

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Database migration for case notes phase 6 | fbe7801 | supabase/migrations/20260125000001_case_notes_phase6.sql |
| 2 | Zod schema for case note validation | 91a4048 | apps/worker-mobile/lib/schemas/case-note.ts |

## What Was Built

### Migration (20260125000001_case_notes_phase6.sql)

1. **New columns on case_notes:** concern_flag (boolean), concern_text (text), reviewed_at (timestamptz), reviewed_by (uuid -> profiles)
2. **Unique constraint:** (shift_id, worker_id) prevents duplicate notes per shift per worker
3. **RLS changes:**
   - Dropped participant visibility policy (clinical privacy)
   - Dropped old worker update policy (was draft-based)
   - New worker UPDATE policy: 24h window from shift checkout
   - New worker INSERT policy: 24h window from shift checkout
4. **Admin comments table:** case_note_admin_comments with admin-only RLS (workers cannot see admin private comments)
5. **Concern notification trigger:** notify_concern_flag() inserts notification for all org admins when concern_flag = true on case note insert

### Zod Schema (case-note.ts)

- `caseNoteSchema`: validates content (min 10 chars), concernFlag (boolean), concernText (optional, min 5 if provided)
- `CaseNoteFormData`: TypeScript type inferred from schema
- `CreateCaseNoteInput`: interface for mutation input (shiftId, participantId, workerId, organizationId, content, concernFlag, concernText)

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| d-0601-01 | Unique (shift_id, worker_id) constraint | One note per shift per worker business rule |
| d-0601-02 | 24h window from check_out_time | Workers edit relative to checkout, not note creation |
| d-0601-03 | Separate admin_comments table | RLS isolation from workers |
| d-0601-04 | No participant case note access | Clinical records privacy |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All checks passed:
- [x] Migration file exists with all 8 sections
- [x] concern_flag and concern_text columns added
- [x] reviewed_at and reviewed_by columns added
- [x] Unique constraint on (shift_id, worker_id)
- [x] Participant policy dropped
- [x] Worker update/insert policies enforce 24h window via shift_check_ins
- [x] case_note_admin_comments table with admin-only RLS
- [x] notify_concern_flag trigger function and trigger
- [x] Zod schema exports caseNoteSchema, CaseNoteFormData, CreateCaseNoteInput

## Next Phase Readiness

Plans 02, 03, and 04 can now build upon:
- `concern_flag` column for UI toggle
- `caseNoteSchema` for form validation
- `CreateCaseNoteInput` for mutation hook typing
- `case_note_admin_comments` table for admin review UI
- 24h edit window enforced at DB level (UI just needs to show/hide edit button)
