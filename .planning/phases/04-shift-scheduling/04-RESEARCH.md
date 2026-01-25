# Phase 4: Shift Scheduling - Research

**Researched:** 2026-01-24
**Status:** Complete - Ready for planning

---

## 1. What Already Exists

### Database Layer (shifts table)
The shifts table already exists from Phase 1 foundation (`supabase/migrations/20260124000010_create_shifts.sql`):

```sql
create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id),
  worker_id uuid not null references workers(id),
  service_agreement_item_id uuid references service_agreement_items(id),
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  actual_start timestamptz,
  actual_end timestamptz,
  status public.shift_status default 'scheduled',
  check_in_latitude double precision,
  check_in_longitude double precision,
  check_out_latitude double precision,
  check_out_longitude double precision,
  cancellation_reason text,
  notes text,
  organization_id uuid not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

Existing indexes: `worker_id`, `participant_id`, `scheduled_start`, `status`, `organization_id`.

### Enum Types
Current `shift_status` enum: `'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'`

Phase context requests: `pending, proposed, confirmed, in_progress, completed, cancelled`

**GAP:** The existing DB enum has `scheduled` and `no_show` but does NOT have `pending` or `proposed`. The context requirements list `pending` and `proposed` as desired statuses.

### RLS Policies
Already configured in `20260124000016_create_rls_policies.sql`:
- Admin/coordinator can manage all shifts (CRUD)
- Workers can view and update their own shifts (for check-in/out)
- Participants can view their own shifts

### Placeholder Page
`apps/admin/app/(protected)/shifts/page.tsx` exists as a basic server component with a static table. No client interactivity, no filtering, no create/edit flows.

### Domain Types
`packages/types/src/domain.ts` already defines `Shift` interface and `ShiftStatus` type.

### Worker Stats Hook
`apps/admin/hooks/use-worker-stats.ts` already queries shifts for worker hours (this validates the join pattern works).

---

## 2. Schema Gaps (Migration Required)

### Missing Column: `support_type`
The current shifts table has `service_agreement_item_id` but **no explicit `support_type` column**. Requirements SHFT-01 and SHFT-07 require:
- Shift has a `support_type` field
- System validates worker's `services_provided` array matches the shift's `support_type`

**Decision needed:** Add a `support_type text` column to the shifts table. This is simpler than deriving it from the `service_agreement_items` join (which may not always exist for a shift).

### Enum Mismatch: `shift_status`
Current DB enum: `scheduled, confirmed, in_progress, completed, cancelled, no_show`
Required by SHFT-08: `pending, proposed, confirmed, in_progress, completed, cancelled`

**Analysis:**
- `pending` and `proposed` are new statuses not in the current enum
- `scheduled` exists in DB but not in requirements (but is the current default)
- `no_show` exists in DB but not in requirements

**Recommendation:** ALTER TYPE to ADD `pending` and `proposed`. Keep `scheduled` (existing data compatibility) and `no_show` (future mobile use). The current default of `'scheduled'` should be changed to `'pending'` for new shifts.

### Composite Index for Overlap Detection
Current indexes cover individual columns. For efficient overlap detection queries, a composite index would help:
```sql
CREATE INDEX idx_shifts_worker_timerange ON shifts(worker_id, scheduled_start, scheduled_end) WHERE status NOT IN ('cancelled');
```

---

## 3. Established Codebase Patterns

### List Page Pattern (server-side initial fetch + client TanStack Query)
From workers and participants:
1. **Server Component Page** fetches initial data via Supabase SSR client
2. **Client List Component** receives `initialData` prop, uses TanStack Query for reactive updates
3. **Search Component** provides filter controls with `useDeferredValue` for debounce
4. **DataTable** (or custom layout) renders the data

### Hook Pattern (TanStack Query)
```typescript
// List hook: useQuery with queryKey including filter params
export function useWorkers({ search, status }: UseWorkersOptions) {
  return useQuery<WorkerWithProfile[]>({
    queryKey: ['workers', { search, status }],
    queryFn: async () => { /* supabase query */ },
    staleTime: 30_000,
  })
}

