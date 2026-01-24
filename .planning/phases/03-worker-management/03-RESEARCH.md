# Phase 3: Worker Management - Research

**Researched:** 2026-01-24
**Domain:** CRUD worker profiles, compliance dates, Supabase Auth invite flow, scheduling stats
**Confidence:** HIGH

## Summary

This phase adds worker management to the admin portal: list, create, detail, and edit views for worker profiles that include support types, qualifications, and NDIS/WWCC compliance checks. It also implements the invite-link onboarding flow (worker sets their own password) and the worker login on the mobile app.

The standard approach follows the **exact patterns established in Phase 2** (participant management): server-side initial fetch + client TanStack Query, DataTable with columns, search/filter bar, detail page with Cards, Zod schemas for form validation, and dedicated hook files. The key new technical concerns are: (1) the Supabase `auth.admin.inviteUserByEmail` flow requiring a Next.js API Route with `SUPABASE_SERVICE_ROLE_KEY`, (2) the `worker_screening_checks` table addition for NDIS Worker Check and WWCC data, (3) computing scheduling stats (hours this week/month, next shift) via Supabase queries, and (4) compliance status derivation (valid/expiring/expired).

**Primary recommendation:** Mirror the participant CRUD patterns exactly, add a Next.js API route (`/api/workers/invite`) using the admin client for auth user creation + invite, extend the workers DB table with a `worker_screening_checks` related table for compliance dates, and compute scheduling stats via a Supabase RPC or client-side query on shifts.

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.49.0 | Auth admin API (inviteUserByEmail), data queries | Already in project, auth.admin needs service_role |
| @tanstack/react-query | ^5.65.0 | Client-side data fetching + caching | Same pattern as participants |
| @tanstack/react-table | ^8.21.0 | Worker list DataTable | Same pattern as participants |
| react-hook-form | ^7.54.0 | Form state management | Same pattern as participants |
| @hookform/resolvers | ^3.9.0 | Zod resolver for RHF | Same pattern as participants |
| zod | ^3.24.0 | Schema validation | Same pattern as participants |
| zustand | ^5.0.0 | Multi-step form store (if multi-step chosen) | Same pattern as participants |
| date-fns | ^4.1.0 | Date formatting, expiry calculations | Already used in participant detail |
| lucide-react | ^0.469.0 | Icons (Shield, ShieldCheck, Clock, etc.) | Already in project |

### Supporting (Already Available)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @ephraimcare/ui | workspace:* | shadcn/ui components (Badge, Card, Button, Input, Select, Table) | All UI elements |
| @ephraimcare/types | workspace:* | Domain types (Worker, Profile) | Type safety across app |
| @ephraimcare/supabase | workspace:* | createAdminClient() for service_role operations | Worker invite API route |

### No New Dependencies Required

The existing stack covers all Phase 3 needs. No new packages need to be installed.

## Architecture Patterns

### Recommended Project Structure

```
apps/admin/
├── app/(protected)/workers/
│   ├── page.tsx                    # Server component: list page
│   ├── new/page.tsx                # Server component: create form page
│   └── [id]/
│       ├── page.tsx                # Server component: detail page
│       └── edit/page.tsx           # Server component: edit form page
├── app/api/workers/
│   └── invite/route.ts             # API Route: invite worker (service_role)
├── components/workers/
│   ├── worker-list.tsx             # Client component: list with search
│   ├── worker-search.tsx           # Client component: search + filter bar
│   ├── worker-columns.tsx          # Column definitions for DataTable
│   ├── worker-detail.tsx           # Client component: detail view
│   ├── worker-form/
│   │   └── index.tsx               # Worker creation form
│   ├── worker-edit-form.tsx        # Worker edit form
│   ├── worker-compliance.tsx       # Compliance section (checks display)
│   └── worker-stats.tsx            # Stat cards (hours, next shift)
├── hooks/
│   ├── use-workers.ts              # Query + mutation hooks (list, detail, update)
│   ├── use-create-worker.ts        # Create worker mutation (calls API route)
│   └── use-worker-stats.ts         # Scheduling stats queries
└── lib/workers/
    ├── schemas.ts                  # Zod validation schemas
    └── constants.ts                # Support types, qualification options
```

