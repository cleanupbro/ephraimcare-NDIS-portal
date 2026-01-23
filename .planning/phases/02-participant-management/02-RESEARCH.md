# Phase 2: Participant Management - Research

**Researched:** 2026-01-24
**Domain:** CRUD operations, multi-step forms, data tables, Zod validation, Supabase queries, soft-delete archiving
**Confidence:** HIGH

## Summary

This phase delivers full CRUD for NDIS participants within the admin portal. The core components are: (1) a searchable/filterable data table listing all participants, (2) a multi-step creation form with per-step Zod validation, (3) a detail page with plan countdown and budget visualization, (4) inline editing, and (5) archive (soft-delete) with confirmation.

The existing codebase already has the database schema (`participants`, `ndis_plans`, `plan_budgets` tables), RLS policies, audit triggers, domain types, and a basic Zod schema for participants. Phase 2 builds the feature layer on top of this foundation using the established stack: React Hook Form + Zod for forms, TanStack Table + shadcn/ui for the data table, TanStack Query for server state, and Supabase `ilike`/`or` filters for search.

The multi-step form pattern uses Zustand for cross-step state persistence (already installed) with independent React Hook Form instances per step. Each step validates against its own Zod sub-schema before advancing. The archival confirmation uses a type-to-confirm pattern with an AlertDialog. Budget utilization and plan countdown are computed values derived from existing `plan_budgets.used_amount` and `ndis_plans.end_date`.

**Primary recommendation:** Build the data table component first (reusable for workers/shifts later), then the multi-step create form, then the detail page, then edit functionality, then archive -- each as independent vertical slices that can be tested in isolation.

## Standard Stack

### Core (already installed in Phase 1)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-table | 8.x | Headless data table with sorting, filtering, pagination | shadcn/ui data table is built on it |
| @tanstack/react-query | 5.65+ | Server state, caching, mutations | Already installed, manages all Supabase data fetching |
| react-hook-form | 7.54+ | Form state management per step | Already installed, handles validation timing |
| @hookform/resolvers | 3.9+ | Zod resolver for react-hook-form | Already installed, bridges Zod schemas |
| zod | 3.24+ | Schema validation | Already installed, shared schemas in packages/utils |
| zustand | 5.0+ | Cross-step form state | Already installed, persists data between form steps |
| date-fns | 4.1+ | Date calculations (plan countdown) | Already installed, used for days remaining |
| lucide-react | 0.469+ | Icons for UI elements | Already installed |

### New Dependencies Required
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-table | ^8.20.0 | Data table core | Participant list with search/sort/filter |

### shadcn/ui Components Required (install via CLI)
| Component | Purpose |
|-----------|---------|
| table | Base table elements (Table, TableHeader, TableRow, etc.) |
| input | Search field, form inputs |
| button | Actions, navigation |
| badge | Status indicators, plan countdown |
| progress | Budget utilization bar |
| card | Detail page sections |
| dialog | Create/edit form modal (if needed) |
| alert-dialog | Archive confirmation |
| tabs | Detail page sections (optional) |
| select | Dropdown selections (state, status filter) |
| label | Form labels |
| textarea | Notes fields |
| separator | Visual dividers |
| skeleton | Loading states |
| toast | Success/error notifications |
| dropdown-menu | Column visibility, row actions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TanStack Table | Simple HTML table | Works for basic list but lacks sorting, filtering, pagination out of box |
| Zustand for multi-step | FormProvider (single form) | Single form re-renders all steps; Zustand keeps steps independent |
| Client-side search | Supabase full-text search | ilike is simpler for name/NDIS number; full-text is overkill for < 200 participants |
| Tabs on detail page | Scrolling sections | Tabs reduce scroll but hide data; use scrolling sections with sticky nav for this use case |

**Installation:**
```bash
# In apps/admin:
pnpm add @tanstack/react-table

# shadcn/ui components (from packages/ui directory):
npx shadcn@latest add table input button badge progress card dialog alert-dialog tabs select label textarea separator skeleton toast dropdown-menu
```

## Architecture Patterns