// Mutation hook: useMutation with invalidation + toast
export function useUpdateWorker(workerId, profileId) {
  return useMutation({
    mutationFn: async (data) => { /* supabase update */ },
    onSuccess: () => { invalidateQueries + toast + router.push },
    onError: (error) => { toast error },
  })
}
```

### Form Pattern
- **Participant create:** Multi-step form with zustand form-store, per-step independent `useForm` instances
- **Worker create:** API route for invite flow (requires admin Supabase client)
- **Shift create (this phase):** Single-page form per context decision - simpler than multi-step

### Type Assertion Pattern
Due to postgrest-js v12 generic resolution issue, all Supabase queries use `as any` or `as unknown as T`:
```typescript
const { data } = await supabase.from('shifts').select('*, participants(...)') as any
```

### UI Component Pattern
- Components from `@ephraimcare/ui` package (shadcn/ui manually installed)
- Available: Button, Input, Select, Badge, Card, Dialog, AlertDialog, Table, Label, Textarea, Separator, Skeleton, DropdownMenu, Tabs
- **NOT available (need to create):** Sheet (side panel), DatePicker, TimePicker/TimeInput

### Search/Filter Pattern
Horizontal row of filter controls (Input + Select dropdowns) above the list. Client-side filtering for simple cases; server-side for complex queries.

### Timezone Handling
`packages/utils/src/dates.ts` uses `@date-fns/tz` with `TZDate` for Sydney timezone. All display formatting goes through `formatSydneyDate()`.

---

## 4. New UI Components Required

### Sheet (Side Panel) Component
Context specifies: "Clicking a shift opens a side sheet (slide-out panel) with full details and edit/cancel actions."

This is a NEW pattern in the app. Previous entities use dedicated detail pages. Need to create:
- `packages/ui/src/components/sheet.tsx` - Radix UI Sheet primitive wrapper
- Export from `packages/ui/src/index.ts`

**Implementation:** Use `@radix-ui/react-dialog` with side-slide animation (same as shadcn/ui Sheet pattern).

### Date Picker
For the shift create form's date selection. Options:
1. Native `<input type="date">` - simplest, works but limited styling
2. Custom calendar component using `react-day-picker` + Radix Popover
3. Headless date picker

**Recommendation:** Native `<input type="date">` for MVP (matches existing pattern of simple inputs). The context doesn't mention complex date picking UX.

### Time Selection
Context: "pick start time, choose duration to auto-calculate end time" with duration presets.

**Implementation:**
- Start time: Select dropdown with 15-min increments (6:00 AM to 10:00 PM)
- Duration: Preset buttons (1h, 1.5h, 2h, 3h, 4h, 8h, Custom)
- Custom: Two number inputs (hours + minutes)
- End time: Auto-calculated display (read-only)

---

## 5. Data Queries & Joins

### Shift List Query (with participant and worker names)
```typescript
const { data } = await supabase
  .from('shifts')
  .select(`
    *,
    participants!inner(id, first_name, last_name),
    workers!inner(id, profiles!inner(first_name, last_name), services_provided)
  `)
  .gte('scheduled_start', weekStart)
  .lte('scheduled_start', weekEnd)
  .order('scheduled_start')
```

### Overlap Detection Query
For SHFT-05 (warn on overlapping worker shifts):
```typescript
const { data: conflicts } = await supabase
  .from('shifts')
  .select('id, scheduled_start, scheduled_end, participants(first_name, last_name)')
  .eq('worker_id', selectedWorkerId)
  .not('status', 'eq', 'cancelled')
  .or(`scheduled_start.lt.${newEnd},scheduled_end.gt.${newStart}`)
```

Time overlap logic: Two shifts overlap if `shift1.start < shift2.end AND shift1.end > shift2.start`.

### Plan Date Validation Query
For SHFT-06 (warn scheduling outside participant plan dates):
```typescript
const { data: plan } = await supabase
  .from('ndis_plans')
  .select('start_date, end_date')
  .eq('participant_id', selectedParticipantId)
  .eq('is_current', true)
  .single()