```
supabase/migrations/
└── 20260124100001_add_worker_screening_checks.sql  # New table for compliance
```

### Pattern 1: Server-Side Initial Fetch + Client TanStack Query (LIST)

**What:** Server component fetches initial data, passes to client component which uses TanStack Query for interactivity.
**When to use:** All list pages.
**Example:**

```typescript
// app/(protected)/workers/page.tsx (Server Component)
export default async function WorkersPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('workers')
    .select('*, profiles!inner(first_name, last_name, email, phone)')
    .eq('is_active', true)
    .order('profiles(first_name)')

  return <WorkerList initialData={data ?? []} />
}

// components/workers/worker-list.tsx (Client Component)
export function WorkerList({ initialData }: { initialData: WorkerWithProfile[] }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive' | 'all'>('active')
  const deferredSearch = useDeferredValue(search)

  const { data: workers, isLoading } = useWorkers({ search: deferredSearch, status })
  const displayData = workers ?? initialData ?? []

  return (
    <div className="space-y-4">
      <WorkerSearch search={search} status={status} onSearchChange={setSearch} onStatusChange={setStatus} />
      <DataTable columns={workerColumns} data={displayData} />
    </div>
  )
}
```

### Pattern 2: API Route for Service-Role Operations (INVITE)

**What:** Next.js API route handler uses `createAdminClient()` with service_role key to invoke `auth.admin.inviteUserByEmail`.
**When to use:** Any operation requiring elevated auth privileges (user creation, admin-only mutations).
**Why:** The service_role key must NEVER be exposed to the browser. API routes run server-side only.
**Example:**

```typescript
// app/api/workers/invite/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@ephraimcare/supabase'

export async function POST(request: Request) {
  // 1. Verify caller is admin/coordinator
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'coordinator'].includes((profile as any).role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Parse request body
  const body = await request.json()
  const { email, first_name, last_name, ...workerData } = body

  // 3. Create auth user with invite
  const admin = createAdminClient()
  const { data: authData, error: authError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { first_name, last_name, role: 'worker' },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  // 4. Create profile + worker records
  const userId = authData.user.id
  const orgId = (profile as any).organization_id

  await admin.from('profiles').insert({
    id: userId,
    role: 'worker',
    first_name,
    last_name,
    email,
    organization_id: orgId,
  } as any)

  const { data: worker, error: workerError } = await admin.from('workers').insert({
    profile_id: userId,
    organization_id: orgId,
    ...workerData,
  } as any).select('id').single()

  if (workerError) return NextResponse.json({ error: workerError.message }, { status: 500 })

  return NextResponse.json({ id: (worker as any).id, user_id: userId })
}
```

### Pattern 3: Compliance Status Derivation

**What:** Compute compliance status from expiry dates: valid (green), expiring within 90 days (amber), expired (red).
**When to use:** Worker list traffic light dot and detail page compliance section.
**Example:**

```typescript
// lib/workers/constants.ts
import { differenceInDays, isPast, isBefore, addDays } from 'date-fns'

export type ComplianceStatus = 'valid' | 'expiring' | 'expired' | 'not_set'

export function getComplianceStatus(expiryDate: string | null): ComplianceStatus {
  if (!expiryDate) return 'not_set'
  const expiry = new Date(expiryDate)
  if (isPast(expiry)) return 'expired'
  if (isBefore(expiry, addDays(new Date(), 90))) return 'expiring'
  return 'valid'
}

export function getOverallComplianceStatus(
  ndisExpiry: string | null,
  wwccExpiry: string | null
): ComplianceStatus {
  const ndis = getComplianceStatus(ndisExpiry)
  const wwcc = getComplianceStatus(wwccExpiry)
  // Worst status wins
  if (ndis === 'expired' || wwcc === 'expired') return 'expired'
  if (ndis === 'expiring' || wwcc === 'expiring') return 'expiring'
  if (ndis === 'not_set' && wwcc === 'not_set') return 'not_set'
  return 'valid'
}
```

### Pattern 4: Scheduling Stats via Supabase Queries

**What:** Query shifts table for hours worked this week/month and next upcoming shift.
**When to use:** Worker detail page stat cards.
**Example:**

