---
phase: 02-participant-management
plan: 01
subsystem: ui-foundation
tags: [tanstack-table, shadcn-ui, zod, validation, data-table]

dependency_graph:
  requires: [01-foundation]
  provides: [participant-schemas, data-table-component, ui-primitives]
  affects: [02-02, 02-03, 02-04, 02-05, 03-worker-management, 04-shift-scheduling]

tech_stack:
  added:
    - "@tanstack/react-table ^8.21.0"
    - "@radix-ui/react-alert-dialog ^1.1.0"
    - "@radix-ui/react-dialog ^1.1.0"
    - "@radix-ui/react-dropdown-menu ^2.1.0"
    - "@radix-ui/react-label ^2.1.0"
    - "@radix-ui/react-progress ^1.1.0"
    - "@radix-ui/react-select ^2.1.0"
    - "@radix-ui/react-separator ^1.1.0"
    - "@radix-ui/react-slot ^1.1.0"
    - "@radix-ui/react-tabs ^1.1.0"
  patterns:
    - "Generic DataTable<TData, TValue> using useReactTable"
    - "Step-level Zod schema validation with cross-field refinements"
    - "shadcn/ui component pattern: forwardRef + CVA + cn() + Radix primitives"

key_files:
  created:
    - apps/admin/lib/participants/schemas.ts
    - apps/admin/components/ui/data-table.tsx
    - packages/ui/src/components/table.tsx
    - packages/ui/src/components/input.tsx
    - packages/ui/src/components/badge.tsx
    - packages/ui/src/components/progress.tsx
    - packages/ui/src/components/card.tsx
    - packages/ui/src/components/dialog.tsx
    - packages/ui/src/components/alert-dialog.tsx
    - packages/ui/src/components/tabs.tsx
    - packages/ui/src/components/select.tsx
    - packages/ui/src/components/label.tsx
    - packages/ui/src/components/textarea.tsx
    - packages/ui/src/components/separator.tsx
    - packages/ui/src/components/skeleton.tsx
    - packages/ui/src/components/dropdown-menu.tsx
    - packages/ui/src/components/button.tsx
  modified:
    - apps/admin/package.json
    - packages/ui/package.json
    - packages/ui/src/index.ts
    - pnpm-lock.yaml

decisions:
  - id: "02-01-01"
    decision: "Created shadcn/ui components manually rather than via CLI"
    reason: "shadcn CLI has issues in monorepo workspace structures; manual creation ensures correct import paths"
  - id: "02-01-02"
    decision: "DataTable uses @ephraimcare/ui barrel imports"
    reason: "tsconfig paths resolve workspace packages, keeping imports clean and workspace-aware"
  - id: "02-01-03"
    decision: "Separate form schemas from existing participantSchema in packages/utils"
    reason: "Multi-step form needs stricter validation (NDIS 43-prefix, date refinements) vs basic server-side schema"

metrics:
  tasks_completed: 3
  tasks_total: 3
  duration: "~8 minutes"
  completed: "2026-01-24"
---

# Phase 02 Plan 01: Foundation Schemas and DataTable Summary

**One-liner:** @tanstack/react-table DataTable component + 4 step-level Zod schemas + 15 shadcn/ui primitives for participant management UI

## What Was Done

### Task 1: Install Dependencies and UI Components
- Added `@tanstack/react-table ^8.21.0` to admin app
- Added 8 Radix UI primitives to packages/ui for shadcn components
- Created 15 shadcn/ui components following standard patterns (forwardRef, CVA, cn utility)
- Updated packages/ui/src/index.ts barrel to re-export all components

### Task 2: Participant Form Zod Schemas
- `basicInfoSchema`: first/last name, NDIS number (9 digits, must start with '43'), DOB (past, after 1900), optional AU phone/email
- `planDetailsSchema`: plan number, start/end dates (end > start refinement), budget (0-999999.99), optional budget categories array
- `contactsSchema`: address fields, suburb, state (default NSW), postcode (4 digits), emergency contact
- `supportNeedsSchema`: notes (max 2000 chars)
- `participantFullSchema`: merged basic+contacts+support for edit forms
- All schemas export inferred TypeScript types

### Task 3: Reusable DataTable Component
- Generic `DataTable<TData, TValue>` component
- Client-side sorting (SortingState + getSortedRowModel)
- Client-side pagination (configurable pageSize, Previous/Next buttons, page counter)
- Empty state display when no data
- Built on @tanstack/react-table + shadcn/ui Table primitives
- Reusable across participants, workers, and shifts tables

## Verification Results

- TypeScript compilation passes (admin app + UI package, zero errors)
- Schema tests pass: valid NDIS accepted, invalid rejected, date refinements work
- DataTable component typechecks with proper generics
- All 15 UI components resolve imports correctly

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

1. **Manual shadcn/ui creation over CLI** - The shadcn CLI does not reliably work in pnpm monorepo workspace structures. Components were created manually following identical patterns (forwardRef, CVA, cn utility, Radix primitives).

2. **Barrel exports via packages/ui/src/index.ts** - Components are importable both via barrel (`@ephraimcare/ui`) and direct path (`@ephraimcare/ui/components/table`) thanks to package.json exports field.

3. **Form schemas separate from server schemas** - The existing `participantSchema` in packages/utils remains for basic server validation. The new step-level schemas in apps/admin add stricter form-specific rules (NDIS 43-prefix check, date cross-validation).

## Commits

| Hash | Message |
|------|---------|
| 02bff8f | chore(02-01): install @tanstack/react-table and create shadcn/ui components |
| 351c3a2 | feat(02-01): create step-level Zod schemas for participant form |
| ffcfc92 | feat(02-01): create reusable DataTable component with sorting and pagination |

## Next Phase Readiness

Plan 02-02 (Participant List Page) can now:
- Import DataTable + column definitions for participant listing
- Use Badge, Progress, Card components for the UI
- Import schemas for any inline validation needs

No blockers or concerns for subsequent plans.
