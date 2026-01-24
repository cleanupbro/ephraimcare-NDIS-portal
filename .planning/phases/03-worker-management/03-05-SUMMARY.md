---
phase: 03-worker-management
plan: 05
subsystem: worker-management
tags: [edit-form, resend-invite, mutation-hooks, worker-detail]
depends_on:
  requires: ["03-01", "03-02", "03-03", "03-04"]
  provides: ["worker-edit-form", "worker-update-mutation", "resend-invite-api", "detail-actions"]
  affects: []
tech-stack:
  added: []
  patterns: ["useUpdateWorker splits profile/worker updates", "read-only locked field pattern", "resend-invite via generateLink"]
key-files:
  created:
    - apps/admin/components/workers/worker-edit-form.tsx
    - apps/admin/app/(protected)/workers/[id]/edit/page.tsx
    - apps/admin/app/api/workers/resend-invite/route.ts
  modified:
    - apps/admin/hooks/use-workers.ts
    - apps/admin/components/workers/worker-detail.tsx
decisions:
  - "Email shown as locked static text with Lock icon (same pattern as participant NDIS number)"
  - "useUpdateWorker splits data into profile fields and worker fields for separate Supabase updates"
  - "Resend invite uses generateLink instead of inviteUserByEmail (resend pattern)"
  - "Resend Invite button only shown for active workers"
  - "Qualifications pre-filled as textarea with newline-joined values"
metrics:
  duration: "~3 minutes"
  completed: "2026-01-24"
---

# Phase 3 Plan 5: Worker Edit Form, Resend Invite, and Detail Actions Summary

**One-liner:** Edit form with read-only email, resend invite via generateLink, detail page with Back/Edit/Resend action buttons

## What Was Built

### 1. Worker Update and Resend Invite Hooks (use-workers.ts)

- **useUpdateWorker(workerId, profileId):** Splits WorkerEditData into profile fields (first_name, last_name, phone) and worker fields (services_provided, qualification, hourly_rate, etc.). Updates both tables with `(as any)` type assertions. Invalidates query cache and navigates on success.
- **useResendInvite():** POSTs to `/api/workers/resend-invite` with email. Success/error toasts.

### 2. Resend Invite API Route (resend-invite/route.ts)

- Verifies admin/coordinator auth (same pattern as invite route)
- Validates email in request body
- Uses `createAdminClient().auth.admin.generateLink({ type: 'invite', email, ... })`
- Returns `{ success: true }` or error response

### 3. Worker Edit Form (worker-edit-form.tsx)

- Read-only email with Lock icon and "Email cannot be changed" helper text
- Personal info: first name, last name, phone (pre-filled)
- Worker details: support types checkbox grid, qualifications textarea (pre-filled with newline-joined values), hourly rate, max hours
- Compliance: NDIS check number/expiry, WWCC number/expiry (date inputs)
- Footer: Cancel (back to detail), Save Changes (with loading state)
- Uses `zodResolver(workerEditSchema)` for validation

### 4. Edit Page (workers/[id]/edit/page.tsx)

- Server component fetching worker with profile join
- Breadcrumb: Workers / [Name] / Edit
- Renders WorkerEditForm with fetched data
- notFound() if worker doesn't exist

### 5. Detail Page Actions (worker-detail.tsx)

- Back to Workers: ghost variant, ArrowLeft icon (left-aligned)
- Edit: secondary variant, Pencil icon (right group)
- Resend Invite: outline variant, Mail icon, only for active workers, Loader2 spinner during mutation
- Separator between actions and stats section

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Lock icon for email | Consistent with participant NDIS number pattern |
| Split profile/worker updates | Different tables require separate Supabase calls |
| generateLink for resend | Proper resend pattern (not inviteUserByEmail which creates duplicate) |
| Resend only for active | Inactive workers should not receive invites |
| Textarea for qualifications | Free-form entry, split by newline (matches create form) |

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| e933664 | feat(03-05): add worker update and resend invite hooks and API |
| 421fc8a | feat(03-05): add worker edit form and edit page |
| 87157c9 | feat(03-05): add resend invite button and separator to worker detail |

## Verification

- TypeScript compiles with no errors in plan files
- useUpdateWorker splits profile vs worker updates correctly
- Resend invite uses generateLink pattern
- Edit form pre-fills all fields with worker data
- Email shown as locked static text (not editable input)
- Submit calls useUpdateWorker mutation
- Detail page shows all 3 action buttons
- Resend Invite only shown for active workers (is_active check)
- All key_links verified (useUpdateWorker pattern, useResendInvite -> resend-invite route)
