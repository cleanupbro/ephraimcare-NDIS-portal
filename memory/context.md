# Project Context

## Project Name
Ephraim Care NDIS Portal

## What It Does
Full-stack NDIS disability support management system. Monorepo containing 3 applications:
- **Admin Portal**: For coordinators/admin to manage participants, workers, rosters, and invoicing.
- **Participant Portal**: For NDIS participants to view rosters, documents, and support history.
- **Worker Mobile App**: For support workers to view shifts, check-in/out (with GPS), and submit case notes.

## Who It's For
**Ephraim Care** - NDIS Provider based in Liverpool, NSW.
**Primary Contact:** Meshach.

## Why It Exists
To streamline NDIS operations, ensure compliance (GST, reporting), manage complex billing rules ("lesser of" scheduled vs actual), and provide transparency to participants and workers.

## Owner
Built by **OpBros.ai** (Shamal Krishna & Hafsah Nuzhat).

## Current Status
**HANDED OVER** — Feb 16, 2026 at 4pm to Meshach.

### What Was Delivered
- `client-handover/` folder with 9 numbered guides (00–08) + 22 screenshots
- Admin Portal: 12/12 pages PASS (live, auto-deploying)
- Participant Portal: 4/4 pages PASS (live, auto-deploying)
- Worker Mobile App: 13 features built, ready for Expo Go testing
- Access control: Workers blocked from both web portals (verified)
- 20/20 total tests passing
- All 10 known bugs fixed
- Old handover files deleted (HANDOVER.md, HANDOVER_CHECKLIST.md, CLIENT_TEST_GUIDE.md)

### Known Limitations (Documented, Not Fixed)
- Change Password button is non-functional (bare `<button>`, no handler)
- Reset Password email callback route (`/auth/callback`) is missing
- Twilio SMS not configured (env vars not set)
- Xero accounting sync not connected (OAuth not configured)
- Worker mobile app not published to App Store / Google Play
