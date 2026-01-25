---
phase: 07-invoicing
plan: 04
subsystem: invoicing
tags: [api, invoice-generation, billing, lesser-of-rule, line-items]
status: complete

dependency-graph:
  requires:
    - 07-01 (schema + tables)
    - 07-02 (calculations + schemas)
    - 07-03 (rates + holidays settings)
  provides:
    - Invoice generation API POST /api/invoices/generate
    - Generate invoice form page /invoices/generate
    - useGenerateInvoice mutation hook
  affects:
    - 07-05 (invoice detail page consumes generated invoices)
    - 07-06 (PDF/CSV export works on generated invoices)
    - 07-07 (PACE export works on finalized invoices)

tech-stack:
  patterns:
    - Lesser-of billing rule (calculateBillableMinutes)
    - Tiered rates by day type (weekday/saturday/sunday/public_holiday)
    - Sequential invoice numbers via PostgreSQL RPC
    - Rate snapshots into line items at generation time
    - react-hook-form + Zod validation for form

key-files:
  created:
    - apps/admin/app/api/invoices/generate/route.ts
    - apps/admin/app/(protected)/invoices/generate/page.tsx
  modified:
    - apps/admin/hooks/use-invoices.ts (added useGenerateInvoice)

decisions:
  - id: lesser-of-rule
    choice: "Billable minutes = min(scheduled duration, actual duration)"
    rationale: "INVC-02 requirement for NDIS compliance"
  - id: rate-snapshot
    choice: "Unit price stored in line item at generation time"
    rationale: "Rates may change; invoice must reflect rates at time of service"
  - id: missing-rate-skip
    choice: "Shifts without configured rates are skipped (with console warning)"
    rationale: "Better to generate partial invoice than fail entirely"

metrics:
  duration: 3m 32s
  completed: 2026-01-25
---

# Phase 7 Plan 04: Invoice Generation Flow Summary

Invoice generation API + form page for creating invoices from completed shifts.

## What Was Built

### 1. Invoice Generation API (`/api/invoices/generate`)

POST endpoint that:
- Validates participant_id + period_start + period_end
- Fetches completed shifts with check-in data
- Calculates billable minutes using lesser-of rule
- Detects day type (weekday/saturday/sunday/public_holiday)
- Generates sequential invoice number via `next_invoice_number` RPC
- Creates invoice record + line items with rate snapshots
- Returns 400 if no shifts or no rates configured
- Returns 201 with created invoice and line items

Key implementation details:
```typescript
// Lesser-of rule for billing
const billableMinutes = calculateBillableMinutes(
  scheduledStart, scheduledEnd,
  actualStart, actualEnd
)

// Day type detection (holidays take priority)
const dayType = getDayType(scheduledStart, holidayDates)

// Rate selection by day type
const unitPrice = getRate(matchedRate, dayType)
```

### 2. Generate Invoice Page (`/invoices/generate`)

Client component with:
- Participant selector (name + NDIS number display)
- Date range inputs (default to previous month)
- react-hook-form + Zod validation
- Loading state while generating
- Error display from API (no shifts, no rates)
- Redirect to invoice detail on success

### 3. Invoice Hooks (`useGenerateInvoice`)

Added to existing hooks file:
- Calls POST /api/invoices/generate
- Invalidates invoices query on success
- Toast notifications for success/error
- Returns invoice data for redirect

## Files Changed

| File | Action | Lines |
|------|--------|-------|
| `apps/admin/app/api/invoices/generate/route.ts` | Created | 300 |
| `apps/admin/app/(protected)/invoices/generate/page.tsx` | Created | 222 |
| `apps/admin/hooks/use-invoices.ts` | Modified | +42 |

## Verification Results

| Check | Status |
|-------|--------|
| API route exports POST | Pass |
| API imports from calculations.ts | Pass |
| API calls supabase.rpc('next_invoice_number') | Pass |
| API checks for empty shifts array | Pass |
| useGenerateInvoice calls /api/invoices/generate | Pass |
| Generate page has participant selector | Pass |
| Generate page has date range inputs | Pass |
| Generate page redirects on success | Pass |
| Page has 80+ lines (222 actual) | Pass |

## Success Criteria Verification

| Requirement | Status | Evidence |
|-------------|--------|----------|
| INVC-01: Admin generates invoice for participant | Pass | Generate page + API |
| INVC-02: Lesser of scheduled vs actual | Pass | calculateBillableMinutes used |
| INVC-03: Exact minutes (no rounding) | Pass | differenceInMinutes direct |
| INVC-04: Rate multiplied by hours | Pass | calculateLineTotal function |
| INVC-07: Sequential INV-YYYY-NNN | Pass | next_invoice_number RPC |
| Rates snapshotted into line items | Pass | unit_price stored per item |

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| 1d4531f | feat(07-04): add invoice generation API route |
| 3945e03 | feat(07-04): add generate invoice form page |

## Next Steps

- 07-05: Invoice detail page (preview line items, finalize action)
- 07-06: PDF and CSV export
- 07-07: PACE bulk export