### Recommended Feature Structure
```
apps/admin/
├── app/(protected)/
│   └── participants/
│       ├── page.tsx                    # Server component - fetches initial list
│       ├── [id]/
│       │   ├── page.tsx               # Detail page (server component)
│       │   └── edit/
│       │       └── page.tsx           # Edit page
│       └── new/
│           └── page.tsx               # Create page (multi-step form)
├── components/
│   └── participants/
│       ├── participant-list.tsx        # Client component - DataTable wrapper
│       ├── participant-columns.tsx     # Column definitions
│       ├── participant-search.tsx      # Search + filter controls
│       ├── participant-form/
│       │   ├── index.tsx              # Multi-step form orchestrator
│       │   ├── step-basic-info.tsx    # Step 1: Name, DOB, contact
│       │   ├── step-plan-details.tsx  # Step 2: NDIS plan info
│       │   ├── step-contacts.tsx      # Step 3: Emergency contacts, address
│       │   └── step-support-needs.tsx # Step 4: Support requirements
│       ├── participant-detail.tsx      # Detail page content
│       ├── participant-budget.tsx      # Budget progress bar component
│       ├── participant-plan-badge.tsx  # Plan countdown badge
│       └── archive-dialog.tsx         # Type-to-confirm archive dialog
├── hooks/
│   └── use-participants.ts            # TanStack Query hooks for CRUD
└── lib/
    └── participants/
        └── schemas.ts                 # Zod schemas (step-level + full)
```

### Pattern 1: Multi-Step Form with Zustand Store + Per-Step RHF
**What:** Each step is an independent React Hook Form instance. Validated data is pushed to a Zustand store on step completion. Final submission reads from the store.
**When to use:** The 4-step participant creation form.

**Zustand Store (lib/participants/form-store.ts):**
```typescript
import { create } from 'zustand'

interface ParticipantFormState {
  currentStep: number
  basicInfo: BasicInfoData | null
  planDetails: PlanDetailsData | null
  contacts: ContactsData | null
  supportNeeds: SupportNeedsData | null
  setStep: (step: number) => void
  setBasicInfo: (data: BasicInfoData) => void
  setPlanDetails: (data: PlanDetailsData) => void
  setContacts: (data: ContactsData) => void
  setSupportNeeds: (data: SupportNeedsData) => void
  reset: () => void
  getFullFormData: () => ParticipantCreateInput | null
}

export const useParticipantFormStore = create<ParticipantFormState>((set, get) => ({
  currentStep: 0,
  basicInfo: null,
  planDetails: null,
  contacts: null,
  supportNeeds: null,
  setStep: (step) => set({ currentStep: step }),
  setBasicInfo: (data) => set({ basicInfo: data }),
  setPlanDetails: (data) => set({ planDetails: data }),
  setContacts: (data) => set({ contacts: data }),
  setSupportNeeds: (data) => set({ supportNeeds: data }),
  reset: () => set({ currentStep: 0, basicInfo: null, planDetails: null, contacts: null, supportNeeds: null }),
  getFullFormData: () => {
    const { basicInfo, planDetails, contacts, supportNeeds } = get()
    if (!basicInfo || !planDetails) return null
    return { ...basicInfo, ...planDetails, ...contacts, ...supportNeeds }
  },
}))
```

**Step Component Pattern:**
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { basicInfoSchema, type BasicInfoData } from '@/lib/participants/schemas'
import { useParticipantFormStore } from '@/lib/participants/form-store'

export function StepBasicInfo({ onNext }: { onNext: () => void }) {
  const { basicInfo, setBasicInfo } = useParticipantFormStore()

  const form = useForm<BasicInfoData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: basicInfo ?? {
      first_name: '',
      last_name: '',
      ndis_number: '',
      date_of_birth: '',
      phone: '',
      email: '',
    },
  })

  const onSubmit = (data: BasicInfoData) => {
    setBasicInfo(data)
    onNext()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
        <Button type="submit">Next</Button>
      </form>
    </Form>
  )
}
```

### Pattern 2: Supabase Query with Search and Filter
**What:** Server-side filtering using Supabase `ilike` and `or` for multi-column text search + boolean filter for active/archived.
**When to use:** Participant list page with search bar and status filter.

```typescript
// hooks/use-participants.ts
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface UseParticipantsOptions {
  search?: string
  status?: 'active' | 'archived' | 'all'
}

