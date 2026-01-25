---
phase: 07-invoicing
plan: 02
subsystem: invoicing-logic
tags: [billing, calculations, zod, csv, ndis, pace]
dependency_graph:
  requires: [07-01]
  provides: [billing-calculations, invoice-schemas, pace-csv-export, invoice-constants]
  affects: [07-03, 07-04, 07-05, 07-06, 07-07]
tech_stack:
  added: []
  patterns: [pure-functions, zod-coerce, lesser-of-billing, currency-rounding]
file_tracking:
  key_files:
    created:
      - apps/admin/lib/invoices/calculations.ts
      - apps/admin/lib/invoices/constants.ts
      - apps/admin/lib/invoices/schemas.ts
      - apps/admin/lib/invoices/csv-export.ts
    modified: []
decisions:
  - id: inv-rounding
    description: "Math.round(x * 100) / 100 for all currency calculations (3 places in calculations.ts)"
  - id: inv-lesser-of
    description: "calculateBillableMinutes uses Math.min(scheduled, actual) - INVC-02 compliance"
  - id: inv-public-holiday-priority
    description: "getDayType checks public holidays FIRST before day-of-week (a Saturday public holiday gets PH rate)"
  - id: inv-csv-no-escaping
    description: "PACE CSV uses plain comma join (no escaping needed - all fields are controlled numeric/date/code values)"
  - id: inv-gst-p1
    description: "PACE GST code is P1 (taxable) for all NDIS disability support services"
metrics:
  duration: ~3min
  completed: 2026-01-25
---

# Phase 7 Plan 02: Billing Calculations and Validation Summary

**One-liner:** Pure billing math (lesser-of rule, day-type rates, 10% GST), Zod form schemas, and 16-column PACE CSV export for NDIS bulk claims.

## What Was Built

### calculations.ts (7 exported functions)
- `calculateBillableMinutes` - Lesser-of-scheduled-vs-actual rule (INVC-02), exact minutes (INVC-03)
- `getDayType` - Public holiday priority detection, then saturday/sunday/weekday
- `getRate` - Select tier rate from SupportTypeRate by day type
- `calculateLineTotal` - Minutes-to-hours * rate with 2dp rounding
- `calculateInvoiceTotals` - Subtotal + 10% GST + total, all properly rounded
- `formatHours` - Minutes to decimal hours string (e.g., 90 -> "1.50")
- `formatCurrency` - AUD locale currency formatting

### constants.ts (6 exported values)
- `GST_RATE` - 0.10 (10%)
- `EPHRAIM_CARE_ABN` - No spaces (for CSV: 76685693565)
- `EPHRAIM_CARE_ABN_DISPLAY` - With spaces (for PDF: 76 685 693 565)
- `EPHRAIM_CARE_DETAILS` - Full business name, ABN, phone, email, address
- `INVOICE_STATUS_COLORS` - Border/badge/text styles for draft/pending/submitted/paid/overdue/cancelled
- `DAY_TYPE_LABELS` - Human-readable labels for weekday/saturday/sunday/public_holiday
- `PACE_GST_CODE` - 'P1' (taxable)

### schemas.ts (4 schemas + 3 type inferences)
- `generateInvoiceSchema` - participant_id (UUID), period dates (YYYY-MM-DD), start <= end refinement
- `supportTypeRateSchema` - support_type, 4 coerced positive rates, effective_from date
- `publicHolidaySchema` - holiday_date (YYYY-MM-DD), name (1-100 chars)
- `finalizeInvoiceSchema` - invoice_id (UUID)
- Types: `GenerateInvoiceInput`, `SupportTypeRateInput`, `PublicHolidayInput`

### csv-export.ts (2 exports)
- `PACE_CSV_HEADERS` - Exact 16 column names per NDIS PACE specification
- `generatePaceCsv` - Generates compliant CSV from invoices array + registration number
  - Each line item becomes one row
  - Quantity as decimal hours, UnitPrice to 2dp
  - GSTCode = P1, Hours always blank
  - ABN without spaces as final column

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Math.round(x*100)/100 for currency | Avoids floating point drift, matches financial rounding standard |
| Public holiday checked before day-of-week | A public holiday on Saturday should get the higher PH rate, not Saturday rate |
| No CSV escaping library | All PACE fields are controlled values (numbers, dates, codes) - no user text that could contain commas |
| Zod coerce for rates | Form inputs are strings; coerce converts to number before validation |
| GST code P1 | Per NDIS PACE format spec - all disability support services are taxable |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created types.ts for import resolution**
- **Found during:** Task 1
- **Issue:** Plan 07-01 (parallel wave) hadn't executed yet, so types.ts didn't exist
- **Fix:** Created types.ts with all type definitions from 07-01 spec
- **Result:** 07-01 later executed and overwrote with canonical version (linter-formatted)
- **No impact:** Final types.ts is correct from 07-01's execution

## Verification Results

- All 4 files compile without TypeScript errors (tsc --noEmit --strict)
- calculations.ts uses Math.round in 3 places for currency precision
- csv-export.ts produces exactly 16 columns per row (verified with test data)
- schemas.ts validates date format as YYYY-MM-DD regex pattern
- constants.ts has both ABN formats (76685693565 for CSV, 76 685 693 565 for display)
- calculateBillableMinutes uses Math.min for lesser-of rule

## Commits

| Hash | Message |
|------|---------|
| b83b051 | feat(07-02): add billing calculations and invoice constants |
| 8976fb3 | feat(07-02): add Zod schemas and PACE CSV export |

## Next Phase Readiness

All pure utility functions are ready for consumption by:
- 07-03: Generate invoice API route (uses calculations + schemas)
- 07-04: Finalize/export API routes (uses csv-export)
- 07-05/06: UI pages (uses constants for colors, formatCurrency for display)
