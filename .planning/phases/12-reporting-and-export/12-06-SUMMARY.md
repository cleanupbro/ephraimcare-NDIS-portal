---
phase: 12
plan: 06
subsystem: reporting
tags: [export, xero, myob, csv, accounting, payroll]

dependency-graph:
  requires: [12-01]
  provides: [accounting-exports, xero-format, myob-format, payroll-export]
  affects: []

tech-stack:
  added: []
  patterns:
    - Server-side CSV generation with RLS enforcement
    - DD/MM/YYYY Australian date format for accounting software
    - UTF-8 BOM for Excel compatibility
    - Blob download for API response handling

key-files:
  created:
    - apps/admin/lib/reports/accounting-formats.ts
    - apps/admin/app/api/reports/export/invoices/route.ts
    - apps/admin/app/api/reports/export/participants/route.ts
    - apps/admin/app/api/reports/export/worker-hours/route.ts
    - apps/admin/app/(protected)/reports/accounting-exports/page.tsx
  modified:
    - apps/admin/lib/reports/constants.ts
    - apps/admin/app/(protected)/reports/page.tsx

decisions:
  - id: accounting-date-format
    choice: "DD/MM/YYYY for all accounting exports"
    reason: "Australian accounting software standard (Xero, MYOB)"
  - id: xero-tax-type
    choice: "GST Free Income as default tax type"
    reason: "NDIS services are typically GST-exempt"
  - id: myob-tax-code
    choice: "FRE as default tax code"
    reason: "MYOB GST-free code for NDIS services"

metrics:
  duration: ~4 minutes
  completed: 2026-01-27
---

# Phase 12 Plan 06: Accounting Exports Summary

Xero/MYOB invoice formatters, participant list export, and worker hours export for payroll integration with DD/MM/YYYY Australian date format.

## What Was Built

### Task 1: Xero and MYOB CSV Formatters
Created `apps/admin/lib/reports/accounting-formats.ts` with:
- `generateXeroInvoiceCsv` - ContactName, InvoiceNumber, InvoiceDate, DueDate, Description, Quantity, UnitAmount, AccountCode, TaxType columns
- `generateMyobInvoiceCsv` - Co./Last Name, First Name, Inv#, Date, Terms, Due Date, Item Number, Description, Quantity, Unit Price, Tax Code columns
- `generateParticipantsCsv` - Full contact information export
- `generateWorkerHoursCsv` - Payroll-ready shift hours export
- Australian DD/MM/YYYY date formatting throughout

### Task 2: Invoice Export API
Created `apps/admin/app/api/reports/export/invoices/route.ts`:
- POST endpoint accepting format (xero/myob), date range, and status filters
- Only exports finalized invoices (submitted/paid)
- Server-side generation with RLS enforcement
- Returns CSV with UTF-8 BOM for Excel compatibility

### Task 3: Participant and Worker Hours Export APIs
Created two export endpoints:
- `apps/admin/app/api/reports/export/participants/route.ts` - Participant list with status filter
- `apps/admin/app/api/reports/export/worker-hours/route.ts` - Completed shift hours with date range filter

Both enforce admin/coordinator permissions and RLS.

### Task 4: Accounting Exports Dashboard
Created `apps/admin/app/(protected)/reports/accounting-exports/page.tsx` (464 lines):
- Invoice export section with Xero and MYOB buttons
- Date range picker and status filter for invoices
- Participant list export with status filter
- Worker hours export with date range for payroll
- Import instructions for both Xero and MYOB
- Australian date format note for users

Added accounting exports to reports navigation.

## Commits

| Hash | Message |
|------|---------|
| a81bfe1 | feat(12-06): add Xero and MYOB CSV formatters |
| 8006f13 | feat(12-06): add invoice export API for Xero/MYOB formats |
| 7bb0222 | feat(12-06): add participant and worker hours export APIs |
| 2844ba4 | feat(12-06): add accounting exports dashboard page |

## Files Changed

**Created:**
- `apps/admin/lib/reports/accounting-formats.ts` (316 lines) - Xero, MYOB, participant, worker hours formatters
- `apps/admin/app/api/reports/export/invoices/route.ts` (148 lines) - Invoice export API
- `apps/admin/app/api/reports/export/participants/route.ts` (110 lines) - Participant export API
- `apps/admin/app/api/reports/export/worker-hours/route.ts` (141 lines) - Worker hours export API
- `apps/admin/app/(protected)/reports/accounting-exports/page.tsx` (464 lines) - Dashboard page

**Modified:**
- `apps/admin/lib/reports/constants.ts` - Added accounting-exports to REPORT_TYPES
- `apps/admin/app/(protected)/reports/page.tsx` - Added FileSpreadsheet icon

## Success Criteria Verification

| Criteria | Status |
|----------|--------|
| Xero invoice export with correct column names | Passed |
| MYOB invoice export with correct column names | Passed |
| All dates use DD/MM/YYYY format | Passed |
| Participant list includes all contact fields | Passed |
| Worker hours shows shift date, participant, hours | Passed |

## Deviations from Plan

None - plan executed exactly as written.

## Technical Notes

### CSV Format Details
- **Xero**: Uses GST Free Income tax type (NDIS exempt)
- **MYOB**: Uses FRE tax code, Net 14 payment terms
- **All exports**: UTF-8 BOM prefix for Excel auto-detection

### Export Data Flow
```
Dashboard Page -> POST API -> Supabase Query (RLS) -> CSV Generator -> Blob Download
```

### Key Links Verified
- `accounting-exports/page.tsx` -> `fetch('/api/reports/export/invoices')` (line 48)
- `accounting-exports/page.tsx` -> `fetch('/api/reports/export/participants')` (line 72)
- `accounting-exports/page.tsx` -> `fetch('/api/reports/export/worker-hours')` (line 89)

## Phase 12 Status

Plan 6 of 6 complete. Phase 12 (Reporting and Export) is now complete.

All reporting features implemented:
- Report infrastructure (12-01)
- Budget utilization report (12-02)
- Revenue trends report (12-03)
- Worker hours and participant activity reports (12-04)
- Excel and PDF export (12-05)
- Accounting exports for Xero/MYOB (12-06)
