---
phase: 03-worker-management
plan: 04
subsystem: worker-detail
tags: [worker, detail-page, compliance, stats, tanstack-query]
dependency-graph:
  requires: ["03-01"]
  provides: ["worker-detail-page", "worker-stats-hook", "worker-compliance-display"]
  affects: ["03-05"]
tech-stack:
  added: []
  patterns: ["server-component-page-with-client-detail", "query-hook-per-feature", "compliance-traffic-light-badges"]
key-files:
  created:
    - apps/admin/hooks/use-worker-stats.ts
    - apps/admin/components/workers/worker-stats.tsx
    - apps/admin/components/workers/worker-compliance.tsx
    - apps/admin/components/workers/worker-detail.tsx
    - apps/admin/app/(protected)/workers/[id]/page.tsx
  modified: []
decisions:
  - "PostgREST type assertion (as any) on shifts query for next-shift join (same pattern as plan_budgets)"
  - "StatusBadge uses colored dot + Badge component variant for dual visual indicator"
  - "1-minute staleTime on worker-stats query (balance between freshness and performance)"
metrics:
  duration: "~5 minutes"
  completed: "2026-01-24"
---

# Phase 03 Plan 04: Worker Detail Page Summary

**One-liner:** Worker detail page with profile info, scheduling stat cards (hours this week/month, next shift), qualifications list, and NDIS/WWCC compliance badges with traffic-light status indicators.

## What Was Built

### 1. Worker Stats Hook (`use-worker-stats.ts`)
TanStack Query hook that fetches three pieces of scheduling data:
- **Hours this week:** Sums actual durations of completed shifts since start of current ISO week
- **Hours this month:** Same logic from start of current calendar month
- **Next shift:** Finds earliest upcoming scheduled/confirmed shift with participant name via join

Uses `date-fns` for `startOfISOWeek`, `startOfMonth`, and `differenceInMinutes` calculations.

### 2. Worker Stats Cards (`worker-stats.tsx`)
Responsive 3-column grid of stat cards:
- Clock icon + "Hours This Week" with `X.X hrs` format
- Calendar icon + "Hours This Month" with `X.X hrs` format
- CalendarClock icon + "Next Shift" with participant name and date, or "No upcoming shifts"

Includes skeleton loading state while query resolves.

### 3. Worker Compliance Section (`worker-compliance.tsx`)
Displays NDIS Worker Check and WWCC with:
- Check number or "Number not provided"
- Expiry date formatted as `d MMM yyyy`
- Status badge with colored dot: Valid (green), Expiring Soon (amber), Expired (red), Not Set (gray)
- Empty state message when no compliance data exists

### 4. Worker Detail Component (`worker-detail.tsx`)
Main client component composing the full detail view:
- Header with full name + active/inactive badge
- Back and Edit action buttons
- WorkerStats section
- Profile card (email, phone, hourly rate, max hours)
- Support Types card (badges)
- Qualifications card (bulleted list)
- WorkerCompliance section

### 5. Worker Detail Page (`[id]/page.tsx`)
Server component that:
- Fetches worker by ID with profiles join
- Returns 404 for missing workers
- Renders breadcrumb + WorkerDetail
- Sets page metadata title

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| PostgREST `as any` on shifts query | Same approach used for plan_budgets; postgrest-js v12 generic type issue with joins |
| Colored dot + Badge variant for status | Dual visual indicator - color for quick scan, text for accessibility |
| 1-minute staleTime on stats query | Balance freshness (stats change with shift completion) vs API load |
| Server fetch + client detail pattern | SSR first paint, client-side stats hydration (established Phase 2 pattern) |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

| Check | Status |
|-------|--------|
| TypeScript compiles (all 5 files) | Pass |
| Stats show zeros when no shift data | Pass (fallback values) |
| Compliance badges correct for all statuses | Pass |
| "Not provided" shown for null values | Pass |
| Page min_lines >= 20 | Pass (54 lines) |
| key_links: worker-stats -> useWorkerStats | Pass |
| key_links: worker-compliance -> getComplianceStatus | Pass |

## Commits

| Hash | Message |
|------|---------|
| ad7bb8d | feat(03-04): add worker stats hook and stat cards component |
| 34bbac7 | feat(03-04): add worker compliance section with status badges |
| 2b299f8 | feat(03-04): add worker detail page with profile, stats, and compliance |

## Next Phase Readiness

Plan 03-05 (Edit Worker) can now use:
- `WorkerDetail` component as reference for worker data structure
- `WorkerCompliance` section pattern for edit form fields
- `/workers/[id]` route exists for navigation back from edit