```

Check: `shiftDate < plan.start_date || shiftDate > plan.end_date`

### Worker Support Type Validation
For SHFT-07 (validate worker support types match shift):
```typescript
const { data: worker } = await supabase
  .from('workers')
  .select('services_provided')
  .eq('id', selectedWorkerId)
  .single()

const matches = worker.services_provided.includes(selectedSupportType)
```

---

## 6. Key Technical Decisions

### Conflict Checks: Client-Side vs Server-Side
Context says: "Conflict checks happen on form submit (not real-time)."

**Approach:** Client-side check on submit. Before calling the insert mutation:
1. Query overlapping shifts for the worker
2. Query participant's current plan dates
3. Check worker's support types
4. If conflicts found: show AlertDialog with details and "Create Anyway" override
5. If no conflicts: proceed with insert

**Rationale:** Simpler than server-side validation. Admin already has RLS access to all needed data. Real-time checks would add unnecessary complexity.

### Week Navigation State
Context: "Week view with left/right arrows and Today button."

**Implementation:** Use URL search params for week offset (`?week=2026-01-20`) or keep in component state. Since filtered views don't need to be bookmarkable for MVP, component state is simpler.

Use `date-fns` functions: `startOfISOWeek`, `endOfISOWeek`, `addWeeks`, `subWeeks`.

### Grouped-by-Day Layout
Context: "Shifts grouped by day within the current week view."

**Pattern choice:** Cards grouped by day header (not DataTable with separators). Reasoning:
- DataTable doesn't support day-group headers natively
- Cards with left-border color coding match the "dual visual indicator" requirement
- Side sheet on click is easier to wire from cards than table rows
- Medium information density per card fits the described content

```
Monday, 20 Jan 2026
  [card] [card] [card]
Tuesday, 21 Jan 2026
  [card] [card]
```

### Side Sheet Pattern
New pattern for this entity. Shift detail opens in a right-side sheet without navigating away from the list.

Sheet content: Full shift details + Edit button + Cancel button
- Edit: Navigates to `/shifts/[id]/edit` or opens inline edit in sheet
- Cancel: Opens AlertDialog within the sheet for cancellation reason

### Status Enum Resolution
The requirements list 8 statuses: `pending, proposed, confirmed, in_progress, completed, cancelled`.

The DB currently has: `scheduled, confirmed, in_progress, completed, cancelled, no_show`.

**Recommendation for migration:**
- ADD `pending` and `proposed` to the enum
- Keep all existing values (backward compat)
- Change default from `'scheduled'` to `'pending'` for new shifts
- Map `scheduled` -> `pending` in the UI display (or migrate existing data)

### Support Type on Shifts
The shifts table lacks `support_type`. Need a migration:
```sql
ALTER TABLE shifts ADD COLUMN support_type text;
```
This matches the SUPPORT_TYPES constant defined in `apps/admin/lib/workers/constants.ts`.

---

## 7. File Structure (New Files Needed)

```
apps/admin/
  app/(protected)/shifts/
    page.tsx                    -- REPLACE existing placeholder
    new/page.tsx               -- Create shift form page
    [id]/edit/page.tsx         -- Edit shift form page (optional - may use sheet)
  components/shifts/
    shift-list.tsx             -- Main list with week nav + filters + cards
    shift-card.tsx             -- Individual shift card (status border + badge)
    shift-filters.tsx          -- Filter bar (participant, worker, status, support type)
    shift-week-nav.tsx         -- Week left/right/today navigation
    shift-detail-sheet.tsx     -- Side sheet with full details
    shift-form.tsx             -- Create/edit form (single page)
    shift-conflict-dialog.tsx  -- Warning dialog for conflicts
    shift-cancel-dialog.tsx    -- Cancel confirmation with reason field
  hooks/
    use-shifts.ts              -- TanStack Query hook for shift list
    use-create-shift.ts        -- Mutation hook for create
    use-update-shift.ts        -- Mutation hook for edit
    use-cancel-shift.ts        -- Mutation hook for cancel
  lib/shifts/
    schemas.ts                 -- Zod validation schemas
    constants.ts               -- Status colors, duration presets, etc.

packages/ui/src/components/
  sheet.tsx                    -- New: Radix Sheet component

