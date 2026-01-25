---
phase: 07-invoicing
plan: 03
subsystem: settings
tags: [tanstack-query, supabase, crud, rates, holidays, zod, react-hook-form]

dependency-graph:
  requires: [07-01, 07-02]
  provides: [rates-settings-page, holidays-settings-page, rate-hooks, holiday-hooks]
  affects: [07-04, 07-05]

tech-stack:
  added: []
  patterns: [tanstack-query-crud-hooks, dialog-forms, alert-dialog-confirmation]

key-files:
  created:
    - apps/admin/hooks/use-rates.ts
    - apps/admin/hooks/use-holidays.ts
    - apps/admin/app/(protected)/settings/rates/page.tsx
    - apps/admin/app/(protected)/settings/holidays/page.tsx
  modified: []

decisions:
  - id: rates-datalist-suggest
    choice: "HTML datalist for support type suggestions"
    reason: "Allows free text input while suggesting from SUPPORT_TYPES constant"
  - id: holiday-list-not-table
    choice: "Simple list layout instead of DataTable"
    reason: "Holiday list is small (10-20 items), simpler UI is appropriate"

metrics:
  duration: 2m 22s
  completed: 2026-01-25
---

# Phase 7 Plan 3: Rates and Holidays Settings Pages Summary

Admin settings pages for configuring support type rates and public holidays - prerequisite for invoice generation.

## One-Liner

TanStack Query CRUD hooks and settings pages for support type rates (4-tier pricing) and public holidays.

## What Was Built

### Support Type Rates Settings (`/settings/rates`)

**Hook file:** `apps/admin/hooks/use-rates.ts` (140 lines)
- `useRates()` - Fetches active rates sorted by support type
- `useCreateRate()` - Creates rate with organization_id from profile
- `useUpdateRate()` - Updates existing rate by id

**Page file:** `apps/admin/app/(protected)/settings/rates/page.tsx` (327 lines)
- Table view with columns: Support Type, NDIS Item #, Weekday, Saturday, Sunday, Public Holiday
- Rates formatted as AUD currency with /hr suffix
- Add/Edit dialogs with Zod validation via react-hook-form
- Support type input uses datalist to suggest from SUPPORT_TYPES constant
- Effective_from date field defaults to today

### Public Holidays Settings (`/settings/holidays`)

**Hook file:** `apps/admin/hooks/use-holidays.ts` (120 lines)
- `useHolidays()` - Fetches holidays sorted by date ascending
- `useCreateHoliday()` - Creates holiday with organization_id and created_by
- `useDeleteHoliday()` - Deletes holiday by id

**Page file:** `apps/admin/app/(protected)/settings/holidays/page.tsx` (222 lines)
- List view sorted by date (earliest first)
- Each item shows formatted date (dd MMM yyyy) and name
- Add dialog with date picker and name input
- Delete button with AlertDialog confirmation
- Empty state explains weekday rates apply to unconfigured dates

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create rates hooks and settings page | 1a473a1 | use-rates.ts, rates/page.tsx |
| 2 | Create holidays hooks and settings page | 7cec177 | use-holidays.ts, holidays/page.tsx |

## Patterns Applied

1. **TanStack Query CRUD hooks** - Same pattern as use-workers.ts (useQuery for fetch, useMutation for create/update/delete)
2. **Supabase type assertions** - `(supabase.from('table') as any)` for postgrest-js v12 compatibility
3. **Organization ID resolution** - Fetch profile to get org_id before insert
4. **Dialog forms** - Shadcn Dialog with react-hook-form + zodResolver
5. **AlertDialog for delete confirmation** - Prevents accidental deletion
6. **Toast notifications** - Success/error feedback via @/lib/toast

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] Rates page renders table with all 4 tier rate columns
- [x] Rates can be added with all required fields validated by Zod
- [x] Holidays page shows list sortable by date
- [x] Holidays can be added and deleted
- [x] Both pages use TanStack Query (useQuery/useMutation)
- [x] Toast notifications on success/error

## Success Criteria Met

- [x] INVC-10 satisfied: Admin can configure support type hourly rates
- [x] Public holidays manageable (CRUD) for day type determination
- [x] Data persists in Supabase tables created by Plan 01

## Next Phase Readiness

**Ready for 07-04 (Invoice Generation API):**
- Rates can be fetched via useRates() hook
- Holidays can be checked against public_holidays table
- day_type determination: check if date exists in public_holidays, else use day-of-week

**Dependencies satisfied:**
- support_type_rates table has seed data capability
- public_holidays table ready for org-specific holidays