export function useParticipants({ search, status = 'active' }: UseParticipantsOptions) {
  return useQuery({
    queryKey: ['participants', { search, status }],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('participants')
        .select(`
          *,
          ndis_plans!inner(id, start_date, end_date, total_budget, is_current),
          plan_budgets:ndis_plans(plan_budgets(allocated_amount, used_amount))
        `)
        .order('first_name')

      // Status filter
      if (status === 'active') {
        query = query.eq('is_active', true)
      } else if (status === 'archived') {
        query = query.eq('is_active', false)
      }
      // 'all' = no filter

      // Multi-column search
      if (search && search.trim()) {
        const term = `%${search.trim()}%`
        query = query.or(`first_name.ilike.${term},last_name.ilike.${term},ndis_number.ilike.${term}`)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}
```

### Pattern 3: TanStack Table DataTable Component
**What:** Reusable DataTable component with sorting, filtering, and pagination using shadcn/ui table components.
**When to use:** Participant list, and reusable for workers/shifts in future phases.

```typescript
'use client'

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@ephraimcare/ui/components/table'
import { Button } from '@ephraimcare/ui/components/button'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
  })

  return (
    <div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination controls */}
    </div>
  )
}
```

### Pattern 4: Budget Progress Bar with Traffic Light
**What:** Horizontal progress bar showing budget utilization with color thresholds (green < 70%, amber 70-90%, red > 90%).
**When to use:** Participant detail page and optionally in list view.

```typescript
'use client'

import { Progress } from '@ephraimcare/ui/components/progress'
import { formatAUD } from '@ephraimcare/utils'

interface BudgetProgressProps {
  allocated: number
  used: number
}

export function BudgetProgress({ allocated, used }: BudgetProgressProps) {
  const percentage = allocated > 0 ? Math.round((used / allocated) * 100) : 0

  const getColorClass = (pct: number) => {
    if (pct >= 90) return 'bg-red-500'
    if (pct >= 70) return 'bg-amber-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{formatAUD(used)} of {formatAUD(allocated)}</span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <Progress
        value={percentage}
        className="h-2"
        indicatorClassName={getColorClass(percentage)}
      />
    </div>
  )
}
```

### Pattern 5: Plan Countdown Badge
**What:** Badge showing days until plan ends with color coding (red < 30 days, amber < 60 days).
**When to use:** Participant detail page header, participant list row.

```typescript
'use client'

import { differenceInDays } from 'date-fns'
import { Badge } from '@ephraimcare/ui/components/badge'
import { getCurrentSydneyTime } from '@ephraimcare/utils'

interface PlanCountdownProps {
  endDate: string
}

export function PlanCountdown({ endDate }: PlanCountdownProps) {
  const now = getCurrentSydneyTime()
  const end = new Date(endDate)
  const daysRemaining = differenceInDays(end, now)

  if (daysRemaining < 0) {
    return <Badge variant="destructive">Plan expired</Badge>
  }

  const variant = daysRemaining < 30 ? 'destructive' : daysRemaining < 60 ? 'secondary' : 'default'

  return (
    <Badge variant={variant}>
      {daysRemaining} days remaining
    </Badge>
  )
}
```

### Pattern 6: Type-to-Confirm Archive Dialog
**What:** AlertDialog requiring admin to type participant's full name before archival is executed.
**When to use:** Archive button on participant detail page.

```typescript
'use client'

import { useState } from 'react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@ephraimcare/ui/components/alert-dialog'
import { Input } from '@ephraimcare/ui/components/input'

interface ArchiveDialogProps {
  participantName: string
  hasActiveShifts: boolean
  onConfirm: () => void
}

export function ArchiveDialog({ participantName, hasActiveShifts, onConfirm }: ArchiveDialogProps) {
  const [confirmText, setConfirmText] = useState('')
  const isConfirmed = confirmText === participantName

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={hasActiveShifts}>
          Archive Participant
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive {participantName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This participant will be hidden from the active list. This action cannot be undone.
            {hasActiveShifts && ' Cannot archive: participant has upcoming/active shifts.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-2">
            Type <span className="font-medium">{participantName}</span> to confirm:
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type participant's full name"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmText('')}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={!isConfirmed}>
            Archive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

### Pattern 7: TanStack Query Mutation for Create/Update/Archive
**What:** useMutation hooks with cache invalidation for participant CRUD operations.
**When to use:** All write operations on participants.

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useCreateParticipant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ParticipantCreateInput) => {
      const supabase = createClient()

      // Insert participant
      const { data: participant, error } = await supabase
        .from('participants')
        .insert({
          ...data.basicInfo,
          ...data.contacts,
          organization_id: data.organization_id,
        })
        .select()
        .single()

      if (error) throw error

      // Insert NDIS plan if provided
      if (data.planDetails) {
        const { error: planError } = await supabase
          .from('ndis_plans')
          .insert({
            participant_id: participant.id,
            ...data.planDetails,
            organization_id: data.organization_id,
          })
        if (planError) throw planError
      }

      return participant
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] })
    },
  })
}

