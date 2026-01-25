---
phase: 07-invoicing
plan: 07
subsystem: invoicing
tags: [csv, export, pace, ndis, bulk-payment]
dependency-graph:
  requires: [07-02, 07-05]
  provides: ["PACE CSV export API", "ExportCsvButton component"]
  affects: []
tech-stack:
  added: []
  patterns: ["blob download", "CSV generation"]
key-files:
  created:
    - apps/admin/app/api/invoices/export-csv/route.ts
    - apps/admin/components/invoices/ExportCsvButton.tsx
  modified:
    - apps/admin/app/(protected)/invoices/page.tsx
    - apps/admin/app/(protected)/invoices/[id]/page.tsx
decisions: []
metrics:
  duration: ~3 minutes
  completed: 2026-01-25
---

# Phase 7 Plan 07: PACE CSV Export Summary

**One-liner:** NDIS Bulk Payment CSV export with PACE-compliant 16-column format for finalized invoices.

## What Was Built

### API Route: POST /api/invoices/export-csv
- Auth check: requires admin/coordinator role
- Accepts `invoice_ids` array and optional `registration_number`
- Only exports finalized invoices (status: submitted/paid)
- Returns text/csv with descriptive filename (NDIS-Bulk-Payment-YYYY-MM-DD.csv)
- Uses generatePaceCsv from existing csv-export.ts helper

### ExportCsvButton Component
- Client component with blob download pattern
- Displays "Export PACE CSV" with Download icon
- Loading state with spinner during export
- Disabled when no finalized invoices available
- Toast notifications for success/error

### Page Integrations
- Invoice list page: Export button in header (exports all finalized invoices)
- Invoice detail page: Export button for finalized invoices (exports single invoice)

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Blob download pattern | Standard browser file download without page navigation |
| POST with invoice_ids | Allows bulk selection while keeping URL clean |
| filename from Content-Disposition | Server controls filename format for consistency |

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 419b1b8 | feat | PACE CSV export API route |
| c1d85d2 | feat | ExportCsvButton and page integrations |

## Verification Checklist

- [x] POST /api/invoices/export-csv returns text/csv content type
- [x] CSV uses generatePaceCsv (16 columns)
- [x] Only submitted/paid invoices included (drafts rejected)
- [x] Downloaded file has descriptive filename with date
- [x] ExportCsvButton triggers file download
- [x] Button disabled when no finalized invoices

## Deviations from Plan

None - plan executed exactly as written.

## Files Changed

```
apps/admin/app/api/invoices/export-csv/route.ts    (+123 new)
apps/admin/components/invoices/ExportCsvButton.tsx (+104 new)
apps/admin/app/(protected)/invoices/page.tsx       (modified: +ExportCsvButton)
apps/admin/app/(protected)/invoices/[id]/page.tsx  (modified: +ExportCsvButton)
```

## Next Phase Readiness

Phase 7 Plan 07 completes the CSV export feature (INVC-12). This was the final plan in Phase 7.

**Phase 7 Invoicing is now complete.**
