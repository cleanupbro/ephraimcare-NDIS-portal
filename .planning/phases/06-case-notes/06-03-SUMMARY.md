---
phase: "06"
plan: "03"
subsystem: "admin-case-notes"
tags: ["tanstack-query", "supabase", "tabs", "filters", "admin-review"]
dependency_graph:
  requires: ["06-01"]
  provides: ["admin-case-notes-tab", "case-note-review", "admin-comments"]
  affects: ["06-04"]
tech_stack:
  added: []
  patterns: ["client-side-mutations", "query-invalidation", "tabbed-detail-page"]
file_tracking:
  key_files:
    created:
      - "apps/admin/hooks/use-case-notes.ts"
      - "apps/admin/components/participants/case-note-card.tsx"
      - "apps/admin/components/participants/case-notes-tab.tsx"
    modified:
      - "apps/admin/components/participants/participant-detail.tsx"
decisions:
  - id: "organization-id-passthrough"
    description: "organizationId passed from participant object to CaseNotesTab for admin comment insertion"
  - id: "select-all-value"
    description: "Worker filter uses 'all' as placeholder value, filtered out before query to avoid DB mismatch"
metrics:
  duration: "~3 minutes"
  completed: "2026-01-25"
---

# Phase 6 Plan 03: Admin Case Notes Review Tab Summary

**One-liner:** Tabbed participant detail with case notes list, date/worker filters, concern badges, review acknowledgement, and private admin comments using TanStack Query mutations.

## What Was Built

### 1. Case Notes Hooks (use-case-notes.ts)

Five hooks for admin case note data management:

- **useParticipantCaseNotes** - Fetches case notes with server-side date/worker filters, joins worker profiles and shift check-in data
- **useReviewCaseNote** - Mutation to mark a note as reviewed (sets reviewed_at + reviewed_by)
- **useAddAdminComment** - Mutation to insert private admin comment into case_note_admin_comments table
- **useAdminComments** - Fetches admin comments for a specific case note with profile joins
- **useCaseNoteWorkers** - Fetches distinct workers who have written notes for a participant (for filter dropdown)

All hooks follow the established pattern: `createClient()` from `@/lib/supabase/client`, `(as any)` type assertions on PostgREST queries, TanStack Query with 30s staleTime.

### 2. CaseNoteCard Component

Individual note display card with:
- Worker name and formatted timestamp header
- Red "Concern" badge when `concern_flag` is true
- Full note content display
- Highlighted concern text box (red background) when `concern_text` exists
- Duration display from joined shift_check_ins
- Review status: green check with date (reviewed) or "Mark as Reviewed" button (pending)
- Admin comments list with admin name + timestamp
- Inline "Add Comment" input with save/cancel

### 3. CaseNotesTab Component

Tab content with filtering and list:
- Date range inputs (from/to) for server-side filtering
- Worker Select dropdown populated from useCaseNoteWorkers
- Clear filters button (only shows when filters active)
- Notes count display
- Loading spinner, error state, and empty state handling
- Maps notes to CaseNoteCard with review/comment callbacks

### 4. Participant Detail Tabs Integration

Existing participant detail page wrapped in Tabs:
- "Details" tab (default): all existing content (NDIS plan, budget, personal info, emergency contact, support notes)
- "Case Notes" tab: CaseNotesTab with participantId and organizationId from participant object
- Header and action buttons remain above tabs for consistent UX

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| organizationId passed from participant to CaseNotesTab | Required for case_note_admin_comments insert, avoids extra DB lookup |
| Worker filter uses 'all' placeholder value | Radix Select requires string values; filtered before query submission |
| Admin comments fetched per-card (useAdminComments) | Keeps concerns separate; avoids bloating main notes query |
| Header/actions above tabs | User always sees participant name and edit/archive regardless of active tab |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Worker filter "all" value passed to Supabase query**

- **Found during:** Post-Task 2 review
- **Issue:** Select value="all" for "All workers" option would be passed as `workerId` filter to Supabase, causing `.eq('worker_id', 'all')` which matches no records
- **Fix:** Added check `workerId && workerId !== 'all'` before including in filters object
- **Files modified:** apps/admin/components/participants/case-notes-tab.tsx
- **Commit:** f6577a4

## Verification

1. [x] Participant detail page shows "Details" and "Case Notes" tabs
2. [x] CaseNotesTab has date range and worker filter controls
3. [x] Notes with concern_flag display red "Concern" badge
4. [x] "Mark as Reviewed" button triggers useReviewCaseNote mutation
5. [x] "Add Comment" inline input triggers useAddAdminComment mutation
6. [x] Empty state displays when no notes match
7. [x] Loading state shows spinner during fetch

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 28b6aa9 | feat | Create case notes hooks for admin review |
| 954156a | feat | Create CaseNoteCard and CaseNotesTab components |
| 56b685f | feat | Add Case Notes tab to participant detail page |
| f6577a4 | fix | Prevent 'all' worker filter from querying DB |

## Next Phase Readiness

Plan 06-03 provides the admin review experience. Remaining in phase 6:
- Plan 04 (if exists): notifications/dashboard for flagged concerns

No blockers for subsequent plans.