export function useArchiveParticipant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (participantId: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('participants')
        .update({ is_active: false })
        .eq('id', participantId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] })
    },
  })
}
```

### Anti-Patterns to Avoid
- **Single useForm for all 4 steps:** Causes re-renders across all steps; use independent form instances per step with Zustand store.
- **Client-side-only search:** For future scalability, search should use Supabase `ilike` server-side, not just TanStack Table's built-in filter.
- **Storing budget calculations in the database:** Budget utilization percentage is a derived value -- compute it from `plan_budgets.used_amount / allocated_amount`, do not store it.
- **Hard delete for archive:** The requirement is soft delete via `is_active = false`. Never use SQL DELETE for participant records.
- **Inline editing of NDIS number or plan dates:** These are read-only per requirement PART-04. The edit form must disable/hide these fields.
- **Allowing archive with active shifts:** Per the CONTEXT.md decision, archival must be blocked if participant has upcoming/active shifts.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Data table with sorting/filter/pagination | Custom table with manual state | TanStack Table + shadcn/ui table | Handles edge cases (empty state, column resize, virtual scroll) |
| Multi-step form state | Custom Context/localStorage | Zustand store with per-step forms | Built-in devtools, simpler than Context, no prop drilling |
| Form validation | Manual if/else checks | Zod schemas + @hookform/resolvers | Type inference, composable, shared between frontend and potential API validation |
| Date countdown | Manual Date math | date-fns `differenceInDays` | Handles timezone, DST, leap years |
| Confirmation dialog | Custom modal | shadcn/ui AlertDialog | Accessible (focus trap, aria), animation built-in |
| Search debouncing | setTimeout/clearTimeout | useDebounce hook or useDeferredValue | React 19 useDeferredValue is built-in, no extra dependency |
| Loading skeletons | Custom animated divs | shadcn/ui Skeleton | Consistent with design system |
| Toast notifications | Custom notification system | shadcn/ui Toast (sonner) | Already part of shadcn ecosystem |

**Key insight:** The participant CRUD is conceptually simple (forms + tables + queries) but the multi-step form orchestration, search debouncing, optimistic updates, and soft-delete with business rule validation (no archive with active shifts) add real complexity. Using the established patterns prevents subtle bugs.

## Common Pitfalls

### Pitfall 1: NDIS Number Uniqueness Check Timing
**What goes wrong:** User fills all 4 form steps, submits, and gets a database unique constraint error on NDIS number.
**Why it happens:** Uniqueness is only checked at INSERT time by the database.
**How to avoid:** Check uniqueness on Step 1 blur/exit by querying `supabase.from('participants').select('id').eq('ndis_number', value)`. Show inline error immediately.
**Warning signs:** User reports "I filled the whole form and it failed at the end."

### Pitfall 2: Stale Search Results with TanStack Query
**What goes wrong:** Search results don't update when typing quickly, or show results from a previous search.
**Why it happens:** Each keystroke triggers a new query; old queries may resolve after newer ones.
**How to avoid:** Use `useDeferredValue` (React 19) or a debounce hook (300ms) for the search term before passing to useQuery. TanStack Query's `keepPreviousData: true` prevents flash of empty state.
**Warning signs:** Results flickering, wrong results showing briefly.

### Pitfall 3: Budget Calculation with No Plan
**What goes wrong:** Division by zero or NaN when participant has no current plan or plan has $0 budget.
**Why it happens:** Not all participants have an active plan; new participants have no plan_budgets records.
**How to avoid:** Guard with `allocated > 0` before calculating percentage. Show "No active plan" state instead of budget bar.
**Warning signs:** NaN%, Infinity%, or blank progress bars.

### Pitfall 4: Form State Leaking Between Creates
**What goes wrong:** After creating participant A, the form for participant B shows A's data.
**Why it happens:** Zustand store not reset after successful creation.
**How to avoid:** Call `store.reset()` in the mutation's `onSuccess` callback AND when navigating to `/participants/new`.
**Warning signs:** "Ghost data" appearing in fresh forms.

### Pitfall 5: RLS Blocking Create for Missing organization_id
**What goes wrong:** Insert fails silently or with a generic RLS error.
**Why it happens:** The `organization_id` must be included in the INSERT payload and must match the user's JWT claim.
**How to avoid:** Extract `organization_id` from the user's session/JWT and include it in every INSERT. Never let the form provide this value.
**Warning signs:** 403 or empty response on participant creation despite correct form data.

### Pitfall 6: Supabase `or` Filter Syntax
**What goes wrong:** Search returns no results despite matching data.
**Why it happens:** The `.or()` syntax uses dots not colons: `first_name.ilike.%term%` not `first_name ilike '%term%'`.
**How to avoid:** Use the exact PostgREST filter syntax. Test with a known value.
**Warning signs:** Search always returns empty, or returns all records.

### Pitfall 7: React 19 + React Hook Form watch() Infinite Loop
**What goes wrong:** Component re-renders infinitely when using `watch()`.
**Why it happens:** React 19 strict mode + React Hook Form's proxy-based watch can trigger re-render loops.
**How to avoid:** Use `useWatch({ control, name: 'field' })` instead of `form.watch('field')` for reactive field values. Avoid watching entire form.
**Warning signs:** Browser tab freezing, "Maximum update depth exceeded" error.

### Pitfall 8: Archive Check for Active Shifts
**What goes wrong:** Participant is archived while they have future shifts, breaking shift references.
**Why it happens:** Archive button is enabled without checking for upcoming shifts.
**How to avoid:** Before enabling archive, query `shifts` table for `participant_id` with `status IN ('scheduled', 'confirmed', 'in_progress')` and `scheduled_end > now()`. Disable button and show explanation if any exist.
**Warning signs:** Orphaned shifts referencing an archived participant.

## Code Examples

### Zod Schemas for Multi-Step Form

```typescript
// lib/participants/schemas.ts
import { z } from 'zod'

