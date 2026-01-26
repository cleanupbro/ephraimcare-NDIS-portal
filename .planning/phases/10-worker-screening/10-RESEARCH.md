# Phase 10: Worker Screening - Research

**Researched:** 2026-01-26
**Domain:** Form-level validation blocking, warning with override, dashboard widgets, compliance enforcement
**Confidence:** HIGH

## Summary

This phase adds active compliance enforcement to the shift assignment workflow and a dashboard widget for compliance visibility. The requirements specify three discrete capabilities: (1) blocking shift assignment when a worker has an expired NDIS check (hard error), (2) warning when a worker's NDIS check expires within 90 days (yellow warning with override), and (3) a dashboard widget showing workers with expired or expiring checks.

The codebase already has all the foundational pieces in place from Phase 3 and Phase 4:
- Worker compliance data stored as columns on the `workers` table (`ndis_check_expiry`, `wwcc_expiry`)
- The `getComplianceStatus()` function in `lib/workers/constants.ts` that returns `valid`, `expiring`, `expired`, or `not_set`
- The 90-day threshold constant already defined (`EXPIRING_THRESHOLD_DAYS = 90`)
- The shift form with established patterns for hard errors (`setError`) and overridable warnings (`ShiftConflictDialog`)
- The admin dashboard page with a card-based layout

The implementation path is straightforward: extend the shift form's `onSubmit` validation to check worker NDIS expiry status before the existing conflict detection, add a new conflict type for `screening_expiring` to the dialog, and add a server-side query widget to the dashboard page.

**Primary recommendation:** Add NDIS check validation to shift form (blocking expired, warning expiring), reuse existing `ShiftConflictDialog` for the 90-day warning, and add a server-fetched compliance widget to the dashboard. No new tables, migrations, or dependencies required.

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| date-fns | ^4.1.0 | isPast, isBefore, addDays for expiry calculations | Already used in worker compliance logic |
| @tanstack/react-query | ^5.65.0 | Dashboard widget data fetching | Already used everywhere |
| react-hook-form | ^7.54.0 | Form setError for hard validation | Already in shift form |
| lucide-react | ^0.469.0 | Shield, AlertTriangle icons | Already used in compliance display |

### Supporting (Already Available)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @ephraimcare/ui | workspace:* | Card, Badge for dashboard widget | Dashboard compliance widget |

### No New Dependencies Required

All requirements can be implemented with existing libraries. The compliance status logic is already implemented.

**Installation:**
```bash
# No installation needed
```

## Architecture Patterns

### Recommended Project Structure

```
apps/admin/
├── app/(protected)/
│   └── page.tsx                              # Dashboard - add ComplianceWidget
├── components/
│   ├── dashboard/
│   │   └── compliance-widget.tsx             # NEW: Workers with expiring/expired checks
│   └── shifts/
│       ├── shift-form.tsx                    # MODIFY: Add NDIS expiry validation
│       └── shift-conflict-dialog.tsx         # MODIFY: Add 'screening_expiring' type
└── lib/workers/
    └── constants.ts                          # Already has getComplianceStatus (no changes)
```

No new migrations, hooks, or API routes required.

### Pattern 1: Hard Error Blocking (setError)

**What:** Form validation that prevents submission with a clear field-level error.
**When to use:** When the action is not allowed under any circumstances (expired screening = regulatory violation).
**Already established in:** `shift-form.tsx` lines 241-246 for support type mismatch.

```typescript
// Source: apps/admin/components/shifts/shift-form.tsx (existing pattern)
const selectedWorker = workers.find((w) => w.id === data.worker_id)
if (selectedWorker && !selectedWorker.services_provided?.includes(data.support_type)) {
  setError('worker_id', {
    message: `Worker does not provide "${data.support_type}" support. Select a qualified worker.`,
  })
  return
}
```

**For NDIS expiry blocking:**
```typescript
// Add before conflict detection in onSubmit
const selectedWorker = workers.find((w) => w.id === data.worker_id)
const ndisStatus = getComplianceStatus(selectedWorker?.ndis_check_expiry)

if (ndisStatus === 'expired') {
  setError('worker_id', {
    message: `Worker's NDIS check has expired. Cannot assign to new shifts until renewed.`,
  })
  return
}
```

### Pattern 2: Warning with Override (ShiftConflictDialog)

**What:** Detected issues shown in a dialog; user can acknowledge and proceed.
**When to use:** When the action is allowed but requires awareness (expiring check within 90 days).
**Already established in:** `shift-form.tsx` with `ShiftConflictDialog` for overlaps and plan date warnings.

```typescript
// Source: apps/admin/components/shifts/shift-conflict-dialog.tsx (existing)
export type ConflictWarning = {
  type: 'overlap' | 'plan_dates' | 'support_type'
  message: string
  details?: string
}
```

**For screening expiry warning:**
```typescript
// Extend the type
export type ConflictWarning = {
  type: 'overlap' | 'plan_dates' | 'support_type' | 'screening_expiring'  // Add new type
  message: string
  details?: string
}