```typescript
// hooks/use-worker-stats.ts
export function useWorkerStats(workerId: string | undefined) {
  return useQuery({
    queryKey: ['worker-stats', workerId],
    queryFn: async () => {
      const supabase = createClient()
      const now = new Date()
      const startOfWeek = startOfISOWeek(now)
      const startOfMonth = startOfMonthFn(now)

      // Hours this week (completed shifts)
      const { data: weekShifts } = await supabase
        .from('shifts')
        .select('actual_start, actual_end')
        .eq('worker_id', workerId!)
        .eq('status', 'completed')
        .gte('scheduled_start', startOfWeek.toISOString())

      // Hours this month
      const { data: monthShifts } = await supabase
        .from('shifts')
        .select('actual_start, actual_end')
        .eq('worker_id', workerId!)
        .eq('status', 'completed')
        .gte('scheduled_start', startOfMonth.toISOString())

      // Next shift
      const { data: nextShift } = await supabase
        .from('shifts')
        .select('*, participants!inner(first_name, last_name)')
        .eq('worker_id', workerId!)
        .in('status', ['scheduled', 'confirmed'])
        .gte('scheduled_start', now.toISOString())
        .order('scheduled_start')
        .limit(1)
        .maybeSingle()

      return {
        hoursThisWeek: calculateTotalHours(weekShifts ?? []),
        hoursThisMonth: calculateTotalHours(monthShifts ?? []),
        nextShift: nextShift ?? null,
      }
    },
    enabled: !!workerId,
  })
}

function calculateTotalHours(shifts: { actual_start: string | null; actual_end: string | null }[]): number {
  return shifts.reduce((total, shift) => {
    if (!shift.actual_start || !shift.actual_end) return total
    const hours = differenceInMinutes(new Date(shift.actual_end), new Date(shift.actual_start)) / 60
    return total + hours
  }, 0)
}
```

### Pattern 5: Worker + Profile Join Query

**What:** Workers table references profiles table. List queries must join to get name/email.
**When to use:** Worker list and detail pages.
**Example:**

```typescript
// The workers table stores worker-specific data (qualifications, services, rates)
// The profiles table stores identity data (name, email, phone, role)
// Always join when displaying workers:

const { data } = await supabase
  .from('workers')
  .select(`
    *,
    profiles!inner(first_name, last_name, email, phone),
    worker_screening_checks(*)
  `)
  .eq('organization_id', orgId)
```

### Anti-Patterns to Avoid

- **Storing credentials in email:** NEVER send a password in the welcome email. Use Supabase invite link flow (worker sets own password).
- **Calling service_role from client:** NEVER import `createAdminClient` in client components or hooks. Always use API routes.
- **Mixing profile and worker data in one insert:** Create auth user first, then profile, then worker record -- in sequence. If any step fails, the previous records become orphans. Handle with try/catch and cleanup.
- **Computing compliance status on the server only:** Compute in the client too -- if the page stays open past midnight, the status needs to update. Use the pure function approach.
- **Hardcoding support types:** Use a constants file or eventually a DB table. The CONTEXT.md leaves support type input as Claude's discretion.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| User invitation flow | Custom token + email sending | `supabase.auth.admin.inviteUserByEmail` | Handles token generation, expiry, email template, password setup page |
| Compliance date logic | Manual date comparison | `date-fns` (isPast, isBefore, addDays, differenceInDays) | Timezone handling, edge cases, already in project |
| Form validation | Manual if/else checks | Zod schemas + @hookform/resolvers | Composable, type-safe, consistent with Phase 2 |
| Search debouncing | setTimeout/useEffect | `useDeferredValue` (React 19) | Native React 19 pattern, already used in participants |
| Data table | Custom table with sorting/pagination | @tanstack/react-table via DataTable component | Already built and working in participant list |
| Multi-step form state | useState spaghetti | Zustand store (if multi-step) | Matches participant form pattern exactly |
| Auth role verification | Custom JWT parsing | `is_admin_or_coordinator()` RLS function + middleware | Already implemented in Phase 1 |

**Key insight:** This phase is almost entirely a "repeat of Phase 2 patterns with worker-specific fields." The only genuinely new technical concern is the invite-link auth flow via API route.

