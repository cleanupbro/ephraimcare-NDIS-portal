---
phase: 03
plan: 03
subsystem: worker-management
tags: [form, api-route, supabase-admin, invite-email, react-hook-form, zod]
dependency-graph:
  requires: [03-01]
  provides: [worker-creation-form, worker-invite-api]
  affects: [03-04, 03-05]
tech-stack:
  added: []
  patterns: [api-route-handler, mutation-hook, form-with-zod-resolver, atomic-db-operations-with-cleanup]
key-files:
  created:
    - apps/admin/app/api/workers/invite/route.ts
    - apps/admin/hooks/use-create-worker.ts
    - apps/admin/components/workers/worker-form/index.tsx
    - apps/admin/app/(protected)/workers/new/page.tsx
  modified: []
decisions:
  - "Qualification stored as textarea split by newline (not multi-select) for free-form entry"
  - "Native checkbox inputs with Tailwind styling (no shadcn Checkbox component needed)"
  - "API route performs atomic create with manual rollback cleanup (delete on failure)"
  - "CallerProfile typed with explicit cast due to PostgREST never-type inference issue"
metrics:
  duration: "3m 44s"
  completed: "2026-01-24"
  tasks: 3
  commits: 3
---

# Phase 3 Plan 03: Worker Creation Form & Invite API Summary

JWT-authenticated API route creating auth user + profile + worker atomically with Supabase admin client invite email, single-page form with 3 sections (basic info, support types grid, compliance dates).

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Worker invite API route | 822dc35 | apps/admin/app/api/workers/invite/route.ts |
| 2 | Create worker mutation hook and form | 1c54aaf | apps/admin/hooks/use-create-worker.ts, apps/admin/components/workers/worker-form/index.tsx |
| 3 | Worker creation page wrapper | 4439984 | apps/admin/app/(protected)/workers/new/page.tsx |

## What Was Built

### API Route: POST /api/workers/invite
- Verifies caller is admin/coordinator via session + profile role check
- Validates required fields (email, first_name, last_name, services_provided)
- Creates auth user with `inviteUserByEmail` (sends password setup email)
- Creates profile record (role: worker, linked to organization)
- Creates worker record (services, qualifications, compliance, hours)
- Manual rollback on failure: deletes downstream records if insert fails
- Returns 201 with worker ID and user ID

### Mutation Hook: useCreateWorker
- POST fetch to /api/workers/invite with JSON body
- Invalidates ['workers'] query cache on success
- Toast notifications for success/error
- Returns mutation state (isPending, etc.)

### Form Component: WorkerForm
- Section 1 (Basic Info): first/last name, email, phone
- Section 2 (Support Types): SUPPORT_TYPES checkbox grid, qualifications textarea, hourly rate, max hours
- Section 3 (Compliance): NDIS check number/expiry, WWCC number/expiry (marked optional)
- Zod validation via workerFullSchema with error messages
- Loading state on submit button
- Cancel navigates back to /workers

### Page: /workers/new
- Server component with metadata
- Breadcrumb navigation
- Heading and description
- Renders WorkerForm

## Verification Results

| Check | Status |
|-------|--------|
| /workers/new renders form with 3 sections | Pass |
| Validation errors for missing required fields | Pass (Zod resolver) |
| Compliance fields optional | Pass (schema allows empty) |
| POST /api/workers/invite creates 3 records | Pass (auth + profile + worker) |
| Success redirects to /workers | Pass (router.push) |
| TypeScript compiles | Pass (no errors in new files) |
| Key links verified | Pass (all patterns match) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] PostgREST never-type on profile query**
- **Found during:** Task 1
- **Issue:** `callerProfile.role` and `callerProfile.organization_id` errored as type `never`
- **Fix:** Cast query result to explicit typed interface `{ role: string; organization_id: string }`
- **Files modified:** apps/admin/app/api/workers/invite/route.ts
- **Commit:** 822dc35

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Textarea for qualifications (not multi-select) | Free-form entry more flexible for diverse qualification types |
| Native checkbox with Tailwind (no shadcn) | No Checkbox component in UI package; native works fine with accent-primary |
| Manual rollback pattern (not DB transaction) | Supabase JS client doesn't support cross-table transactions; cleanup on error is sufficient |
| CallerProfile explicit type cast | Known PostgREST v12 issue (documented in STATE.md decisions) |

## Next Phase Readiness

- Worker creation flow complete, ready for list page (03-02) and detail view (03-04)
- API pattern established for future worker endpoints
- Form schema and hook pattern reusable for edit form (03-05)
