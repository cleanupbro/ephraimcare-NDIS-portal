# Findings

## 1. Shift edit uses browser-local time while the UI is rendered in Sydney time
- File path: `apps/admin/components/shifts/shift-detail-sheet.tsx`
- Line: 88, 170-177
- Severity: High
- Description: `extractDate()` uses `format(new Date(iso), 'yyyy-MM-dd')`, which formats in the browser's local timezone, while `extractTime()` explicitly formats in `Australia/Sydney`. In `handleSaveEdit()`, `new Date(\`${editForm.date}T${editForm.start_time}:00\`)` also parses in the browser's local timezone before `.toISOString()` converts it to UTC. This only preserves the intended wall-clock time when the admin's device timezone matches Sydney. For admins outside `Australia/Sydney`, the edit form can show a Sydney time with a non-Sydney date, and saving can shift the stored UTC timestamp by several hours or even a day.
- Fix: Convert both read and write paths with an explicit Sydney timezone instead of the browser timezone. Use a timezone-aware helper such as `zonedTimeToUtc` / `fromZonedTime` and `formatInTimeZone(..., 'Australia/Sydney', 'yyyy-MM-dd')` so the date and time fields round-trip as Sydney local time.

## 2. Worker invite marks email as verified before mailbox ownership is proven
- File path: `apps/admin/app/api/workers/invite/route.ts`
- Line: 75
- Severity: Medium
- Description: `admin.auth.admin.createUser({ email_confirm: true })` immediately marks the worker's email as confirmed, then a magic link is generated and emailed separately. That defeats email verification as a proof-of-possession step: the account is already in a verified state before the worker clicks the link.
- Fix: Create the user with `email_confirm: false`, or switch to an invite-style flow where the account remains unconfirmed until the emailed link is redeemed.

## 3. Participant dashboard inner-joins worker profiles that participants cannot read under RLS
- File path: `apps/participant/hooks/use-participant-dashboard.ts`
- Line: 67
- Severity: High
- Description: The query selects `workers!inner(profiles!inner(first_name, last_name))`. Participants are allowed to read their own shifts, and they can read `workers` rows for their organization, but current `profiles` RLS only allows `own profile` or `admin/coordinator can view org profiles` in `supabase/migrations/20260124000016_create_rls_policies.sql`. Participants cannot read worker profiles, so the nested `profiles!inner(...)` join can filter out the worker relation entirely, and because the outer relation is also `!inner`, upcoming shifts can disappear from the participant dashboard.
- Fix: Either add a participant-safe policy for the subset of worker profile fields that should be visible, or denormalize/publicly expose worker display names through a participant-safe view/RPC and query that instead of joining directly to `profiles`.

## 4. Participant appointments query also joins worker profiles behind participant-incompatible RLS
- File path: `apps/participant/hooks/use-appointments.ts`
- Line: 59
- Severity: Medium
- Description: The appointments query selects `workers(id, profiles(first_name, last_name))`. Unlike the dashboard query, this is not an `!inner` join, so shifts may still load, but participant users still lack `profiles` select permission for worker profiles. The likely runtime result is `profiles: null` (or a join error depending on PostgREST behavior), which leaves worker names missing in the participant portal.
- Fix: Use the same remediation as the dashboard query: expose worker display names through a participant-safe view/policy, or grant a tightly scoped participant read policy for the specific worker profile fields needed in the portal.

# Checked With No Confirmed Bug

- `apps/admin/hooks/use-update-shift.ts:28-31`: spreading partial input with `undefined` does not by itself overwrite columns with `null` here. `@supabase/postgrest-js` sends the update body through `JSON.stringify(...)`, which omits `undefined` object properties.
- `apps/admin/hooks/use-cancel-shift.ts:37-59`: the post-update `.select()` is not blocked just because status changes to `cancelled`. The current `shifts` admin/coordinator policy is organization-based, not status-based.
- `apps/admin/hooks/use-workers.ts:20-33`: using the browser client with the anon key is still authenticated once the session JWT is attached. For admin/coordinator users, current `workers` and `profiles` select policies allow this join.
- `apps/admin/hooks/use-delete-shift.ts:11-14`: no delete-path bug found for admin/coordinator users. `supabase/migrations/20260124000016_create_rls_policies.sql:90-96` defines `on shifts for all` for admin/coordinator within the same organization, which covers `DELETE`.
