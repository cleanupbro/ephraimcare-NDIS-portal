---
phase: "06-case-notes"
plan: "02"
subsystem: "worker-mobile"
tags: ["case-notes", "supabase", "offline-sync", "react-native", "zustand", "tanstack-query"]
dependency-graph:
  requires: ["06-01"]
  provides: ["case-note-creation", "offline-case-note-queue", "concern-flag-form"]
  affects: ["06-03", "06-04"]
tech-stack:
  added: []
  patterns: ["upsert-with-onConflict", "mutation-onError-offline-queue", "zod-safeParse-validation"]
key-files:
  created:
    - "apps/worker-mobile/hooks/useCreateCaseNote.ts"
  modified:
    - "apps/worker-mobile/stores/syncStore.ts"
    - "apps/worker-mobile/lib/sync.ts"
    - "apps/worker-mobile/components/CaseNoteModal.tsx"
    - "apps/worker-mobile/app/shift/[id].tsx"
decisions:
  - id: "upsert-prevents-duplicate-notes"
    description: "Uses upsert with onConflict: 'shift_id,worker_id' to prevent duplicate case notes from offline sync replay"
  - id: "offline-dismisses-with-delay"
    description: "On network error, shows 'Saved offline' message for 1.5s then dismisses modal (note queued via hook onError)"
metrics:
  duration: "~4 minutes"
  completed: "2026-01-25"
---

# Phase 6 Plan 02: Case Note Creation Flow Summary

**One-liner:** Worker-facing case note form with Zod validation, Supabase upsert, concern flag toggle, and offline sync queue fallback.

## What Was Built

### 1. Extended Sync Store (syncStore.ts + sync.ts)
- Added `'case_note'` to the `PendingAction` type union
- Added optional `payload` field (`Record<string, unknown>`) for storing note metadata
- Added `case_note` processing case in `sync.ts` with Supabase upsert and onConflict to prevent duplicates on replay

### 2. useCreateCaseNote Hook
- TanStack Query `useMutation` wrapping Supabase upsert to `case_notes` table
- On success: invalidates `case-notes` and `shifts` query caches
- On error (network failure): queues action to syncStore with full payload for offline replay
- Uses `(as any)` type assertion per project PostgREST convention

### 3. Enhanced CaseNoteModal
- Zod schema validation via `safeParse` (min 10 chars content, min 5 chars concern text if provided)
- Character count indicator (turns green at 10+ chars)
- Concern flag Switch (react-native-paper) that reveals secondary concern text TextInput
- Loading state on Save button during mutation
- Error handling: validation errors shown inline, network errors show "Saved offline" then dismiss
- ScrollView wrapper with `keyboardShouldPersistTaps` for better multiline input UX

### 4. Updated Shift Detail Caller
- `shift/[id].tsx` now passes `participantId`, `workerId`, `organizationId` to CaseNoteModal

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Upsert with onConflict prevents duplicates | Sync replay safety -- same note won't create a second row |
| Offline dismisses modal after 1.5s delay | User sees confirmation that data was saved locally before modal closes |
| safeParse not react-hook-form | Simpler for 2-field form; avoids zodResolver dependency in mobile bundle |
| ScrollView instead of View wrapper | Multiline inputs need scroll when keyboard is open on small screens |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Sync processing logic is in lib/sync.ts, not syncStore.ts**
- **Found during:** Task 1
- **Issue:** Plan specified adding case_note processing to syncStore.ts, but actual sync replay logic lives in lib/sync.ts
- **Fix:** Added case_note case to lib/sync.ts (correct location) alongside type extension in syncStore.ts
- **Files modified:** apps/worker-mobile/lib/sync.ts
- **Commit:** 40b7f7d

## Commits

| Hash | Message |
|------|---------|
| 40b7f7d | feat(06-02): extend sync store with case_note action type |
| bcb490d | feat(06-02): create useCreateCaseNote mutation hook |
| bdd196b | feat(06-02): enhance CaseNoteModal with validation and Supabase persistence |

## Verification Results

| Check | Status |
|-------|--------|
| CaseNoteModal renders content TextInput + concern Switch + conditional concern text | Pass |
| Valid save (10+ chars) calls Supabase upsert on case_notes | Pass |
| Offline save queues case_note action in syncStore | Pass |
| syncStore processes case_note with upsert (onConflict) | Pass |
| Form prevents save when content < 10 chars | Pass |
| Concern flag toggle shows/hides concern text field | Pass |

## Next Phase Readiness

Plan 06-02 provides the core case note creation flow. Plan 06-03 (admin review) and 06-04 (edit window) depend on notes existing in the database, which this plan enables.
