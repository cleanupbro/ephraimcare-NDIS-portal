# Phase 8: Participant Portal - Research

**Researched:** 2026-01-25
**Domain:** Next.js App Router read-only dashboard with Supabase RLS-enforced data access
**Confidence:** HIGH

## Summary

This phase implements a read-only participant portal where NDIS participants can view their plan status, budget utilization, upcoming appointments, and download finalized invoices. The implementation builds heavily on existing patterns from the admin portal, requiring minimal new libraries.

The primary technical challenge is adapting the existing middleware and protected layout patterns to enforce participant-level data isolation (not just organization-level). The existing RLS policies already handle this - participants can only see their own data via `participant_id in (select id from participants where profile_id = auth.uid())` checks.

The portal is purely informational with no edit capabilities, which simplifies the implementation significantly. The existing `@react-pdf/renderer` infrastructure from Phase 7 can be reused for invoice PDF downloads, though the API route needs a participant-accessible variant.

**Primary recommendation:** Clone the admin portal authentication patterns, create a simpler sidebar with fewer nav items (Dashboard, Invoices, Profile), and leverage existing RLS policies that already enforce participant-level data isolation.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.0 | App Router framework | Already in use, proven patterns in admin portal |
| @supabase/ssr | 0.6.0 | Server-side auth | Already configured with proper cookie handling |
| @tanstack/react-query | 5.65.0 | Data fetching & caching | Already in use, provides staleTime for read-only data |
| @ephraimcare/ui | workspace | Shared components | Progress, Dialog, Card, Table already available |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.1.0 | Date calculations | Days remaining, date formatting |
| lucide-react | 0.469.0 | Icons | Download, calendar, profile icons |
| @react-pdf/renderer | (via admin) | PDF generation | Invoice download (route already exists) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @tanstack/react-query | SWR | Query already in use, consistency wins |
| Custom progress bar | @ephraimcare/ui Progress | UI package already has Progress component |

**Installation:**
```bash
# No new packages needed - all dependencies already in apps/participant/package.json
```

## Architecture Patterns

### Recommended Project Structure
```
apps/participant/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx           # Centered card layout (copy from admin)
│   │   └── login/
│   │       └── page.tsx         # Email/password form
│   ├── (protected)/
│   │   ├── layout.tsx           # Sidebar + role verification
│   │   ├── page.tsx             # Dashboard (redirect to /dashboard)
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Budget hero + plan info + appointments
│   │   ├── invoices/
│   │   │   └── page.tsx         # Invoice list with modal preview
│   │   └── profile/
│   │       └── page.tsx         # Read-only profile view
│   ├── api/
│   │   └── invoices/
│   │       └── [id]/
│   │           └── pdf/
│   │               └── route.ts  # PDF download (participant-scoped)
│   └── layout.tsx               # Root layout with providers
├── components/
│   ├── dashboard/
│   │   ├── budget-hero.tsx      # Large progress bar + amounts
│   │   ├── plan-info-card.tsx   # Plan period, days remaining
│   │   ├── appointments-card.tsx # Next 3-5 upcoming shifts
│   │   └── expired-plan-banner.tsx # Red/orange alert banner
│   └── invoices/
│       ├── invoice-table.tsx    # Simple table with download buttons
│       └── invoice-preview-modal.tsx # Line items preview
├── hooks/
│   ├── use-participant-dashboard.ts # Fetch plan, budget, appointments
│   └── use-participant-invoices.ts  # Fetch finalized invoices
├── lib/
│   └── supabase/
│       ├── client.ts            # Browser client (copy from admin)
│       └── server.ts            # Server client (copy from admin)
└── middleware.ts                # Auth redirect (already exists)
```

### Pattern 1: Protected Layout with Participant Role Verification
**What:** Server component layout that verifies user has `participant` role and retrieves their participant record
**When to use:** Root layout for all protected routes
**Example:**
```typescript
// Source: Adapted from apps/admin/app/(protected)/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify participant role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name, last_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'participant') {
    redirect('/unauthorized')
  }

  // Get linked participant record
  const { data: participant } = await supabase
    .from('participants')
    .select('id, first_name, last_name, ndis_number')
    .eq('profile_id', user.id)
    .single()

  if (!participant) {
    redirect('/unauthorized') // No linked participant record
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar participant={participant} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
```

