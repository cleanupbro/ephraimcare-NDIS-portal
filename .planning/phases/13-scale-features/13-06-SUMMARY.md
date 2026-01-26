---
phase: 13-scale-features
plan: 06
subsystem: integrations
tags: [xero, oauth2, accounting, invoice-sync]

# Dependency graph
requires:
  - phase: 13-03
    provides: Organization integration settings and credentials storage
provides:
  - Xero OAuth2 connect endpoint (/api/xero/connect)
  - Xero OAuth2 callback handler (/api/xero/callback)
  - Xero client factory with token refresh (getXeroClient)
  - Xero disconnect endpoint (/api/xero/disconnect)
affects: [13-07-xero-invoice-sync, invoicing, accounting-exports]

# Tech tracking
tech-stack:
  added: [xero-node]
  patterns: [oauth2-state-pattern, token-refresh-on-expiry, service-role-token-storage]

key-files:
  created:
    - apps/admin/app/api/xero/connect/route.ts
    - apps/admin/app/api/xero/callback/route.ts
    - apps/admin/app/api/xero/disconnect/route.ts
    - apps/admin/lib/xero/client.ts
  modified:
    - apps/admin/package.json

key-decisions:
  - "OAuth2 state parameter encodes organizationId + timestamp for callback validation"
  - "15-minute expiry on OAuth state to prevent replay attacks"
  - "Token refresh triggered 60 seconds before expiry (buffer)"
  - "Service role used for token storage (bypasses RLS for sensitive credentials)"
  - "First Xero tenant used for multi-org Xero accounts (most common case)"

patterns-established:
  - "OAuth2 state pattern: base64url-encoded JSON with org ID and timestamp"
  - "Token refresh on client initialization: check expires_at, refresh if within buffer"
  - "Connection cleanup on refresh failure: clear tokens and set xero_connected=false"

# Metrics
duration: 3min
completed: 2026-01-27
---

# Phase 13 Plan 06: Xero OAuth2 Connection Summary

**Xero OAuth2 connection flow with automatic token refresh using xero-node SDK for accounting integration**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-26T18:39:25Z
- **Completed:** 2026-01-26T18:42:36Z
- **Tasks:** 4
- **Files modified:** 5

## Accomplishments

- Xero Node SDK installed for OAuth2 and accounting API access
- Connect endpoint initiates OAuth2 flow with offline_access scope for refresh tokens
- Callback handler stores tokens and Xero tenant ID securely in organization
- Client factory with automatic token refresh before expiry
- Disconnect endpoint clears all Xero credentials

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Xero SDK** - `bf4516e` (chore)
2. **Task 2: Create Xero OAuth2 connect endpoint** - `48c721b` (feat)
3. **Task 3: Create Xero OAuth2 callback handler** - `f1940c2` (feat - included in 13-07 prerequisite)
4. **Task 4: Create Xero client factory and disconnect** - `f1940c2` (feat - included in 13-07 prerequisite)
5. **Type fixes** - `d5a50bc` (fix - profile type assertions)

## Files Created/Modified

- `apps/admin/package.json` - Added xero-node ^13.3.1 dependency
- `apps/admin/app/api/xero/connect/route.ts` - OAuth2 authorization URL redirect
- `apps/admin/app/api/xero/callback/route.ts` - OAuth2 callback handler with token storage
- `apps/admin/app/api/xero/disconnect/route.ts` - Clears Xero credentials
- `apps/admin/lib/xero/client.ts` - Xero client factory with auto token refresh

## Decisions Made

- **State parameter encoding:** Base64url JSON with organizationId and timestamp for CSRF protection
- **State expiry:** 15 minutes to prevent replay attacks while allowing reasonable auth flow time
- **Token refresh buffer:** 60 seconds before expiry to prevent edge-case failures
- **Multi-tenant handling:** Uses first Xero tenant (most orgs have single tenant)
- **Refresh failure handling:** Clears connection and requires re-authentication

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type inference for profile queries**
- **Found during:** Task 2 and Task 4 (connect and disconnect routes)
- **Issue:** PostgREST returns `never` type without explicit assertion
- **Fix:** Added type assertion `as { organization_id: string | null; role: string } | null`
- **Files modified:** apps/admin/app/api/xero/connect/route.ts, apps/admin/app/api/xero/disconnect/route.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** d5a50bc

---

**Total deviations:** 1 auto-fixed (1 bug - type inference)
**Impact on plan:** Type fix required for compilation. No scope creep.

## Issues Encountered

None - plan executed with minor type fix.

## User Setup Required

**External services require manual configuration.** This plan introduces Xero OAuth2 integration requiring:

**Environment Variables:**
| Variable | Source |
|----------|--------|
| `XERO_CLIENT_ID` | Xero Developer Portal -> My Apps -> OAuth 2.0 credentials |
| `XERO_CLIENT_SECRET` | Xero Developer Portal -> My Apps -> OAuth 2.0 credentials |

**Dashboard Configuration:**
1. Create OAuth 2.0 app at https://developer.xero.com/myapps
2. Add redirect URI: `https://your-domain/api/xero/callback`

## Next Phase Readiness

- Xero connection flow complete and ready for invoice sync
- getXeroClient factory ready for use in invoice creation
- Settings page already shows connected status (from 13-03)

---
*Phase: 13-scale-features*
*Completed: 2026-01-27*