// Add to CONFLICT_LABELS
const CONFLICT_LABELS: Record<ConflictWarning['type'], string> = {
  overlap: 'Schedule Overlap',
  plan_dates: 'Plan Period',
  support_type: 'Service Mismatch',
  screening_expiring: 'Compliance Warning',  // NEW
}

// Add to CONFLICT_COLORS
const CONFLICT_COLORS: Record<ConflictWarning['type'], string> = {
  overlap: 'text-red-600',
  plan_dates: 'text-amber-600',
  support_type: 'text-orange-600',
  screening_expiring: 'text-amber-500',  // NEW - amber for warning
}
```

### Pattern 3: Dashboard Widget (Server-Side Query)

**What:** Server component fetches data and renders a widget card.
**When to use:** Static display of aggregated/filtered data on dashboard.
**Already established in:** `app/(protected)/page.tsx` with `DashboardCard` components.

```typescript
// Source: apps/admin/app/(protected)/page.tsx (existing pattern)
const [participants, workers, shifts, invoices] = await Promise.all([
  supabase.from('participants').select('id', { count: 'exact', head: true }),
  supabase.from('workers').select('id', { count: 'exact', head: true }),
  // ...
])

return (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <DashboardCard title="Participants" value={String(participants.count ?? 0)} href="/participants" />
    {/* ... */}
  </div>
)
```

**For compliance widget:**
```typescript
// Query workers with expiring or expired NDIS checks
const today = new Date().toISOString().split('T')[0]
const ninetyDaysFromNow = addDays(new Date(), 90).toISOString().split('T')[0]

const { data: complianceWorkers } = await supabase
  .from('workers')
  .select('id, ndis_check_expiry, wwcc_expiry, profiles!inner(first_name, last_name)')
  .eq('is_active', true)
  .or(`ndis_check_expiry.lt.${today},ndis_check_expiry.lt.${ninetyDaysFromNow}`)
  .order('ndis_check_expiry', { ascending: true })
  .limit(10)
```

### Anti-Patterns to Avoid

- **Blocking WWCC expiry in shift form:** Requirement SCRN-01 specifies only NDIS check. WWCC blocking would be scope creep.
- **Creating a separate compliance API route:** Dashboard widget is server-rendered; no need for client-side API.
- **Putting validation in a mutation hook:** Hard errors should be in the form's `onSubmit` before async operations.
- **Duplicating compliance logic:** Reuse `getComplianceStatus()` from `lib/workers/constants.ts`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Expiry date calculations | Manual date math | `getComplianceStatus()` + date-fns | Already exists, tested, handles edge cases |
| Warning dialog | New component | Extend `ShiftConflictDialog` | Established pattern, already styled |
| Dashboard widget styling | Custom cards | Existing `Card` component pattern | Consistent with current dashboard |
| Form field errors | Alert banner | `setError('worker_id', {...})` | Matches support type mismatch pattern |

**Key insight:** This phase is almost entirely wiring existing patterns together. No new infrastructure, just connecting compliance status to existing form validation and dashboard display.

## Common Pitfalls

### Pitfall 1: Blocking Both NDIS and WWCC

**What goes wrong:** Implementing blocking for WWCC when requirement only specifies NDIS.
**Why it happens:** Natural assumption that both compliance checks should behave the same.
**How to avoid:** Read requirement SCRN-01 carefully: "System blocks assigning worker with expired **NDIS check**". WWCC is not mentioned for blocking.
**Warning signs:** Tests or code referring to WWCC in shift form validation.

### Pitfall 2: Making Expiring Warning Unoverridable

**What goes wrong:** Treating `expiring` status like `expired` and blocking the form.
**Why it happens:** Conflating the two validation levels.
**How to avoid:** Requirement SCRN-02 explicitly says "yellow warning, allows override". Use the dialog pattern, not setError.
**Warning signs:** No "Create Anyway" button for 90-day warning.

### Pitfall 3: Dashboard Widget Showing Inactive Workers

**What goes wrong:** Compliance widget includes workers who are no longer active.
**Why it happens:** Forgetting the `.eq('is_active', true)` filter.
**How to avoid:** Always filter workers query by `is_active = true` for operational views.
**Warning signs:** Deactivated workers appearing in the compliance widget.

### Pitfall 4: Race Condition with Worker Select

**What goes wrong:** Worker compliance not checked because worker data hasn't loaded yet.
**Why it happens:** Shift form fetches workers async; validation runs before data arrives.
**How to avoid:** The validation only runs on submit, and the worker select is disabled until data loads. The existing pattern handles this.
**Warning signs:** Form allows submission before workers array is populated.

### Pitfall 5: Missing Null Check on Expiry Date

**What goes wrong:** Calling `getComplianceStatus(null)` returns `not_set`, not `expired`.
**Why it happens:** Worker may have no NDIS check entered.
**How to avoid:** The `getComplianceStatus()` function already handles null correctly (returns `not_set`). The decision from STATE.md is that `not_set` is NOT blocked - only `expired` is blocked. Verify this is the correct business logic.
**Warning signs:** Workers with no NDIS data being blocked or warned inappropriately.

## Code Examples

### Check Compliance Before Conflicts

```typescript
// apps/admin/components/shifts/shift-form.tsx - in onSubmit function