// Step 1: Basic Info
export const basicInfoSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  ndis_number: z.string()
    .regex(/^\d{9}$/, 'NDIS number must be exactly 9 digits')
    .refine((val) => val.startsWith('43'), 'NDIS number must start with 43'),
  date_of_birth: z.string().min(1, 'Date of birth is required')
    .refine((val) => {
      const dob = new Date(val)
      return dob < new Date() && dob > new Date('1900-01-01')
    }, 'Date of birth must be in the past'),
  phone: z.string()
    .regex(/^(\+61|0)[2-9]\d{8}$/, 'Invalid Australian phone number')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
})

// Step 2: Plan Details
export const planDetailsSchema = z.object({
  plan_number: z.string().optional(),
  plan_start_date: z.string().min(1, 'Plan start date is required'),
  plan_end_date: z.string().min(1, 'Plan end date is required'),
  total_budget: z.coerce.number()
    .min(0, 'Budget must be positive')
    .max(999999.99, 'Budget exceeds maximum'),
  budget_categories: z.array(z.object({
    category: z.string().min(1, 'Category required'),
    allocated_amount: z.coerce.number().min(0),
  })).optional(),
}).refine((data) => {
  if (data.plan_start_date && data.plan_end_date) {
    return new Date(data.plan_end_date) > new Date(data.plan_start_date)
  }
  return true
}, { message: 'Plan end date must be after start date', path: ['plan_end_date'] })

// Step 3: Contacts
export const contactsSchema = z.object({
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  suburb: z.string().optional(),
  state: z.string().default('NSW'),
  postcode: z.string()
    .regex(/^\d{4}$/, 'Postcode must be 4 digits')
    .optional()
    .or(z.literal('')),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string()
    .regex(/^(\+61|0)[2-9]\d{8}$/, 'Invalid Australian phone number')
    .optional()
    .or(z.literal('')),
})

// Step 4: Support Needs
export const supportNeedsSchema = z.object({
  notes: z.string().max(2000, 'Notes must be under 2000 characters').optional(),
  // Support needs can be extended with structured fields later
})

// Full schema (for edit form)
export const participantFullSchema = basicInfoSchema
  .merge(contactsSchema)
  .merge(supportNeedsSchema)