### Pattern 2: Read-Only Data Fetching with RLS
**What:** Client-side hooks that fetch participant-scoped data (RLS handles filtering)
**When to use:** Dashboard, invoices, profile pages
**Example:**
```typescript
// Source: Adapted from apps/admin/hooks/use-participants.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface DashboardData {
  participant: {
    first_name: string
    last_name: string
    ndis_number: string
  }
  plan: {
    start_date: string
    end_date: string
    total_budget: number
    used_budget: number
  } | null
  upcomingShifts: Array<{
    id: string
    scheduled_start: string
    scheduled_end: string
    workers: { profiles: { first_name: string; last_name: string } }
  }>
}

export function useParticipantDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['participant-dashboard'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // RLS filters to only this participant's data automatically
      const { data: participant } = await supabase
        .from('participants')
        .select('id, first_name, last_name, ndis_number')
        .eq('profile_id', user!.id)
        .single()

      const { data: plan } = await supabase
        .from('ndis_plans')
        .select('*')
        .eq('participant_id', participant!.id)
        .eq('status', 'active')
        .maybeSingle()

      const { data: shifts } = await supabase
        .from('shifts')
        .select('id, scheduled_start, scheduled_end, workers(profiles(first_name, last_name))')
        .eq('participant_id', participant!.id)
        .in('status', ['scheduled', 'confirmed'])
        .gte('scheduled_start', new Date().toISOString())
        .order('scheduled_start', { ascending: true })
        .limit(5)

      return { participant: participant!, plan, upcomingShifts: shifts || [] }
    },
    staleTime: 60 * 1000, // 1 minute - data is mostly static
  })
}
```

### Pattern 3: Budget Progress Bar with Color Thresholds
**What:** Reusable component that displays budget with color-coded progress
**When to use:** Dashboard hero section
**Example:**
```typescript
// Source: Adapted from apps/admin/components/participants/participant-budget.tsx
'use client'

import { Progress } from '@ephraimcare/ui'
import { cn } from '@ephraimcare/ui'

interface BudgetHeroProps {
  allocated: number
  used: number
}

function formatAUD(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
  }).format(amount)
}

function getBarColorClass(percentage: number): string {
  if (percentage >= 90) return 'bg-red-500'
  if (percentage >= 75) return 'bg-amber-500'
  return 'bg-green-500'
}

export function BudgetHero({ allocated, used }: BudgetHeroProps) {
  const percentage = allocated > 0 ? Math.min(Math.round((used / allocated) * 100), 100) : 0
  const remaining = Math.max(allocated - used, 0)
  const colorClass = getBarColorClass(percentage)

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="text-sm font-medium text-muted-foreground">Budget Status</h2>
      <div className="mt-4 space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-bold">{formatAUD(used)}</span>
          <span className="text-muted-foreground">of {formatAUD(allocated)} used</span>
        </div>
        <div className="h-4 w-full rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all', colorClass)}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className={cn('font-semibold', percentage >= 90 ? 'text-red-600' : percentage >= 75 ? 'text-amber-600' : 'text-green-600')}>
            {percentage}% used
          </span>
          <span className="text-muted-foreground">{formatAUD(remaining)} remaining</span>
        </div>
      </div>
      {percentage >= 90 && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
          Your budget is nearly exhausted. Contact your coordinator for assistance.
        </div>
      )}
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Fetching all data in layout:** Layouts should only fetch minimal profile data; heavy data fetching belongs in page components with React Query for caching
- **Duplicating RLS logic in code:** Trust RLS policies; don't add redundant `WHERE participant_id = X` checks that could drift from RLS
- **Using SSR for everything:** Dashboard data can be client-fetched; only auth verification needs server-side
- **Creating participant-specific API routes when RLS suffices:** Direct Supabase queries are cleaner than custom API routes for read-only data

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Progress bar with colors | Custom div + CSS | @ephraimcare/ui Progress + Tailwind classes | Already styled, accessible |
| Date calculations | Manual date math | date-fns differenceInDays, format | Edge cases, timezones |
| PDF generation | New PDF template | Existing InvoicePDF component | Already built in Phase 7 |
| Auth middleware | Custom cookie handling | Existing middleware.ts pattern | Cookie handling is tricky |
| Modal dialogs | Custom portal logic | @ephraimcare/ui Dialog | Accessibility, focus trap |

**Key insight:** The admin portal has already solved most of these problems. The participant portal should reuse patterns, not reinvent them.

## Common Pitfalls

### Pitfall 1: Participant Without Linked Profile
**What goes wrong:** User authenticates but has no participant record linked via `profile_id`
**Why it happens:** Participant was created without enabling portal access
**How to avoid:** Check for linked participant in protected layout, redirect to error page with helpful message
**Warning signs:** "Cannot read properties of null" errors on dashboard

### Pitfall 2: Expired or Missing NDIS Plan
**What goes wrong:** Dashboard crashes or shows confusing empty state
**Why it happens:** Participant's plan has ended or was never entered
**How to avoid:** Use `.maybeSingle()` for plan queries, show explicit "No active plan" state
**Warning signs:** Plan-related queries returning null unexpectedly

### Pitfall 3: PDF Download Permission Denied
**What goes wrong:** Participant can see invoice in list but PDF download returns 403
**Why it happens:** Admin PDF route checks for `is_admin_or_coordinator()`, not participant
**How to avoid:** Create participant-specific PDF route that uses RLS instead of role check
**Warning signs:** 403 errors only on PDF download, not on invoice list

### Pitfall 4: Budget Calculation Mismatch
**What goes wrong:** Dashboard shows different budget than admin portal
**Why it happens:** Using stale data or different calculation source
**How to avoid:** Use `used_budget` column from `ndis_plans` table (same source as admin)
**Warning signs:** Participant complains numbers don't match what coordinator showed them

### Pitfall 5: Middleware Not Refreshing Session
**What goes wrong:** Participant gets logged out unexpectedly after session expires
**Why it happens:** Supabase SSR requires middleware to refresh sessions on page load
**How to avoid:** Ensure middleware.ts uses proper `setAll` cookie handler pattern
**Warning signs:** Sporadic auth errors, "session expired" after idle time

## Code Examples

Verified patterns from official sources and existing codebase:

### Invoice List with Preview Modal
```typescript
// Source: Adapted from apps/admin/hooks/use-invoices.ts
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Button
} from '@ephraimcare/ui'
import { Download } from 'lucide-react'

