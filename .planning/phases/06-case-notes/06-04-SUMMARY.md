---
phase: "06-case-notes"
plan: "04"
subsystem: "worker-mobile"
tags: ["case-notes", "pending-shifts", "tab-badge", "tanstack-query", "expo-router"]
dependency-graph:
  requires: ["06-02"]
  provides: ["pending-note-list", "edit-case-note", "tab-badge"]
  affects: []
tech-stack:
  added: []
  patterns: ["two-step-query-filter", "refetchInterval-for-expiry", "tabBarBadge-from-query"]
key-files:
  created:
    - "apps/worker-mobile/hooks/usePendingNoteShifts.ts"
    - "apps/worker-mobile/hooks/useEditCaseNote.ts"
  modified:
    - "apps/worker-mobile/app/(tabs)/notes.tsx"
    - "apps/worker-mobile/app/(tabs)/_layout.tsx"
decisions:
  - id: "two-step-query-avoids-left-join"
    description: "Fetches shift_check_ins first, then case_notes separately to avoid PostgREST LEFT JOIN limitations"
  - id: "refetch-interval-catches-expiry"
    description: "5-minute refetchInterval ensures shifts disappear from list after 24h window expires"
  - id: "badge-at-layout-level"
    description: "usePendingNoteShifts called in _layout.tsx so badge updates across all tabs"
metrics:
  duration: "~3 minutes"
  completed: "2026-01-25"
---

# Phase 6 Plan 04: My Notes Tab & Badge Summary

**One-liner:** Worker-facing My Notes tab with pending shift list, time-remaining indicator, case note creation flow, and tab bar badge for pending count.

## What Was Built

### 1. usePendingNoteShifts Hook
- Two-step query: first fetches shift_check_ins with checkout in last 24h, then checks for existing case_notes
- Filters to worker's shifts, builds PendingNoteShift objects with participant name, duration, times
- Returns only shifts WITHOUT notes (pending list)
- staleTime: 2min, refetchInterval: 5min for window expiry detection

### 2. useEditCaseNote Hook
- TanStack Query mutation wrapping Supabase update on case_notes
- RLS policy enforces 24h edit window server-side
- Invalidates case-notes query cache on success

### 3. My Notes Tab (notes.tsx)
- Full replacement of placeholder with working pending shifts list
- FlatList with Card items showing: participant name, shift time, duration, time remaining (red countdown)
- "Write Note" button opens CaseNoteModal with shift context pre-filled
- Pull-to-refresh via RefreshControl
- Empty state: green checkmark + "All caught up!" when no pending notes
- Loading state with ActivityIndicator

### 4. Tab Bar Badge (_layout.tsx)
- usePendingNoteShifts called at layout level for cross-tab badge visibility
- Red badge shows pending count (disappears when 0)
- Badge style: #EF4444 background, fontSize 10

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Two-step query (check_ins → case_notes) | PostgREST doesn't support LEFT JOIN filtering well for "missing relation" queries |
| refetchInterval 5min | Shifts auto-disappear from list after 24h without manual refresh |
| Badge at layout level | Visible across all tabs, not just when on Notes tab |
| Client-side 24h filter + server RLS | Defense in depth — UI hides expired shifts, DB blocks expired edits |

## Commits

| Hash | Message |
|------|---------|
| f873471 | feat(06-04): create usePendingNoteShifts and useEditCaseNote hooks |
| fe5764c | feat(06-04): build My Notes tab with pending shifts list and case note flow |
| f2cd9a7 | feat(06-04): add tab bar badge for pending notes count |

## Verification Results

| Check | Status |
|-------|--------|
| My Notes tab shows completed shifts within 24h without notes | Pass |
| Each item shows participant name, duration, time remaining | Pass |
| "Write Note" opens CaseNoteModal with correct props | Pass |
| Tab bar badge shows pending count (red, disappears at 0) | Pass |
| Empty state shows "All caught up!" with green checkmark | Pass |
| Pull-to-refresh works on FlatList | Pass |
| useEditCaseNote provides update mutation for existing notes | Pass |

## Next Phase Readiness

Plan 06-04 completes the Phase 6 case notes feature set. All four plans are now complete:
- 06-01: DB schema + Zod types
- 06-02: Mobile creation flow + offline sync
- 06-03: Admin review tab
- 06-04: Pending notes list + badge + edit capability
