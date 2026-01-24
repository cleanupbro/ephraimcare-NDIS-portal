---
phase: 04-shift-scheduling
plan: 02
subsystem: shifts
tags: [shifts, ui, tanstack-query, date-fns, radix, sheet]
dependency-graph:
  requires: ["04-01"]
  provides: ["shift-list-page", "sheet-component", "use-shifts-hook"]
  affects: ["04-03", "04-04"]
tech-stack:
  added: []
  patterns: ["SSR initial data + client TanStack Query", "day-grouped card list", "week navigation state"]
key-files:
  created:
    - packages/ui/src/components/sheet.tsx
    - apps/admin/hooks/use-shifts.ts
    - apps/admin/components/shifts/shift-card.tsx
    - apps/admin/components/shifts/shift-week-nav.tsx
    - apps/admin/components/shifts/shift-list.tsx
  modified:
    - packages/ui/src/index.ts
    - apps/admin/app/(protected)/shifts/page.tsx
decisions:
  - "Sheet uses @radix-ui/react-dialog (same as Dialog) with slide-from-right positioning"
  - "Week starts on Monday (weekStartsOn: 1) per Australian convention"
  - "initialData passed to useShifts for SSR hydration (same pattern as participants)"
  - "Day grouping uses date-fns format with yyyy-MM-dd key, sorted ascending"
  - "ShiftCard uses dual status indicator: colored left border + badge pill"
metrics:
  duration: "2m 17s"
  completed: "2026-01-24"
---

# Phase 4 Plan 2: Shift List Page with Week Navigation Summary

**One-liner:** Week-navigable shift list with day-grouped cards, dual status indicators, and reusable Sheet UI component

## What Was Built

### Sheet UI Component (packages/ui)
- Full shadcn/ui-pattern Sheet component using `@radix-ui/react-dialog`
- Slides from right with `slide-in-from-right` / `slide-out-to-right` animations
- Responsive width: 75% on mobile, max 448px on desktop
- Includes SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose
- Exported from `@ephraimcare/ui` for use in shift detail (Plan 04) and future side panels

### useShifts Hook
- TanStack Query hook accepting `weekStart` and `weekEnd` ISO strings
- Fetches shifts with participant and worker joins (including worker profile)
- Supports SSR `initialData` for hydration
- 30s staleTime matching established hook pattern

### ShiftCard Component
- Displays time range (HH:mm, Sydney timezone), participant name, worker name
- Support type shown when available
- Dual status indicator: 4px colored left border + colored badge pill
- Duration calculated and displayed (e.g., "2h 30m")
- Accessible: keyboard navigable when clickable

### ShiftWeekNav Component
- Previous/Next week buttons with ChevronLeft/ChevronRight icons
- Formatted week range display (e.g., "20 Jan - 26 Jan 2026")
- "Today" button to jump to current week

### ShiftList Component
- Groups shifts by day using `yyyy-MM-dd` key
- Renders day headers (e.g., "Monday, 20 Jan") only for days with shifts
- Loading state with Skeleton placeholders
- Empty state with CalendarOff icon and guidance message
- Week navigation controls with addWeeks/subWeeks

### Shifts Page (replaced placeholder)
- Server component with SSR data fetch for current week
- Same select/join pattern as useShifts hook
- Passes initialData to ShiftList for instant first paint
- "Schedule Shift" button linking to `/shifts/new`

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| # | Hash | Type | Description |
|---|------|------|-------------|
| 1 | 9562976 | feat | Sheet (side panel) UI component |
| 2 | 557610b | feat | useShifts hook and ShiftCard component |
| 3 | fc4864f | feat | Week navigation, shift list, and page replacement |

## Verification Results

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Sheet exports available from @ephraimcare/ui | Pass |
| 2 | /shifts page loads with SSR data + client TanStack Query | Pass |
| 3 | Shifts visually grouped by day | Pass |
| 4 | Each card shows colored left border AND status badge | Pass |
| 5 | Week nav arrows change displayed week | Pass |
| 6 | "Today" button jumps to current week | Pass |
| 7 | Empty state displays when no shifts exist | Pass |
| 8 | "Schedule Shift" button links to /shifts/new | Pass |

## Next Phase Readiness

Plan 04-02 delivers the shift viewing experience. Ready for:
- **Plan 04-03:** Shift creation form (will use the /shifts/new route)
- **Plan 04-04:** Shift detail sheet (will use the Sheet component)