async function onSubmit(data: ShiftCreateFormData) {
  // EXISTING: Hard validation for support type mismatch
  const selectedWorker = workers.find((w) => w.id === data.worker_id)
  if (selectedWorker && !selectedWorker.services_provided?.includes(data.support_type)) {
    setError('worker_id', {
      message: `Worker does not provide "${data.support_type}" support. Select a qualified worker.`,
    })
    return
  }

  // NEW: Hard validation for expired NDIS check (SCRN-01)
  const ndisStatus = getComplianceStatus(selectedWorker?.ndis_check_expiry ?? null)
  if (ndisStatus === 'expired') {
    setError('worker_id', {
      message: `Worker's NDIS check has expired (${formatExpiryDate(selectedWorker?.ndis_check_expiry)}). Cannot assign to new shifts until renewed.`,
    })
    return
  }

  setIsChecking(true)
  try {
    const detected = await checkConflicts(data)

    // NEW: Add expiring NDIS check warning (SCRN-02)
    if (ndisStatus === 'expiring') {
      detected.push({
        type: 'screening_expiring',
        message: `Worker's NDIS check expires soon`,
        details: `Expiry date: ${formatExpiryDate(selectedWorker?.ndis_check_expiry)}. Consider scheduling check renewal.`,
      })
    }

    if (detected.length > 0) {
      setConflicts(detected)
      setShowConflictDialog(true)
      return
    }

    await createShiftFromData(data)
  } finally {
    setIsChecking(false)
  }
}

// Helper function (add to file or import from constants)
function formatExpiryDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Not set'
  try {
    return format(parseISO(dateStr), 'd MMM yyyy')
  } catch {
    return 'Invalid date'
  }
}
```

### Extended Conflict Dialog Types

```typescript
// apps/admin/components/shifts/shift-conflict-dialog.tsx

export type ConflictWarning = {
  type: 'overlap' | 'plan_dates' | 'support_type' | 'screening_expiring'
  message: string
  details?: string
}

const CONFLICT_LABELS: Record<ConflictWarning['type'], string> = {
  overlap: 'Schedule Overlap',
  plan_dates: 'Plan Period',
  support_type: 'Service Mismatch',
  screening_expiring: 'Compliance Warning',
}

