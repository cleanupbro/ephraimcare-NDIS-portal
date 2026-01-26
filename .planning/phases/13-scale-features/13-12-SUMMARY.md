---
phase: 13
plan: 12
subsystem: invoicing
tags: [ndia, pace, csv-export, claims, myplace]
requires:
  - phase-7-invoicing
  - 13-01-multi-org
provides:
  - ndia-csv-export
  - pace-compliant-claims
affects:
  - none
tech-stack:
  added: []
  patterns:
    - pace-csv-format
    - date-range-preview
key-files:
  created:
    - apps/admin/lib/ndia/generate-claim-csv.ts
    - apps/admin/app/api/ndia/generate-csv/route.ts
    - apps/admin/components/invoices/NdiaCsvExport.tsx
    - apps/admin/app/(protected)/invoices/ndia-export/page.tsx
    - supabase/migrations/20260127000007_org_ndis_registration.sql
  modified:
    - packages/ui/src/components/alert.tsx
decisions:
  - ndis_item_number column (not support_item_number) for DB consistency
  - line_total column (not total) matching existing schema
  - warning variant added to Alert component (blocking deviation)
  - preview before export pattern for user confidence
metrics:
  duration: 4 min
  completed: 2026-01-26
---

# Phase 13 Plan 12: NDIA PACE CSV Export Summary

PACE-compliant CSV generation for NDIA bulk claim submission to myplace portal.

## Accomplishments

1. **NDIA CSV Generation Library** - PACE-compliant CSV format with validation
2. **CSV Download API Endpoint** - POST for download, GET for preview stats
3. **Export UI Component** - Date range selection, preview stats, one-click download
4. **NDIA Export Page** - /invoices/ndia-export route with organization context
5. **Database Migration** - ndis_registration_number column for organizations

## Files Created/Modified

### Created
- `apps/admin/lib/ndia/generate-claim-csv.ts` - PACE CSV generation library
- `apps/admin/app/api/ndia/generate-csv/route.ts` - CSV download endpoint
- `apps/admin/components/invoices/NdiaCsvExport.tsx` - Export UI with preview
- `apps/admin/app/(protected)/invoices/ndia-export/page.tsx` - Export page
- `supabase/migrations/20260127000007_org_ndis_registration.sql` - Registration number column

### Modified
- `packages/ui/src/components/alert.tsx` - Added warning variant

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| ndis_item_number column | Matches existing invoice_line_items schema (not support_item_number as in plan) |
| line_total column | Matches existing schema (not total as in plan) |
| Preview before export | User sees invoice count and total value before generating |
| DD/MM/YYYY date format | Australian format for PACE compliance |
| GST = 'N' | NDIS services are GST-free |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added warning variant to Alert component**
- **Found during:** Task 3 (UI component implementation)
- **Issue:** Plan used `variant="warning"` which didn't exist in Alert component
- **Fix:** Added warning variant with amber color scheme to alert.tsx
- **Files modified:** packages/ui/src/components/alert.tsx
- **Commit:** 1d9c87a

**2. [Rule 1 - Bug] Used correct column names from schema**
- **Found during:** Task 1 (CSV library creation)
- **Issue:** Plan used support_item_number and total but DB has ndis_item_number and line_total
- **Fix:** Updated interfaces and queries to use actual column names
- **No separate commit:** Part of initial implementation

## PACE CSV Format

The generated CSV follows NDIA PACE bulk upload format:

```csv
RegistrationNumber,NDISNumber,SupportItemNumber,ClaimReference,DateOfSupport,Quantity,Hours,UnitPrice,TotalPrice,GST,ClaimType,CancellationReason,ABN
```

Features:
- Provider registration number from organization settings
- DD/MM/YYYY Australian date format
- GST-free (N) for all NDIS services
- Unique claim reference per line item
- Support for future cancellation claims

## Commits

| Hash | Type | Description |
|------|------|-------------|
| fba3148 | feat | NDIA CSV generation library |
| ce86c46 | feat | CSV download API endpoint |
| 1d9c87a | feat | NDIA export UI component |
| d3f61f8 | feat | NDIA export page |
| e19c34a | feat | NDIS registration number migration |

## Verification Results

- [x] TypeScript compiles without errors for new files
- [x] CSV generation produces PACE-compliant format
- [x] API endpoint validates organization and authentication
- [x] UI shows preview stats before export
- [x] Date range presets work (This Month, Last Month)
- [x] Migration syntax is valid SQL

## Next Phase Readiness

**Blockers:** None
**Dependencies:** Migration needs to be applied to add ndis_registration_number column
**Notes:** Organization settings page should be updated to allow editing NDIS registration number