supabase/migrations/
  YYYYMMDD_add_shift_support_type.sql    -- Add support_type column
  YYYYMMDD_add_shift_status_values.sql   -- Add pending/proposed to enum
```

---

## 8. Validation Schema Design

```typescript
// apps/admin/lib/shifts/schemas.ts
import { z } from 'zod'
import { SUPPORT_TYPES } from '../workers/constants'

export const shiftCreateSchema = z.object({
  participant_id: z.string().uuid('Participant is required'),
  worker_id: z.string().uuid('Worker is required'),
  support_type: z.enum(SUPPORT_TYPES, { errorMap: () => ({ message: 'Support type is required' }) }),
  date: z.string().min(1, 'Date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  duration_hours: z.coerce.number().min(0.25, 'Duration must be at least 15 minutes').max(24, 'Duration cannot exceed 24 hours'),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

export const shiftEditSchema = shiftCreateSchema.partial().extend({
  status: z.enum(['pending', 'proposed', 'scheduled', 'confirmed']).optional(),
})

export const shiftCancelSchema = z.object({
  cancellation_reason: z.string().min(1, 'Cancellation reason is required').max(500),
})
```

---

## 9. Conflict Detection Logic

### Overlap Check (SHFT-05)
```typescript
async function checkWorkerOverlaps(
  workerId: string,
  scheduledStart: Date,
  scheduledEnd: Date,
  excludeShiftId?: string
): Promise<OverlappingShift[]> {
  let query = supabase
    .from('shifts')
    .select('id, scheduled_start, scheduled_end, participants(first_name, last_name)')
    .eq('worker_id', workerId)
    .not('status', 'in', '("cancelled")')
    .lt('scheduled_start', scheduledEnd.toISOString())
    .gt('scheduled_end', scheduledStart.toISOString())

  if (excludeShiftId) {
    query = query.neq('id', excludeShiftId)
  }

  const { data } = await query
  return (data as any[]) ?? []
}
```

### Plan Date Check (SHFT-06)
```typescript
async function checkPlanDates(
  participantId: string,
  shiftDate: string
): Promise<{ outsidePlan: boolean; plan: { start_date: string; end_date: string } | null }> {
  const { data: plan } = await supabase
    .from('ndis_plans')
    .select('start_date, end_date')
    .eq('participant_id', participantId)
    .eq('is_current', true)
    .maybeSingle()

  if (!plan) return { outsidePlan: false, plan: null } // No plan = no warning

  const outside = shiftDate < plan.start_date || shiftDate > plan.end_date
  return { outsidePlan: outside, plan }
}
```

### Support Type Match (SHFT-07)
```typescript
function checkSupportTypeMatch(
  workerServicesProvided: string[],
  shiftSupportType: string
): boolean {
  return workerServicesProvided.includes(shiftSupportType)
}
```

---

## 10. UX Flow: Create Shift

1. Admin clicks "Schedule Shift" button on shift list page
2. Navigates to `/shifts/new`
3. **Step 1:** Select participant from dropdown (all active participants)
4. **Step 2:** Select support type from dropdown (SUPPORT_TYPES constant)
5. **Step 3:** Worker dropdown filters to only show workers whose `services_provided` includes the selected support type
6. **Step 4:** Pick date (native date input)
7. **Step 5:** Pick start time (Select dropdown, 15-min increments)
8. **Step 6:** Choose duration (preset buttons or custom input)
9. End time auto-calculated and displayed
10. **Step 7:** Optional notes (textarea)
11. Click "Create Shift" button
12. **Validation runs:**
    - Zod schema validation (required fields)
    - Worker support type match check
    - Worker overlap check
    - Plan date range check
13. If warnings: Show AlertDialog with conflict details
    - "Create Anyway" proceeds with insert
    - "Go Back" returns to form
14. On success: Toast + redirect to shift list

---

## 11. Status Color Mapping

```typescript
export const SHIFT_STATUS_COLORS: Record<string, { border: string; badge: string; text: string }> = {
  pending:     { border: 'border-l-gray-400',   badge: 'bg-gray-100 text-gray-800',     text: 'Pending' },
  proposed:    { border: 'border-l-blue-300',   badge: 'bg-blue-50 text-blue-700',      text: 'Proposed' },
  scheduled:   { border: 'border-l-yellow-400', badge: 'bg-yellow-100 text-yellow-800', text: 'Scheduled' },
  confirmed:   { border: 'border-l-indigo-400', badge: 'bg-indigo-100 text-indigo-800', text: 'Confirmed' },
  in_progress: { border: 'border-l-blue-500',   badge: 'bg-blue-100 text-blue-800',     text: 'In Progress' },
  completed:   { border: 'border-l-green-500',  badge: 'bg-green-100 text-green-800',   text: 'Completed' },
  cancelled:   { border: 'border-l-red-400',    badge: 'bg-red-100 text-red-800',       text: 'Cancelled' },
  no_show:     { border: 'border-l-orange-400', badge: 'bg-orange-100 text-orange-800', text: 'No Show' },
}
```

---

## 12. Dependencies and Packages

### Already Installed (from package.json)
- `date-fns` + `@date-fns/tz` -- date arithmetic and timezone
- `@tanstack/react-query` -- data fetching
- `@tanstack/react-table` -- DataTable (may not use for shift cards)
- `zod` + `@hookform/resolvers` -- form validation
- `react-hook-form` -- form management
- `lucide-react` -- icons
- `@radix-ui/react-dialog` -- for Dialog/AlertDialog (already used)
- `@radix-ui/react-select` -- for Select (already used)

### Need to Install
- `@radix-ui/react-dialog` -- already installed, Sheet uses same primitive with different styling
- No new packages needed. Sheet can be built from existing Radix Dialog with slide-from-right animation.

---

## 13. Risks and Edge Cases

### Risk: Timezone Display Confusion
Shifts store `timestamptz` in UTC. Must display in Sydney time consistently using the established `formatSydneyDate` pattern. The shift form must convert local Sydney time inputs to UTC before storing.

### Risk: PostgREST Type Assertions
The `(as any)` pattern for joined queries is established and accepted. The shifts join query (participants + workers + profiles) will need the same treatment.

### Edge Case: No Current Plan
If a participant has no active NDIS plan, the plan-date warning (SHFT-06) should not fire (nothing to warn about). The query uses `maybeSingle()` to handle this.

### Edge Case: Worker with No Support Types
A worker with empty `services_provided` should never match any shift's support type. The filter should exclude them from the dropdown.

### Edge Case: Shift Spans Midnight
A shift starting at 11 PM and ending at 2 AM crosses day boundaries. Grouping should place it under the start date's day.

### Edge Case: Cancelled Shift Edit
SHFT-02 says editing is blocked if shift is completed. Context says cancelled shifts are hidden by default. Cancelled shifts should also be non-editable (only viewable).

### Risk: Sheet Component (New Pattern)
This is the first use of a side-sheet in the app. It should be built as a reusable component in the UI package for future use by other entities.

---

## 14. What Phase 5 Expects From This Phase

Phase 5 (Worker Mobile) will need:
- Shifts queryable by worker_id with status filtering
- Status transitions: `scheduled/confirmed -> in_progress -> completed`
- `actual_start` and `actual_end` columns (already exist)
- Geo-location columns for check-in/out (already exist)

This phase should ensure the status flow supports: `pending -> confirmed -> in_progress -> completed` without breaking the mobile check-in flow.

---

## 15. Summary of Implementation Work

| Category | Items | Effort |
|----------|-------|--------|
| DB Migration | Add `support_type` column, add enum values, add composite index | Small |
| UI Component | Sheet component in packages/ui | Small |
| Shift List Page | Week nav, grouped cards, filters, status colors | Medium |
| Create Form | Single-page form with two-step selection, duration presets | Medium |
| Conflict Detection | 3 validation checks with warning dialog | Medium |
| Edit Flow | In-sheet or dedicated page, status restrictions | Small |
| Cancel Flow | Dialog with reason field, status update | Small |
| Hooks | useShifts, useCreateShift, useUpdateShift, useCancelShift | Medium |
| Types | ShiftWithRelations, shift schemas, constants | Small |

**Total estimated plans:** 4-5 execution plans (matching Phase 2/3 granularity).
