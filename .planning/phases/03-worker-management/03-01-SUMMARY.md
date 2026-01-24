---
phase: 03-worker-management
plan: 01
subsystem: worker-management
tags: [migration, zod, types, compliance, ndis, wwcc]
dependency-graph:
  requires: [01-foundation]
  provides: [worker-schemas, worker-types, compliance-helpers, worker-migration]
  affects: [03-02, 03-03, 03-04, 03-05]
tech-stack:
  added: []
  patterns: [compliance-status-helpers, support-types-constant, domain-type-extensions]
key-files:
  created:
    - supabase/migrations/20260124100001_add_worker_compliance_columns.sql
    - apps/admin/lib/workers/schemas.ts
    - apps/admin/lib/workers/constants.ts
  modified:
    - packages/types/src/domain.ts
    - packages/types/src/index.ts
decisions:
  - id: worker-compliance-columns
    choice: "Columns on workers table (Option B) for MVP"
    reason: "Only 2 check types (NDIS, WWCC) -- separate table is overkill for MVP"
  - id: compliance-expiry-threshold
    choice: "90-day threshold for expiring status"
    reason: "Industry standard for compliance warning period"
  - id: worker-email-readonly
    choice: "Email excluded from workerEditSchema"
    reason: "Email tied to auth profile, cannot be changed after creation"
metrics:
  duration: ~2 minutes
  completed: 2026-01-24
---

# Phase 03 Plan 01: Worker Management Foundation Summary

**One-liner:** Database migration for NDIS/WWCC compliance columns, Zod validation schemas, compliance status helpers, and WorkerWithProfile domain types.

## What Was Done

### Task 1: Database Migration for Compliance Columns
- Created migration adding 4 columns to workers table: `ndis_check_number`, `ndis_check_expiry`, `wwcc_number`, `wwcc_expiry`
- Added partial indexes on expiry dates for dashboard queries filtering by upcoming expirations
- Commit: `3e0fbab`

### Task 2: Zod Schemas and Constants
- **schemas.ts**: 5 schemas (workerBasicSchema, workerDetailsSchema, workerComplianceSchema, workerFullSchema, workerEditSchema) + 5 inferred types
- **constants.ts**: SUPPORT_TYPES (8 NDIS categories), ComplianceStatus type, getComplianceStatus(), getOverallComplianceStatus(), COMPLIANCE_COLORS
- Australian phone format regex matches established pattern from participants
- Compliance status logic: null -> not_set, past -> expired, within 90 days -> expiring, else -> valid
- Commit: `8ad60ba`

### Task 3: Domain Type Extensions
- Updated Worker interface to include 4 new compliance fields
- Added WorkerWithProfile interface with joined `profiles` relation for list/detail queries
- Added WorkerStats interface for worker detail page stat cards
- Exported new types from packages/types index
- Commit: `4b89759`

## Decisions Made

| Decision | Choice | Reason |
|----------|--------|--------|
| Compliance storage | Columns on workers table | Only 2 check types for MVP, no need for separate compliance_checks table |
| Expiry threshold | 90 days | Industry standard warning period for compliance renewals |
| Email on edit | Excluded (read-only) | Email is auth identity, matches participant pattern |
| Overall status priority | expired > expiring > not_set > valid | Worst status wins to ensure no compliance gap is hidden |

## Deviations from Plan

None - plan executed exactly as written.

## Key Patterns Established

1. **Compliance status as pure function** - `getComplianceStatus(expiryDate)` takes a string date and returns enum status, no side effects
2. **Overall compliance = worst status** - Priority ordering ensures dashboard shows most urgent status
3. **Partial indexes** - Only index rows where expiry is set, optimizing compliance dashboard queries
4. **Schema structure** - Mirrors participant pattern: basic + details + domain-specific, with full/edit variants

## Next Phase Readiness

Plans 03-02 through 03-05 can now:
- Import `workerFullSchema`/`workerEditSchema` for form validation
- Import `SUPPORT_TYPES` for select/checkbox options
- Import `getComplianceStatus`/`COMPLIANCE_COLORS` for status badges
- Import `WorkerWithProfile` for query result typing
- Query workers table with compliance columns available
