---
phase: 05-worker-mobile-app
plan: 01
subsystem: data-layer
tags: [supabase, migration, rls, pg_cron, expo, mobile]
dependency_graph:
  requires: [01-foundation, 04-shift-scheduling]
  provides: [shift_check_ins-table, worker_push_tokens-table, participant-geo-columns, mobile-supabase-client, app-constants]
  affects: [05-02, 05-03, 05-04, 05-05, 05-06, 05-07, 05-08, 05-09]
tech_stack:
  added: [expo-sqlite, expo-notifications, expo-device, expo-constants, react-native-reanimated, "@react-native-async-storage/async-storage", "@react-native-community/netinfo", "@tanstack/query-async-storage-persister", "@tanstack/react-query-persist-client"]
  patterns: [expo-sqlite-localStorage-adapter, pg_cron-scheduled-jobs, security-definer-rls]
key_files:
  created:
    - supabase/migrations/20260124300001_add_shift_check_ins.sql
    - apps/worker-mobile/lib/supabase.ts
    - apps/worker-mobile/constants/config.ts
  modified:
    - apps/worker-mobile/package.json
    - apps/worker-mobile/app.json
decisions:
  - id: expo-sqlite-over-securestore
    choice: "expo-sqlite localStorage adapter for Supabase session persistence"
    reason: "SecureStore has 2048-byte limit; expo-sqlite provides unlimited storage for JWT tokens and refresh tokens"
  - id: pg-cron-auto-checkout
    choice: "pg_cron extension for automatic checkout of stale shifts"
    reason: "Server-side cron ensures auto-checkout happens even if worker app is closed/offline"
  - id: shift-check-ins-separate-table
    choice: "Separate shift_check_ins table rather than adding columns to shifts"
    reason: "Separates scheduling data from check-in tracking; supports offline sync flag and detailed GPS data"
metrics:
  duration: "3 minutes"
  completed: "2026-01-24"
---

# Phase 5 Plan 01: Database Migration and Supabase Client Setup Summary

**One-liner:** shift_check_ins table with GPS/auto-checkout, push tokens table, participant geo columns, and expo-sqlite Supabase client for unlimited session persistence.

## What Was Done

### Task 1: Database Migration
Created `supabase/migrations/20260124300001_add_shift_check_ins.sql` with:

- **shift_check_ins table** -- stores check-in/out times, GPS coordinates (lat/lng for both), check_out_type (manual/auto/admin_override), duration_minutes, synced_from_offline flag, organization_id. UNIQUE constraint on shift_id (one check-in per shift).
- **worker_push_tokens table** -- stores Expo push tokens per worker per platform (ios/android). UNIQUE on (worker_id, platform).
- **Participant geo columns** -- latitude and longitude added to participants table for proximity checking during check-in.
- **RLS policies (shift_check_ins)** -- Workers: SELECT/INSERT/UPDATE their own. Admins/Coordinators: SELECT all in org. Admins: UPDATE any (for admin_override).
- **RLS policies (worker_push_tokens)** -- Workers: full CRUD on own tokens. Admins: SELECT all in org.
- **pg_cron auto-checkout** -- Runs every 5 minutes. Closes open check-ins where shift ended 30+ minutes ago. Sets check_out_type='auto', calculates duration, updates shift status to 'completed'.
- **Triggers** -- updated_at (moddatetime) and audit (if audit schema exists) on both new tables.

### Task 2: Dependencies and Client Setup
- **package.json** -- Added 9 new dependencies (expo-sqlite, expo-notifications, expo-device, expo-constants, react-native-reanimated, async-storage, netinfo, TanStack query persisters).
- **app.json** -- Added expo-notifications plugin with notification icon and green color.
- **lib/supabase.ts** -- Imports `expo-sqlite/localStorage/install` before createClient. Configures auth with localStorage adapter, autoRefreshToken, persistSession, no URL detection.
- **constants/config.ts** -- Exports CHECK_IN_RADIUS_METERS (500), AUTO_CHECKOUT_MINUTES (30), GPS_TIMEOUT_MS (5000), GPS_MAX_ACCURACY_METERS (100), TIMER_INTERVAL_MS (1000), QUERY_GC_TIME_MS (24h), PUSH_REMINDER_MINUTES_BEFORE (60), AUTO_CHECKOUT_WARNING_MINUTES (20).

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Session storage | expo-sqlite localStorage | SecureStore 2048-byte limit incompatible with JWT+refresh tokens |
| Auto-checkout mechanism | pg_cron (server-side) | Ensures checkout even if app closed/offline |
| Check-in data structure | Separate table | Cleaner separation from scheduling; supports offline sync metadata |

## Verification Results

| Criterion | Status |
|-----------|--------|
| shift_check_ins table with GPS, timestamps, check_out_type | Pass |
| Worker RLS: read own shifts + write own check-ins | Pass |
| Supabase client uses localStorage (not SecureStore) | Pass |
| 9 new dependencies in package.json | Pass |
| pg_cron job every 5 minutes | Pass |
| CHECK_IN_RADIUS_METERS = 500 | Pass |

## Commits

| Hash | Message |
|------|---------|
| f17bf87 | feat(05-01): add shift check-ins migration with push tokens and geo columns |
| 5817038 | feat(05-01): configure worker mobile Supabase client and dependencies |

## Next Phase Readiness

Plan 05-02 (Authentication Flow) can proceed immediately. The Supabase client is configured and ready for auth hooks. The shift_check_ins table and RLS policies are in place for Plans 05-03 through 05-05 (check-in/out flows).
