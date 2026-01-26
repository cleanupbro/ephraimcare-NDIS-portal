---
phase: 13-scale-features
plan: 05
subsystem: notifications
tags: [cron, sms, shift-reminders, pg_cron, twilio]

# Dependency graph
requires:
  - phase: 13-04
    provides: "sendSms function and SMS templates"
provides:
  - "sendShiftReminders helper for 24h and 2h reminders"
  - "Cron API endpoint for scheduled reminder processing"
  - "pg_cron schedule for hourly execution"
affects: [worker-mobile-notifications, participant-communication]

# Tech tracking
tech-stack:
  added: []
  patterns: ["cron secret authentication", "time-window reminder logic"]

key-files:
  created:
    - apps/admin/lib/shifts/send-shift-notifications.ts
    - apps/admin/app/api/cron/send-shift-reminders/route.ts
    - supabase/migrations/20260127000003_cron_shift_reminders.sql

key-decisions:
  - "Time window approach for reminders (23-25h and 1.5-2.5h) to avoid duplicates"
  - "Participants receive 24h reminders only (workers get both 24h and 2h)"
  - "CRON_SECRET authentication for endpoint security"
  - "Shifts marked as reminded after processing to prevent re-sends"

patterns-established:
  - "Cron endpoint pattern with Bearer token authentication"
  - "Fire-and-continue SMS sending (errors logged, not blocking)"

# Metrics
duration: 3min
completed: 2026-01-27
---

# Phase 13 Plan 05: Shift SMS Reminders Summary

**Cron job infrastructure for sending 24h and 2h shift SMS reminders to opted-in workers and participants**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-26T18:39:31Z
- **Completed:** 2026-01-26T18:42:37Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments

- Created sendShiftReminders helper that processes shifts in time windows
- Built cron API endpoint with CRON_SECRET authentication
- Added pg_cron schedule migration for hourly reminder execution
- Implemented opt-out checking for sms_notifications_enabled flag
- Marks shifts as reminded (reminder_24h_sent, reminder_2h_sent) after processing

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shift reminder helper function** - `6d4075c` (feat)
2. **Task 2: Create cron API endpoint** - `b077996` (feat)
3. **Task 3: Create pg_cron schedule migration** - `028d31b` (feat)

## Files Created/Modified

| File | Purpose |
|------|---------|
| `apps/admin/lib/shifts/send-shift-notifications.ts` | sendShiftReminders helper for 24h/2h processing |
| `apps/admin/app/api/cron/send-shift-reminders/route.ts` | POST endpoint with CRON_SECRET auth |
| `supabase/migrations/20260127000003_cron_shift_reminders.sql` | pg_cron schedule for hourly job |

## Decisions Made

1. **Time window approach** - 24h reminders: 23-25 hours ahead; 2h reminders: 1.5-2.5 hours ahead. This prevents duplicate sends if cron runs slightly early or late.
2. **Participants get 24h only** - Per CONTEXT.md, participants only receive 24-hour advance reminders, not 2-hour reminders
3. **CRON_SECRET authentication** - Endpoint requires `Authorization: Bearer {CRON_SECRET}` header for security
4. **GET for dev testing only** - GET method allowed only in development environment for manual testing

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required

Environment variable required for cron authentication:
- `CRON_SECRET` - Random string for cron endpoint authorization

For pg_cron to work, set in Supabase dashboard:
- `app.api_url` - Your deployment URL (e.g., https://your-app.vercel.app)
- `app.cron_secret` - Same value as CRON_SECRET env var

Alternative: Use Vercel Cron by adding to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/send-shift-reminders",
    "schedule": "0 * * * *"
  }]
}
```

## Next Phase Readiness

- Shift reminder infrastructure complete and ready for production
- SMS templates and sending function from 13-04 integrated
- pg_cron schedule requires Supabase plan with extension support (or use Vercel Cron alternative)

---
*Phase: 13-scale-features*
*Plan: 05*
*Completed: 2026-01-27*
