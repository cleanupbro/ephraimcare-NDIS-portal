# Phase 4: Shift Scheduling - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Create, edit, and cancel shifts between participants and workers with conflict detection and validation. The operational calendar for workers to check in against. Does NOT include calendar views (Phase 11), recurring shifts (Phase 11), or mobile check-in (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Shift list layout
- Claude's discretion on layout pattern (cards vs table) — match what works best with existing codebase patterns
- Medium information density per shift: time range, participant name, worker name, support type, status
- Status indicated with BOTH color-coded left border AND text badge (dual visual indicator)
- Cancelled shifts hidden by default — only visible when status filter is changed
- Shifts grouped by day within the current week view

### Create/edit form flow
- Single page form (dedicated /shifts/new route) — not a modal or sheet
- Two-step participant-first selection: pick participant, then worker dropdown only shows workers with matching support types
- Date picker + duration model: pick date, pick start time, choose duration to auto-calculate end time
- Duration presets: 1h, 1.5h, 2h, 3h, 4h, 8h, Custom
- Custom duration allows free input of hours and minutes

### Conflict warnings UX
- Conflict checks happen on form submit (not real-time)
- Overlap warning appears as a confirmation dialog (modal) — not inline
- Dialog shows full conflicting shift details: participant name, date, time range
- Admin can click "Create Anyway" to override or "Cancel" to go back
- Support type mismatch is a warning with override (same dialog pattern), NOT a hard block
- Plan date warnings (scheduling outside participant plan dates) use same dialog pattern

### Filtering and navigation
- Week view with left/right arrows and "Today" button to jump back
- Default shows current week
- Inline filter bar (horizontal row of dropdowns) above the shift list — matches participant/worker list pages
- Filters: participant, worker, status, support type
- Clicking a shift opens a side sheet (slide-out panel) with full details and edit/cancel actions — does NOT navigate away from the list

### Claude's Discretion
- Exact layout pattern choice (cards grouped by day vs DataTable with day separators)
- Default status filter (all except cancelled, or active-only) — pick most practical
- Loading states and skeleton patterns
- Side sheet exact layout and field ordering
- Time input format (15-min increments dropdown vs free-form)
- Cancel shift dialog (reason field, confirmation pattern)
- Empty state when no shifts exist for a given week

</decisions>

<specifics>
## Specific Ideas

- Side sheet for shift detail is a new pattern in this app — previous entities (participants, workers) use dedicated detail pages. This is intentional for shifts since admins review many shifts quickly.
- Duration presets should cover NDIS common shift lengths (1h for quick visits, 8h for full-day support)
- Two-step selection prevents scheduling a worker who can't deliver the required support type

</specifics>

<deferred>
## Deferred Ideas

- Calendar view (day/week/month) — Phase 11
- Recurring shift creation — Phase 11
- Worker mobile view of shifts — Phase 5

</deferred>

---

*Phase: 04-shift-scheduling*
*Context gathered: 2026-01-24*
