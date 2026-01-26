---
phase: 13-scale-features
plan: 07
subsystem: integrations
tags: [xero, oauth2, invoicing, accounting, api-sync]

# Dependency graph
requires:
  - phase: 13-03
    provides: Organization integration settings infrastructure
  - phase: 07
    provides: Invoice finalization endpoint
provides:
  - Xero OAuth2 connection flow
  - Automatic invoice sync to Xero
  - Participant-to-contact mapping
  - Xero sync status tracking
affects: [reporting, accounting-exports]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Non-blocking external sync pattern
    - Contact mapping cache
    - OAuth2 state validation with timestamp

key-files:
  created:
    - apps/admin/lib/xero/client.ts
    - apps/admin/lib/xero/sync-invoice.ts
    - apps/admin/app/api/xero/connect/route.ts
    - apps/admin/app/api/xero/callback/route.ts
    - apps/admin/app/api/xero/disconnect/route.ts
    - supabase/migrations/20260127000004_xero_invoice_tracking.sql
  modified:
    - apps/admin/app/api/invoices/[id]/finalize/route.ts
    - packages/types/src/database.ts

key-decisions:
  - "Xero sync is non-blocking - failure does not prevent invoice finalization"
  - "Contact mapping cached in organization record to avoid duplicate creates"
  - "GST-free tax type (EXEMPTOUTPUT) for NDIS invoices"
  - "OAuth2 state includes timestamp for 15-min expiry validation"

patterns-established:
  - "External API sync pattern: try/catch with status tracking in database"
  - "OAuth2 callback state pattern: base64url encoded JSON with org ID and timestamp"

# Metrics
duration: 4min
completed: 2026-01-27
---

# Phase 13 Plan 07: Xero Invoice Sync Summary

**Automatic Xero invoice creation on finalization with OAuth2 connection flow and contact mapping**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-26T18:39:46Z
- **Completed:** 2026-01-26T18:43:55Z
- **Tasks:** 4 (plus 1 prerequisite)
- **Files modified:** 8

## Accomplishments

- OAuth2 connection flow for Xero (connect/callback/disconnect endpoints)
- Xero client factory with automatic token refresh
- Invoice sync function maps platform invoices to Xero format
- Participant-to-Xero contact mapping with cache
- Finalize endpoint triggers sync automatically
- Sync status tracking columns in database
- TypeScript types updated for Xero fields

## Task Commits

Each task was committed atomically:

1. **Pre-requisite: Xero OAuth foundation (from 13-06)** - `f1940c2` (feat)
2. **Task 1: Add Xero invoice tracking columns** - `09b485b` (feat)
3. **Task 2: Create Xero invoice sync function** - `819a3fa` (feat)
4. **Task 3: Update invoice finalize to trigger sync** - `e0854f8` (feat)
5. **Task 4: Update TypeScript types** - `d356da5` (feat)

## Files Created/Modified

- `apps/admin/lib/xero/client.ts` - Xero client factory with token refresh
- `apps/admin/lib/xero/sync-invoice.ts` - Invoice sync function with contact mapping
- `apps/admin/app/api/xero/connect/route.ts` - OAuth2 authorization redirect
- `apps/admin/app/api/xero/callback/route.ts` - OAuth2 callback handler
- `apps/admin/app/api/xero/disconnect/route.ts` - Clear Xero credentials
- `supabase/migrations/20260127000004_xero_invoice_tracking.sql` - Database columns
- `apps/admin/app/api/invoices/[id]/finalize/route.ts` - Added Xero sync trigger
- `packages/types/src/database.ts` - Added Xero-related types

## Decisions Made

1. **Non-blocking sync** - Xero sync failure does not prevent invoice finalization (logs error, continues)
2. **Contact caching** - Participant-to-contact mapping cached in organization record
3. **GST-free** - NDIS invoices use EXEMPTOUTPUT tax type (GST-free)
4. **OAuth state security** - State parameter includes timestamp for 15-minute expiry

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created Xero OAuth foundation from 13-06**

- **Found during:** Plan load
- **Issue:** 13-06 (Xero OAuth) was not executed but 13-07 depends on `getXeroClient`
- **Fix:** Created all Xero OAuth infrastructure (client.ts, connect, callback, disconnect routes)
- **Files created:** apps/admin/lib/xero/client.ts, apps/admin/app/api/xero/connect/route.ts, apps/admin/app/api/xero/callback/route.ts, apps/admin/app/api/xero/disconnect/route.ts
- **Verification:** Files compile, xero-node was already installed
- **Committed in:** f1940c2

---

**Total deviations:** 1 auto-fixed (Rule 3 - Blocking)
**Impact on plan:** Prerequisite was required for task execution. Created necessary foundation.

## Issues Encountered

None - all tasks executed as specified after prerequisite was created.

## User Setup Required

**External services require manual configuration.** See 13-USER-SETUP.md for:
- Environment variables: XERO_CLIENT_ID, XERO_CLIENT_SECRET
- Xero Developer Portal app configuration
- Redirect URI setup

## Next Phase Readiness

- Xero integration complete and ready for use
- Organizations can connect Xero via /api/xero/connect
- Invoices auto-sync when finalized if Xero is connected
- Ready for 13-08 (Participant Goals) or next wave plans

---
*Phase: 13-scale-features*
*Completed: 2026-01-27*