const CONFLICT_COLORS: Record<ConflictWarning['type'], string> = {
  overlap: 'text-red-600',
  plan_dates: 'text-amber-600',
  support_type: 'text-orange-600',
  screening_expiring: 'text-amber-500',
}
```

### Dashboard Compliance Widget

```typescript
// apps/admin/components/dashboard/compliance-widget.tsx
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@ephraimcare/ui'
import { Shield, AlertTriangle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import { getComplianceStatus, COMPLIANCE_COLORS, type ComplianceStatus } from '@/lib/workers/constants'

interface ComplianceWorker {
  id: string
  ndis_check_expiry: string | null
  wwcc_expiry: string | null
  profiles: {
    first_name: string
    last_name: string
  }
}

interface ComplianceWidgetProps {
  workers: ComplianceWorker[]
}

export function ComplianceWidget({ workers }: ComplianceWidgetProps) {
  if (workers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-green-600" />
            Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All workers have valid screening checks.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Compliance Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {workers.map((worker) => {
          const ndisStatus = getComplianceStatus(worker.ndis_check_expiry)
          const isExpired = ndisStatus === 'expired'
          return (
            <Link
              key={worker.id}
              href={`/workers/${worker.id}`}
              className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium">
                  {worker.profiles.first_name} {worker.profiles.last_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  NDIS check {isExpired ? 'expired' : 'expires'}: {worker.ndis_check_expiry ? format(parseISO(worker.ndis_check_expiry), 'd MMM yyyy') : 'Not set'}
                </p>
              </div>
              <Badge variant={isExpired ? 'destructive' : 'secondary'}>
                {isExpired ? 'Expired' : 'Expiring'}
              </Badge>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
```

### Dashboard Page Integration

```typescript
// apps/admin/app/(protected)/page.tsx - add to imports
import { addDays } from 'date-fns'
import { ComplianceWidget } from '@/components/dashboard/compliance-widget'

// In the component, add to the Promise.all queries:
const ninetyDaysFromNow = addDays(new Date(), 90).toISOString().split('T')[0]
const today = new Date().toISOString().split('T')[0]

const { data: complianceWorkers } = await supabase
  .from('workers')
  .select('id, ndis_check_expiry, wwcc_expiry, profiles!inner(first_name, last_name)')
  .eq('is_active', true)
  .or(`ndis_check_expiry.lt.${today},ndis_check_expiry.lte.${ninetyDaysFromNow}`)
  .order('ndis_check_expiry', { ascending: true, nullsFirst: false })
  .limit(10)

// In the JSX, add the widget in the grid:
<div className="grid gap-4 md:grid-cols-2">
  {/* Existing Quick Actions and Upcoming Shifts cards */}
  <div>...</div>
  <div>...</div>

  {/* NEW: Compliance Widget - spans full width */}
  <div className="md:col-span-2">
    <ComplianceWidget workers={(complianceWorkers ?? []) as any} />
  </div>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate compliance table | Columns on workers table | Phase 3 decision | Simpler queries, no joins needed |
| Complex RLS for compliance | Same workers RLS | Phase 3 | No additional policies needed |
| Real-time compliance checks | On-demand at form submit | Industry standard | Avoids unnecessary complexity |

**Deprecated/outdated:**
- Separate `worker_screening_checks` table: Decided against in Phase 3 for MVP simplicity.
- Real-time compliance subscriptions: Not needed; check at shift creation is sufficient.

## Open Questions

1. **WWCC Warning Behavior**
   - What we know: SCRN-01 only mentions NDIS check for blocking. SCRN-02 mentions NDIS check for warning.
   - What's unclear: Should WWCC expiring also trigger a warning? The requirements don't mention it.
   - Recommendation: Implement only NDIS check validation as specified. Add WWCC later if requested.

2. **Dashboard Widget Limit**
   - What we know: Showing all workers could make the widget very long.
   - What's unclear: How many workers to show, and whether to paginate.
   - Recommendation: Limit to 10 workers with a "View all" link to the workers page filtered by compliance status. This keeps the dashboard clean while providing visibility.

3. **"Not Set" Compliance Treatment**
   - What we know: `getComplianceStatus(null)` returns `not_set`.
   - What's unclear: Should workers with no NDIS check data be blocked, warned, or allowed?
   - Recommendation: Allow (current behavior). Blocking would break existing workers who haven't had compliance data entered. Add a note in the dashboard widget for workers with missing checks.

## Sources

### Primary (HIGH confidence)
- Codebase: `apps/admin/components/shifts/shift-form.tsx` - existing validation patterns
- Codebase: `apps/admin/components/shifts/shift-conflict-dialog.tsx` - warning dialog structure
- Codebase: `apps/admin/lib/workers/constants.ts` - `getComplianceStatus()` function
- Codebase: `apps/admin/app/(protected)/page.tsx` - dashboard card patterns
- Codebase: `apps/admin/components/workers/worker-compliance.tsx` - compliance display patterns

### Secondary (MEDIUM confidence)
- STATE.md decisions: Worker compliance stored as columns, 90-day threshold, StatusBadge patterns
- ROADMAP.md requirements: SCRN-01, SCRN-02, SCRN-03 specifications

### Tertiary (LOW confidence)
- None - all requirements are covered by existing codebase patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all patterns exist
- Architecture: HIGH - minimal new files, direct pattern reuse
- Form validation: HIGH - exact match of existing support type validation pattern
- Dashboard widget: HIGH - follows existing server-side fetch + card pattern
- Pitfalls: MEDIUM - some edge cases around null handling need verification

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (stable patterns, existing infrastructure)