## Common Pitfalls

### Pitfall 1: Race Condition in Worker Creation

**What goes wrong:** Creating auth user, profile, and worker in sequence -- if profile insert fails, orphan auth user exists.
**Why it happens:** Three separate inserts with no transaction wrapper (Supabase client doesn't support multi-table transactions directly).
**How to avoid:** Use the admin client for all three inserts in the API route. If worker insert fails, delete the auth user and profile. Alternatively, use a Supabase Edge Function or database function for atomic creation.
**Warning signs:** Workers with auth accounts but no profile or worker record; users who can't log in despite receiving invite.

### Pitfall 2: Invite Email Not Sending (Local Dev)

**What goes wrong:** `inviteUserByEmail` succeeds but no email arrives.
**Why it happens:** Supabase local dev uses Inbucket for email (accessible at localhost:54324). Production needs custom SMTP configured.
**How to avoid:** During dev, check Inbucket at `http://localhost:54324`. For production, configure SMTP in Supabase dashboard. The invite link is also returned in the API response `data.user` for testing.
**Warning signs:** `authError` is null but worker never receives email.

### Pitfall 3: Invite Link Expiry Not Matching Requirement

**What goes wrong:** Supabase default invite token expiry is 24 hours, but requirement says 7 days.
**Why it happens:** Default Supabase auth settings.
**How to avoid:** Configure `GOTRUE_MAILER_INVITE_EXPIRE` or set in Supabase dashboard under Auth > URL Configuration > Token expiry. In `config.toml` for local dev, set `[auth] invite_token_expiry = "168h"` (7 days = 168 hours).
**Warning signs:** Workers report "link expired" when clicking invite after a few days.

### Pitfall 4: Worker Profile Type Mismatch with Profiles Table

**What goes wrong:** Worker creation fails because profiles table requires `organization_id` as UUID but it's passed as string, or role enum doesn't match.
**Why it happens:** The `as any` type assertions hide mismatches until runtime.
**How to avoid:** Validate all fields before insert. Use the same type assertion pattern as participant creation (`as any` for postgrest-js v12 Generic issue). Test the full flow in integration tests.
**Warning signs:** "invalid input value for enum app_role" or foreign key constraint errors.

### Pitfall 5: Search Not Finding Workers by Email

**What goes wrong:** Worker search by email returns nothing because email is on profiles table, not workers table.
**Why it happens:** The `.or()` filter only works on the primary table columns.
**How to avoid:** For email search, use a subquery approach or filter on the joined profiles relation: `.or('profiles.first_name.ilike.%term%,profiles.last_name.ilike.%term%,profiles.email.ilike.%term%')` -- but PostgREST `.or()` with joined tables has limitations. Consider using a Postgres function or view for worker search, or do the join and filter server-side.
**Warning signs:** Name search works but email search returns empty results.

### Pitfall 6: Compliance Checks Table vs Worker Table

**What goes wrong:** Adding screening check columns directly to workers table leads to a messy schema as more check types are added later.
**Why it happens:** Temptation to keep everything in one table for simplicity.
**How to avoid:** Create a separate `worker_screening_checks` table with a type enum (ndis_worker_check, wwcc). Each row has check_number, expiry_date, and worker_id. This is extensible for future check types. However, given the CONTEXT.md specifies only 2 check types and they're always shown together, columns on workers table is also acceptable for MVP simplicity.
**Warning signs:** Schema feels wrong when adding a third check type later.

## Code Examples

### Worker Screening Checks Migration

```sql
-- Option A: Separate table (extensible)
create table public.worker_screening_checks (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id) on delete cascade,
  check_type text not null check (check_type in ('ndis_worker_check', 'wwcc')),
  check_number text,
  expiry_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(worker_id, check_type)
);

create index idx_screening_checks_worker on worker_screening_checks(worker_id);
create index idx_screening_checks_expiry on worker_screening_checks(expiry_date);

alter table worker_screening_checks enable row level security;

create policy "Org members can view screening checks"
  on worker_screening_checks for select
  to authenticated
  using (
    worker_id in (
      select id from workers where organization_id = get_user_organization_id()
    )
  );

create policy "Admin can manage screening checks"
  on worker_screening_checks for all
  to authenticated
  using (
    worker_id in (
      select id from workers
      where organization_id = get_user_organization_id()
      and is_admin_or_coordinator()
    )
  );

create trigger handle_updated_at
  before update on public.worker_screening_checks
  for each row execute procedure moddatetime(updated_at);

create trigger audit_worker_screening_checks
  after insert or update or delete on public.worker_screening_checks
  for each row execute function audit.audit_trigger_func();
```

```sql
-- Option B: Columns on workers table (simpler for MVP, 2 check types only)
alter table public.workers
  add column ndis_check_number text,
  add column ndis_check_expiry date,
  add column wwcc_number text,
  add column wwcc_expiry date;
```

**Recommendation:** Use Option B (columns on workers table) for MVP. Only 2 check types are specified, both are always displayed together on the detail page, and it avoids an extra join. If a third check type is needed later, migrate to Option A.

### Worker Zod Schema

```typescript
// lib/workers/schemas.ts
import { z } from 'zod'

export const workerBasicSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Must be a valid email address'),
  phone: z.string()
    .regex(/^(\+61|0)[2-9]\d{8}$/, 'Must be a valid Australian phone number')
    .optional()
    .or(z.literal('')),
})

export const workerDetailsSchema = z.object({
  services_provided: z.array(z.string()).min(1, 'At least one support type is required'),
  qualification: z.array(z.string()).optional().default([]),
  hourly_rate: z.coerce.number().min(0).optional(),
  max_hours_per_week: z.coerce.number().min(1).max(168).default(38),
})

export const workerComplianceSchema = z.object({
  ndis_check_number: z.string().optional().or(z.literal('')),
  ndis_check_expiry: z.string().optional().or(z.literal('')),
  wwcc_number: z.string().optional().or(z.literal('')),
  wwcc_expiry: z.string().optional().or(z.literal('')),
})

export const workerFullSchema = workerBasicSchema
  .merge(workerDetailsSchema)
  .merge(workerComplianceSchema)

export const workerEditSchema = workerBasicSchema
  .omit({ email: true })  // Email is read-only (primary key)
  .merge(workerDetailsSchema)
  .merge(workerComplianceSchema)

export type WorkerBasicData = z.infer<typeof workerBasicSchema>
export type WorkerDetailsData = z.infer<typeof workerDetailsSchema>
export type WorkerComplianceData = z.infer<typeof workerComplianceSchema>
export type WorkerFullData = z.infer<typeof workerFullSchema>
export type WorkerEditData = z.infer<typeof workerEditSchema>
```

### Worker Domain Type Extension

```typescript
// packages/types/src/domain.ts (addition)
export interface WorkerWithProfile extends Worker {
  profiles: {
    first_name: string
    last_name: string
    email: string
    phone: string | null
  }
}

export interface WorkerScreeningCheck {
  id: string
  worker_id: string
  check_type: 'ndis_worker_check' | 'wwcc'
  check_number: string | null
  expiry_date: string | null
  created_at: string
  updated_at: string
}
```

### Compliance Traffic Light Component

```typescript
// components/workers/worker-compliance-dot.tsx
import { cn } from '@ephraimcare/ui'
import { getOverallComplianceStatus, type ComplianceStatus } from '@/lib/workers/constants'

const statusColors: Record<ComplianceStatus, string> = {
  valid: 'bg-green-500',
  expiring: 'bg-amber-500',
  expired: 'bg-red-500',
  not_set: 'bg-gray-300',
}

export function ComplianceDot({ ndisExpiry, wwccExpiry }: { ndisExpiry: string | null; wwccExpiry: string | null }) {
  const status = getOverallComplianceStatus(ndisExpiry, wwccExpiry)
  return (
    <span
      className={cn('inline-block h-3 w-3 rounded-full', statusColors[status])}
      title={`Compliance: ${status}`}
    />
  )
}
```

### Resend Invite Endpoint

```typescript
// app/api/workers/resend-invite/route.ts
export async function POST(request: Request) {
  // Verify admin, get worker email, then:
  const admin = createAdminClient()

  // Generate a new invite link for existing user
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'invite',
    email: workerEmail,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // The link is automatically emailed by Supabase if SMTP is configured
  // For custom email content, use the returned link with your own email service
  return NextResponse.json({ success: true })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `supabase.auth.api.generateLink()` | `supabase.auth.admin.inviteUserByEmail()` or `generateLink({ type: 'invite' })` | supabase-js v2 | Old v1 API removed; use admin namespace |
| Password in welcome email | Invite link (user sets own password) | Industry standard | More secure, no plaintext passwords in email |
| Per-component useForm with FormProvider | Per-step independent useForm (React 19) | Phase 2 decision | Avoids FormProvider issues with React 19 concurrent |
| External debounce library | `useDeferredValue` (React 19) | React 19 | Native, no extra dependency |

**Deprecated/outdated:**
- `supabase.auth.api.*` (v1): Removed in supabase-js v2. Use `supabase.auth.admin.*` with service_role key.
- Sending temporary passwords via email: Security anti-pattern. Always use invite/magic link flows.

## Open Questions

1. **Email template customization for worker invite**
   - What we know: Supabase supports custom invite email templates via `config.toml` (local) or dashboard (production). Template uses `{{ .ConfirmationURL }}` variable.
   - What's unclear: How to include "assigned support types" and "mobile app intro" in the invite email as specified in CONTEXT.md. The Supabase invite template only has access to standard variables.
   - Recommendation: Either (a) customize the Supabase invite template with generic welcome text and handle the detail email separately, or (b) use `generateLink` to get the token URL, then send a fully custom email via a mail service (Resend, SendGrid). For MVP, option (a) with a simple customized template is sufficient. The "informative" content about support types can be shown on the password-setup landing page instead.

2. **Worker search across joined tables**
   - What we know: PostgREST `.or()` with joined table columns has limitations. The participants search works because name and NDIS number are on the same table.
   - What's unclear: Whether `.or('profiles.email.ilike.%term%')` works correctly with an `!inner` join in PostgREST.
   - Recommendation: Test this in implementation. Fallback: create a Postgres view `worker_list_view` that denormalizes name + email from profiles, or do two queries (name match + email match) and merge.

3. **Invite link expiry configuration**
   - What we know: Requirement is 7 days. Supabase default is 24 hours.
   - What's unclear: Whether this is configurable per-invite or only globally.
   - Recommendation: Set globally in Supabase auth config. Add to `config.toml`: `[auth] invite_token_expiry = "168h"`. Verify in Supabase dashboard for production.

4. **Form layout decision (multi-step vs single page)**
   - What we know: CONTEXT.md says "Claude's discretion based on field count."
   - Analysis: Worker form has ~10-12 fields total (name, email, phone, support types, qualifications, hourly rate, max hours, 4 compliance fields). This is fewer than participant (which has 4 steps with ~15 fields). A single-page form with sections is appropriate.
   - Recommendation: **Single-page form with visual sections** (Basic Info, Support Types & Qualifications, Compliance Checks). No Zustand store needed. Simpler than participant's multi-step.

## Sources

### Primary (HIGH confidence)
- Project codebase analysis: `apps/admin/components/participants/` - established CRUD patterns
- Project codebase: `supabase/migrations/20260124000007_create_workers.sql` - existing schema
- Project codebase: `packages/supabase/src/admin.ts` - existing admin client setup
- Project codebase: `supabase/migrations/20260124000016_create_rls_policies.sql` - existing workers RLS
- Context7 `/supabase/supabase` - inviteUserByEmail, email templates, generateLink API
- Context7 `/supabase/supabase-js` - auth.admin API, signUp flow

### Secondary (MEDIUM confidence)
- Supabase docs on invite email templates (verified via Context7): template variables, customization
- Supabase docs on auth SMTP configuration: production email delivery requirements

### Tertiary (LOW confidence)
- PostgREST `.or()` with joined table columns: behavior needs implementation testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and patterns established in Phase 2
- Architecture: HIGH - direct mirror of participant patterns with one new concern (API route for invite)
- Database schema: HIGH - existing workers table + straightforward extension
- Invite flow: MEDIUM - Supabase inviteUserByEmail is well-documented but custom email content has limitations
- Pitfalls: HIGH - based on actual codebase patterns and known PostgREST behaviors

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (stable patterns, no fast-moving dependencies)
