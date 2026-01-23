---
phase: 02
plan: 03
subsystem: participant-management
tags: [zustand, react-hook-form, multi-step-form, ndis, supabase, zod]
requires: ["02-01"]
provides: ["multi-step-create-form", "ndis-uniqueness-check", "participant-creation-flow"]
affects: ["02-04", "02-05"]
tech-stack:
  added: []
  patterns: ["zustand-form-store", "multi-step-form-orchestrator", "per-step-zod-validation", "useWatch-reactivity"]
key-files:
  created:
    - apps/admin/lib/participants/form-store.ts
    - apps/admin/components/participants/participant-form/step-basic-info.tsx
    - apps/admin/components/participants/participant-form/step-plan-details.tsx
    - apps/admin/components/participants/participant-form/step-contacts.tsx
    - apps/admin/components/participants/participant-form/step-support-needs.tsx
    - apps/admin/components/participants/participant-form/index.tsx
    - apps/admin/app/(protected)/participants/new/page.tsx
    - apps/admin/hooks/use-check-ndis.ts
    - apps/admin/hooks/use-create-participant.ts
    - apps/admin/providers/query-provider.tsx
    - apps/admin/lib/toast.ts
    - apps/admin/components/ui/toaster.tsx
  modified:
    - apps/admin/app/layout.tsx
    - packages/types/src/database.ts
decisions:
  - id: d-02-03-01
    decision: "Used per-step independent useForm instances (not shared FormProvider)"
    rationale: "Each step validates independently, cleaner state isolation, React 19 compatible"
  - id: d-02-03-02
    decision: "Created lightweight toast system using Zustand instead of installing sonner"
    rationale: "Avoids adding another dependency, uses same state pattern as form store"
  - id: d-02-03-03
    decision: "Used type assertions (as any) for Supabase inserts due to PostgREST v12 type resolution issue"
    rationale: "Database types are correct but supabase-js v2.91 Generic resolution has issues with Insert types resolving as never"
  - id: d-02-03-04
    decision: "Created separate hooks (use-check-ndis.ts, use-create-participant.ts) instead of modifying shared hooks file"
    rationale: "Plan 02-02 owns hooks/use-participants.ts; creating dedicated hooks avoids merge conflicts"
metrics:
  duration: ~8min
  completed: 2026-01-24
---

# Phase 2 Plan 3: Multi-step Participant Create Form Summary

**One-liner:** 4-step Zustand-managed participant creation form with per-step Zod validation, NDIS uniqueness checking, and Supabase insertion.

## What Was Built

### Zustand Form Store (form-store.ts)
- Cross-step state management with `useParticipantFormStore`
- Actions: `setStep`, `setBasicInfo`, `setPlanDetails`, `setContacts`, `setSupportNeeds`, `markStepComplete`, `reset`
- Derived: `getFullFormData()` assembles all steps or returns null, `canNavigateToStep(n)` checks prior completions

### Step 1: Basic Info (step-basic-info.tsx)
- Fields: first_name, last_name, ndis_number, date_of_birth, phone, email
- NDIS uniqueness: uses `useWatch` on ndis_number field, calls `useCheckNdisNumber` when 9 digits entered
- Inline error "This NDIS number is already registered" blocks submission
- Spinner indicator while checking

### Step 2: Plan Details (step-plan-details.tsx)
- Fields: plan_number (optional), plan_start_date, plan_end_date, total_budget
- Budget categories: repeatable rows via `useFieldArray` (category + allocated_amount)
- Zod refine validates end_date > start_date with error on plan_end_date field

### Step 3: Contacts (step-contacts.tsx)
- Address section: address_line_1, address_line_2, suburb, state (Select with all AU states), postcode
- Emergency contact section: name, phone
- Visual separation with Separator component

### Step 4: Support Needs (step-support-needs.tsx)
- Notes textarea with live character count (X / 2000)
- "Create Participant" button (not "Next") with loading state
- Triggers `onSubmitAll` which invokes creation mutation

### Form Orchestrator (index.tsx)
- Stepper UI: numbered circles with labels, green checkmarks for completed, connecting lines
- Completed steps clickable, future steps disabled unless prior steps done
- `reset()` on mount prevents ghost data
- Final submission: gets org_id from session, calls `useCreateParticipant`, shows toast, navigates to /participants

### New Participant Page (new/page.tsx)
- Breadcrumb: Participants > New
- Card-wrapped form with title and description

### Infrastructure Added
- QueryProvider (TanStack React Query) wrapping root layout
- Toast notification system (Zustand-based, no external dependency)
- Toaster component with slide-in animations

## Requirements Delivered

| ID | Requirement | Status |
|----|------------|--------|
| PART-02 | Multi-step form | Complete |
| PART-08 | Form validation | Complete |
| PART-09 | NDIS uniqueness | Complete |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Database types missing Relationships field and ndis_plans table**
- **Found during:** Task 1
- **Issue:** Supabase JS v2.91 (postgrest-js) requires `Relationships: GenericRelationship[]` on each table definition. Also ndis_plans table was missing.
- **Fix:** Expanded all table Insert/Update types to explicit objects (removed self-referential Omit), added Relationships arrays, added ndis_plans table definition
- **Files modified:** packages/types/src/database.ts
- **Commit:** dcd1800

**2. [Rule 3 - Blocking] No QueryClientProvider or toast system existed**
- **Found during:** Task 1
- **Issue:** React Query mutations and toast notifications needed for form submission, but no provider or toast system existed
- **Fix:** Created QueryProvider, lightweight Zustand-based toast store, and Toaster component
- **Files created:** apps/admin/providers/query-provider.tsx, apps/admin/lib/toast.ts, apps/admin/components/ui/toaster.tsx
- **Commit:** dcd1800

**3. [Rule 3 - Blocking] Hooks file owned by parallel plan 02-02**
- **Found during:** Task 1
- **Issue:** Plan 02-02 owns hooks/use-participants.ts, creating it would cause merge conflicts
- **Fix:** Created dedicated hook files: hooks/use-check-ndis.ts and hooks/use-create-participant.ts
- **Commit:** dcd1800

## Commits

| Hash | Type | Description |
|------|------|-------------|
| dcd1800 | feat | Zustand form store and Step 1-2 components |
| bdb7cc9 | feat | Step 3-4 components (contacts + support needs) |
| 05950fa | feat | Form orchestrator and new participant page |

## Next Phase Readiness

Plan 02-04 (Detail page) can proceed - participant creation flow is complete.
Plan 02-05 (Edit + archive) can build on the form store pattern and step components for edit functionality.

The hooks created here (use-check-ndis.ts, use-create-participant.ts) may need consolidation with 02-02's use-participants.ts after both plans complete.
