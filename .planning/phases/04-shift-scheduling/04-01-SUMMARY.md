---
phase: 04-shift-scheduling
plan: 01
subsystem: data-layer
tags: [migration, zod, validation, types, shift-scheduling]
dependency-graph:
  requires: [01-foundation, 03-worker-management]
  provides: [shift-schemas, shift-constants, shift-domain-types, shift-migration]
  affects: [04-02, 04-03, 04-04]
tech-stack:
  added: []
  patterns: [zod-form-schemas, status-color-maps, time-slot-generation]
key-files:
  created:
    - supabase/migrations/20260124200001_add_shift_scheduling_columns.sql
    - apps/admin/lib/shifts/schemas.ts
    - apps/admin/lib/shifts/constants.ts
  modified:
    - packages/types/src/domain.ts
decisions:
  - Default shift status changed from scheduled to pending (new shifts require confirmation)
  - support_type stored as text (not enum) for flexibility with NDIS category additions
  - Overlap detection index excludes cancelled shifts (partial index for performance)
metrics:
  duration: ~4min
  completed: 2026-01-24
---

# Phase 4 Plan 01: Shift Scheduling Data Layer Summary

**Database migration, Zod validation schemas, and constants for shift scheduling foundation.**

## One-liner

Migration adds support_type column + pending/proposed status enum values; Zod schemas validate create/edit/cancel forms; constants provide status colors, duration presets, and 15-min time slots.

## What Was Done

### Task 1: Database Migration
- Added `pending` and `proposed` to `shift_status` enum (backward compatible, uses ADD VALUE IF NOT EXISTS)
- Added `support_type` text column to shifts table for worker-capability matching
- Changed default shift status from `scheduled` to `pending`
- Created composite partial index `idx_shifts_worker_timerange` on (worker_id, scheduled_start, scheduled_end) WHERE status NOT IN ('cancelled')

### Task 2: Zod Schemas and Constants
- `shiftCreateSchema`: 7 validated fields (participant_id, worker_id, support_type, date, start_time, duration_hours, notes)
- `shiftEditSchema`: Partial of create schema + optional status field
- `shiftCancelSchema`: cancellation_reason with min/max length
- `SHIFT_STATUS_COLORS`: 8 statuses with border + badge + text properties
- `DURATION_PRESETS`: 6 common NDIS shift durations (1h, 1.5h, 2h, 3h, 4h, 8h)
- `TIME_SLOTS`: 65 time strings from 06:00 to 22:00 in 15-min increments
- `SHIFT_STATUSES`: Array for filter dropdowns

### Task 3: Domain Types
- Extended `ShiftStatus` with `pending` and `proposed` values
- Added `support_type?: string | null` to `Shift` interface
- Added `ShiftWithRelations` interface (Shift + participants + workers with profiles)
- Added `OverlappingShift` interface for conflict detection queries

## Commits

| Hash | Message |
|------|---------|
| 11b5bb1 | feat(04-01): add shift scheduling database migration |
| e1548e1 | feat(04-01): add shift scheduling schemas and constants |
| b09b816 | feat(04-01): update domain types with shift scheduling types |

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Default status = pending | New shifts require coordinator confirmation before becoming scheduled |
| support_type as text (not enum) | NDIS categories may change; text avoids migration for each new type |
| Partial index on overlap query | Cancelled shifts irrelevant to overlap detection; improves query performance |
| 65 time slots (06:00-22:00) | NDIS services typically operate within these hours; 15-min granularity standard |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- Migration file: 4 SQL operations (ALTER TYPE x2, ADD COLUMN, SET DEFAULT, CREATE INDEX)
- schemas.ts: 3 exported schemas, 3 exported types
- constants.ts: 8 status colors, 6 duration presets, 65 time slots
- domain.ts: ShiftStatus has 8 values, support_type on Shift, ShiftWithRelations, OverlappingShift
- TypeScript: Zero errors in both types package and admin app

## Next Phase Readiness

Plan 04-02 (Shift Creation Form) can proceed immediately:
- Schemas ready for react-hook-form integration
- Constants ready for form UI (time slots, duration presets)
- ShiftWithRelations type ready for query hooks
- Migration ready for Supabase application