export type BasicInfoData = z.infer<typeof basicInfoSchema>
export type PlanDetailsData = z.infer<typeof planDetailsSchema>
export type ContactsData = z.infer<typeof contactsSchema>
export type SupportNeedsData = z.infer<typeof supportNeedsSchema>
```

### NDIS Number Uniqueness Check (debounced)

```typescript
// Used in Step 1 for real-time duplicate detection
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useCheckNdisNumber(ndisNumber: string, excludeId?: string) {
  return useQuery({
    queryKey: ['ndis-check', ndisNumber],
    queryFn: async () => {
      if (!ndisNumber || ndisNumber.length !== 9) return { exists: false }
      const supabase = createClient()
      let query = supabase
        .from('participants')
        .select('id')
        .eq('ndis_number', ndisNumber)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data } = await query
      return { exists: (data?.length ?? 0) > 0 }
    },
    enabled: ndisNumber.length === 9,
    staleTime: 30_000, // Cache for 30s
  })
}
```

### Column Definitions for Participant Table

```typescript
// components/participants/participant-columns.tsx
'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@ephraimcare/ui/components/badge'
import { Button } from '@ephraimcare/ui/components/button'
import { ArrowUpDown } from 'lucide-react'
import Link from 'next/link'
import type { Participant } from '@ephraimcare/types'

export const participantColumns: ColumnDef<Participant>[] = [
  {
    accessorFn: (row) => `${row.first_name} ${row.last_name}`,
    id: 'name',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link href={`/participants/${row.original.id}`} className="font-medium hover:underline">
        {row.original.first_name} {row.original.last_name}
      </Link>
    ),
  },
  {
    accessorKey: 'ndis_number',
    header: 'NDIS Number',
    cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span>,
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ getValue }) => (
      <Badge variant={getValue() ? 'default' : 'secondary'}>
        {getValue() ? 'Active' : 'Archived'}
      </Badge>
    ),
  },
]
```

### Server Component Data Fetching (List Page)

```typescript
// app/(protected)/participants/page.tsx
import { createClient } from '@/lib/supabase/server'
import { ParticipantList } from '@/components/participants/participant-list'

export default async function ParticipantsPage() {
  const supabase = await createClient()

  const { data: participants } = await supabase
    .from('participants')
    .select('*')
    .eq('is_active', true)
    .order('first_name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Participants</h1>
          <p className="text-sm text-muted-foreground">
            Manage NDIS participant records
          </p>
        </div>
      </div>
      <ParticipantList initialData={participants ?? []} />
    </div>
  )
}
```

### Active Shifts Check for Archive Blocking

```typescript
export function useHasActiveShifts(participantId: string) {
  return useQuery({
    queryKey: ['participant-active-shifts', participantId],
    queryFn: async () => {
      const supabase = createClient()
      const { count, error } = await supabase
        .from('shifts')
        .select('*', { count: 'exact', head: true })
        .eq('participant_id', participantId)
        .in('status', ['scheduled', 'confirmed', 'in_progress'])
        .gte('scheduled_end', new Date().toISOString())

      if (error) throw error
      return (count ?? 0) > 0
    },
    enabled: !!participantId,
  })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single useForm for wizard | Per-step useForm + Zustand store | 2024-2025 community consensus | Better performance, simpler validation |
| Custom table components | TanStack Table v8 + shadcn/ui | TanStack Table v8 (2023) | Headless, type-safe, plugin-based |
| react-hook-form watch() | useWatch() hook | RHF v7.45+ | Avoids re-render of parent, React 19 compatible |
| debounce with lodash | React 19 useDeferredValue | React 19 (2024) | Built-in, no library needed |
| sonner directly | shadcn/ui Toast (wraps sonner) | shadcn/ui 2024 | Consistent styling with design system |
| Manual loading states | TanStack Query isPending/isLoading | TanStack Query v5 | Declarative, handles race conditions |

**Deprecated/outdated:**
- `form.watch()` pattern: Use `useWatch()` instead for React 19 compatibility.
- Client-side only filtering for lists: Use server-side Supabase filters with TanStack Query caching.
- `useEffect` for data fetching: Use TanStack Query's `useQuery` or Next.js Server Components for initial data.

## Open Questions

1. **NDIS Number Format Discrepancy**
   - What we know: The requirement says "6-7 digits" but the actual NDIS participant number format is 9 digits starting with '43' (confirmed via NDIS documentation and existing codebase).
   - What's unclear: Whether the requirement is incorrect, or if there's a different number format being referenced.
   - Recommendation: Use the 9-digit format (`/^\d{9}$/` with `startsWith('43')`) as the existing migration and validator already implement. Flag to product owner for confirmation.

2. **Budget Used Amount Update Mechanism**
   - What we know: `plan_budgets.used_amount` is the field that tracks spending. The detail page shows percentage = `used_amount / allocated_amount * 100`.
   - What's unclear: In Phase 2, there are no invoices yet (that's a later phase). How will `used_amount` be populated for testing?
   - Recommendation: For Phase 2, show the budget bar based on whatever `used_amount` is in the database (seed data can include non-zero values). The actual update mechanism (from invoices) will be wired in the invoicing phase.