interface Invoice {
  id: string
  invoice_number: string
  invoice_date: string
  total: number
  status: string
}

export function InvoiceList() {
  const [previewInvoice, setPreviewInvoice] = useState<string | null>(null)

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['participant-invoices'],
    queryFn: async () => {
      const supabase = createClient()
      // RLS filters to only this participant's non-draft invoices
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, invoice_date, total, status')
        .neq('status', 'draft')
        .order('invoice_date', { ascending: false })

      if (error) throw error
      return data || []
    },
  })

  if (isLoading) return <div>Loading invoices...</div>
  if (!invoices?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No invoices yet. Your invoices will appear here once finalized.
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell
                className="cursor-pointer hover:underline"
                onClick={() => setPreviewInvoice(invoice.id)}
              >
                {invoice.invoice_number}
              </TableCell>
              <TableCell>{new Date(invoice.invoice_date).toLocaleDateString('en-AU')}</TableCell>
              <TableCell className="text-right">${invoice.total.toFixed(2)}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a href={`/api/invoices/${invoice.id}/pdf`} download>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <InvoicePreviewModal
        invoiceId={previewInvoice}
        onClose={() => setPreviewInvoice(null)}
      />
    </>
  )
}
```

### Participant-Scoped PDF Route
```typescript
// Source: Adapted from apps/admin/app/api/invoices/[id]/pdf/route.ts
import { NextResponse } from 'next/server'
import { pdf } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { InvoicePDF } from '@/components/pdf/InvoicePDF'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: invoiceId } = await params
  const supabase = await createClient()

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // Verify user is a participant
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'participant') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  // RLS will enforce that participant can only access their own invoices
  // The policy: participant_id in (select id from participants where profile_id = auth.uid())
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, invoice_line_items(*), participants(first_name, last_name, ndis_number)')
    .eq('id', invoiceId)
    .neq('status', 'draft') // Participants can't see drafts
    .single()

  if (error || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  // Generate PDF (reuse existing component)
  const invoiceData = { ...invoice, line_items: invoice.invoice_line_items || [] }
  const pdfBlob = await pdf(InvoicePDF({ invoice: invoiceData })).toBlob()
  const arrayBuffer = await pdfBlob.arrayBuffer()

  return new Response(arrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`,
    },
  })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| getSession() for auth | getUser() for auth | Supabase SSR 0.5+ | getUser() validates with server, more secure |
| Page-level auth checks | Middleware + layout auth | Next.js 13+ App Router | Consistent protection, no flicker |
| Custom fetch for data | React Query hooks | Industry standard | Caching, deduplication, loading states |
| Manual session refresh | Middleware auto-refresh | Supabase SSR pattern | No stale sessions |

**Deprecated/outdated:**
- `supabase.auth.getSession()` in server components: Use `getUser()` instead - getSession reads from cookies without validation
- Individual API routes for each query: Direct Supabase calls with RLS are simpler for read-only data

## Open Questions

Things that couldn't be fully resolved:

1. **Invoice PDF Component Location**
   - What we know: `InvoicePDF` component exists in `apps/admin/components/pdf/`
   - What's unclear: Should it be moved to shared package or imported cross-workspace?
   - Recommendation: Create a shared `@ephraimcare/pdf` package or duplicate the component in participant app (simpler)

2. **Budget Warning Threshold Exact Display**
   - What we know: User decided 75% = yellow, 90% = red
   - What's unclear: Whether 90%+ warning needs a toast/notification or just inline message
   - Recommendation: Inline message in BudgetHero component (matches decisions in CONTEXT.md)

## Sources

### Primary (HIGH confidence)
- `/vercel/next.js` Context7 - App Router layouts, protected routes, server components
- `/supabase/ssr` Context7 - Middleware authentication pattern, createServerClient cookie handling
- Existing codebase `apps/admin/` - Proven patterns for auth, hooks, components

### Secondary (MEDIUM confidence)
- `/websites/radix-ui-primitives` Context7 - Progress component API and data attributes

### Tertiary (LOW confidence)
- None - all patterns verified against existing codebase or official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use and configured
- Architecture: HIGH - Direct adaptation of existing admin portal patterns
- Pitfalls: HIGH - Based on actual codebase structure and RLS policies
- Code examples: HIGH - Adapted from working code in the repository

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (stable - no rapidly changing dependencies)
