---
phase: 07-invoicing
plan: 01
subsystem: database-schema
tags: [supabase, migration, invoicing, types, rls, triggers]
dependency-graph:
  requires: [phase-01-foundation, phase-04-shifts]
  provides: [invoicing-schema, invoice-types, rate-tables, gapless-numbering]
  affects: [07-02, 07-03, 07-04, 07-05, 07-06, 07-07]
tech-stack:
  added: []
  patterns: [atomic-counter, finalization-lock, day-type-rates]
key-files:
  created:
    - supabase/migrations/20260125100001_invoicing_phase7.sql
    - apps/admin/lib/invoices/types.ts
  modified: []
decisions:
  - "Gapless counter uses INSERT ON CONFLICT DO UPDATE (atomic, no race conditions)"
  - "INV-YYYY-NNN format (3-digit padding, resets per year per org)"
  - "Finalization trigger blocks UPDATE on submitted/paid (not cancelled/overdue)"
  - "day_type check constraint on invoice_line_items (not enum for flexibility)"
  - "support_type_rates effective_from with UNIQUE on (type, org, date) for versioning"
metrics:
  duration: 2m
  completed: 2026-01-25
---

# Phase 7 Plan 01: Database Schema & Types Summary

**One-liner:** Invoicing schema with day-type rates, gapless numbering counter, finalization lock trigger, and full TypeScript domain types.

## What Was Done

### Task 1: Phase 7 Database Migration
Created `supabase/migrations/20260125100001_invoicing_phase7.sql` with 15 sections:

1. **ALTER invoices** - Added period_start, period_end, finalized_at, finalized_by columns
2. **ALTER invoice_line_items** - Added support_type, day_type (with CHECK constraint), scheduled_minutes, actual_minutes, billable_minutes
3. **CREATE support_type_rates** - Per-day-type rates (weekday/saturday/sunday/public_holiday) with org scoping and effective_from versioning
4. **CREATE public_holidays** - Date + name + org, unique per date/org
5. **CREATE invoice_number_counter** - Year + sequence + org for gapless numbering
6. **DROP old trigger/function** - Removed generate_invoice_number() and its trigger
7. **CREATE next_invoice_number()** - SECURITY DEFINER function using INSERT ON CONFLICT for atomic increment, returns INV-YYYY-NNN
8. **CREATE prevent_finalized_invoice_edit()** - Blocks UPDATE on submitted/paid invoices
9. **CREATE TRIGGER** - trg_prevent_finalized_edit on invoices BEFORE UPDATE
10. **ENABLE RLS** - On all 3 new tables
11. **RLS: support_type_rates** - Admin/coordinator full access, all authenticated read
12. **RLS: public_holidays** - Admin full access, all authenticated read
13. **RLS: invoice_number_counter** - Admin/coordinator full access
14. **moddatetime trigger** - On support_type_rates for updated_at
15. **Audit triggers** - On support_type_rates and public_holidays (DO block pattern)

### Task 2: TypeScript Domain Types
Created `apps/admin/lib/invoices/types.ts` with 10 exports:

| Export | Type | Purpose |
|--------|------|---------|
| DayType | union | weekday/saturday/sunday/public_holiday |
| InvoiceStatus | union | draft/pending/submitted/paid/overdue/cancelled |
| SupportTypeRate | interface | Rate configuration per support type and day |
| PublicHoliday | interface | Holiday dates for day-type classification |
| Invoice | interface | Full invoice record with new period/finalization fields |
| InvoiceLineItem | interface | Line item with support_type, day_type, minutes breakdown |
| InvoiceWithLineItems | composite | Invoice joined with line_items array |
| InvoiceWithParticipant | composite | Invoice joined with participant name/NDIS |
| GenerateInvoicePayload | interface | Input for invoice generation RPC |
| InvoiceGenerationResult | interface | Output from invoice generation |

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

1. **Gapless counter atomicity** - INSERT ON CONFLICT DO UPDATE guarantees no gaps even under concurrent requests
2. **3-digit padding** - lpad(sequence, 3, '0') supports up to 999 invoices per year before needing migration
3. **Finalization scope** - Only blocks submitted/paid (not cancelled/overdue) since those may need admin correction
4. **CHECK constraint not enum** - day_type uses CHECK for flexibility (same pattern as support_type text)
5. **Effective_from versioning** - UNIQUE on (support_type, org, effective_from) allows rate history without deleting old rates

## Verification Results

- Migration file: 227 lines, all 15 sections present
- DROP TRIGGER before CREATE FUNCTION: confirmed (lines 89-90 before line 93)
- INSERT ON CONFLICT pattern: confirmed (lines 107-109)
- INV-YYYY-NNN format: confirmed (line 113)
- Finalization trigger targets submitted/paid: confirmed (line 125)
- TypeScript: compiles with --strict --noEmit (zero errors)
- All 10 exports present and correctly typed

## Next Phase Readiness

All subsequent plans (07-02 through 07-07) can now reference:
- `support_type_rates` table for rate lookups
- `public_holidays` table for day-type classification
- `next_invoice_number()` RPC for generating invoice numbers
- `Invoice`, `InvoiceLineItem`, `SupportTypeRate` types for TypeScript code
- Finalization trigger protects submitted/paid invoices automatically