3. **Support Needs Schema Structure**
   - What we know: Step 4 is "support needs" but the `participants` table only has a `notes` text field.
   - What's unclear: Whether support needs should be structured data (goals, required services, communication preferences) or just freetext notes.
   - Recommendation: For Phase 2 MVP, use the `notes` field as freetext. If structured support needs are required, a separate `participant_support_needs` table can be added in a future migration. Keep the form step simple with a textarea for now.

4. **Participant Detail Page - Tabs vs Scrolling**
   - What we know: CONTEXT.md lists this as "Claude's discretion."
   - What's unclear: N/A - this is a design decision.
   - Recommendation: Use scrolling sections with a sticky section nav (anchor links). This keeps all data visible without hiding behind tabs, which is better for an admin tool where quick scanning of all info matters. Reserve tabs for future features (case notes history, shift history, invoices) that would make the page too long.

5. **Progress Component Custom Color**
   - What we know: shadcn/ui Progress component uses CSS variables for styling. We need to dynamically change the indicator color based on percentage.
   - What's unclear: Whether the Progress component accepts a custom `indicatorClassName` prop or needs wrapper styling.
   - Recommendation: Check the shadcn/ui Progress component source during implementation. If it doesn't support custom indicator class, use a custom implementation with a div + width percentage + Tailwind color classes. This is trivial to build.

## Sources

### Primary (HIGH confidence)
- Context7: `/react-hook-form/documentation` - FormProvider, useFormContext, Zod resolver patterns
- Context7: `/websites/ui_shadcn` - DataTable, Form, AlertDialog, Badge, Progress, Tabs components
- Context7: `/websites/tanstack_query_v5` - useMutation with optimistic updates, invalidateQueries
- Context7: `/websites/tanstack_table` - ColumnDef, accessorKey/accessorFn, global filter
- [Supabase JavaScript API - Using Filters](https://supabase.com/docs/reference/javascript/using-filters) - ilike, or() syntax
- Existing codebase: `supabase/migrations/20260124000006_create_participants.sql` - Schema definition
- Existing codebase: `supabase/migrations/20260124000008_create_ndis_plans.sql` - Plan/budget schema
- Existing codebase: `supabase/migrations/20260124000016_create_rls_policies.sql` - Participants RLS
- Existing codebase: `packages/utils/src/validators.ts` - Existing Zod schemas
- Existing codebase: `packages/types/src/domain.ts` - Participant, NdisPlan, PlanBudget types

### Secondary (MEDIUM confidence)
- [React Hook Form Advanced Usage - Wizard Form](https://react-hook-form.com/advanced-usage) - Official multi-step pattern
- [React Hook Form + Zustand + Zod multi-step pattern](https://www.buildwithmatija.com/blog/master-multi-step-forms-build-a-dynamic-react-form-in-6-simple-steps) - Community best practice 2025
- [NDIS Participant Reference Number](https://intercom.help/ssgpenelope/en/articles/5183341-ndis-participant-reference-number) - 9-digit format starting with 43
- [Supabase Discussion #6778](https://github.com/orgs/supabase/discussions/6778) - Multi-column ilike search with .or()

### Tertiary (LOW confidence)
- NDIS number "6-7 digits" in requirements: Contradicted by official NDIS documentation and existing codebase. Needs product owner confirmation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and verified in Phase 1; only @tanstack/react-table needs adding
- Architecture: HIGH - Patterns sourced from Context7 official docs for React Hook Form, shadcn/ui, TanStack Query/Table
- Form patterns: HIGH - Multi-step with Zustand is the established 2025 pattern, verified across multiple sources
- Validation: HIGH - Zod schemas based on actual database schema and NDIS number format from official sources
- Budget/countdown: HIGH - Simple derived calculations from existing schema fields
- Pitfalls: HIGH - Based on actual project constraints (RLS, React 19, existing schema)
- Support needs schema: LOW - Unclear whether structured or freetext; using simple notes for MVP

**Research date:** 2026-01-24
**Valid until:** 2026-02-23 (30 days - stable ecosystem, locked versions)
