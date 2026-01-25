# Phase 6: Case Notes - Research

**Researched:** 2026-01-25
**Domain:** Worker mobile case note creation + Admin case note review
**Confidence:** HIGH

## Summary

This phase connects the existing scaffolding (CaseNoteModal placeholder, empty My Notes tab, admin case-notes page stub, and the `case_notes` database table) into a working system. The core work is: (1) wiring the mobile modal to actually persist notes to Supabase with offline-sync support, (2) building the My Notes tab to show pending shifts needing notes within a 24-hour window, (3) adding a concern-flag toggle with admin notification, (4) adding a case notes tab on the admin participant detail page with date/worker filters and reviewed/comment capabilities, and (5) adjusting RLS policies to match the phase requirements (workers cannot see other workers' notes, participants cannot see notes).

The existing `case_notes` table schema is close but needs a migration to add columns for `concern_flag`, `concern_text`, `reviewed_at`, `reviewed_by`, and `admin_comment`. The existing RLS policies for case_notes already enforce org-scoped access and worker-owns-their-notes semantics. The participant visibility policy needs to be dropped per NOTE-05 (notes not visible to participants).

**Primary recommendation:** Extend the existing table with a targeted migration, build mobile note CRUD using the established TanStack Query + Supabase + Zustand offline queue pattern, and add a tabbed section to the admin participant detail page with server-side filtering.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | 2.x | DB insert/update/select for case_notes | Already configured in both apps |
| @tanstack/react-query | 5.x | Server state management, mutations, cache invalidation | Already in worker-mobile and admin |
| zustand | 4.x | Offline sync queue (client state) | Already used in syncStore for check-in/out |
| react-hook-form | 7.x | Form validation for case note input | Already in admin, use in mobile for the note form |
| zod | 3.x | Schema validation (min 10 chars, concern_text) | Already in admin |
| date-fns | 3.x | 24-hour window calculations, date formatting | Already in both apps |
| expo-notifications | ~0.x | Concern flag push notification to admin | Already configured in worker-mobile |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-paper | 5.x | TextInput, Switch, Card, Badge components | Already used for all mobile UI |
| @expo/vector-icons | Latest | Icons for concern flag, badge indicators | Already in tab layout |
| shadcn/ui (Tabs, Badge, Select) | Latest | Admin tabbed view, filter controls | Already available in admin |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Bottom sheet for note modal | Full-screen editor | Context says bottom sheet/modal, existing code is full-screen Modal -- keep Modal but adjust to bottom-sheet presentation |
| Zustand sync queue | TanStack Query offline mutations | Zustand queue is already built and proven; consistency > switching patterns |
| Server-side date filtering | Client-side filter | Server-side is more efficient for large datasets; use Supabase `.gte`/`.lte` |

**Installation:**
No new packages needed. All libraries are already installed in both apps.

## Architecture Patterns

### Recommended Project Structure

```
apps/worker-mobile/
├── hooks/
│   ├── useCaseNotes.ts          # Query: pending shifts needing notes
│   ├── useCreateCaseNote.ts     # Mutation: insert case note
│   └── useEditCaseNote.ts       # Mutation: update within 24h window
├── components/
│   └── CaseNoteModal.tsx        # EXISTING - enhance with concern flag, save logic
├── app/(tabs)/
│   └── notes.tsx                # EXISTING - replace placeholder with pending list
└── stores/
    └── syncStore.ts             # EXISTING - add 'case_note' action type

apps/admin/
├── components/participants/
│   ├── participant-detail.tsx   # EXISTING - add tabs wrapper
│   ├── case-notes-tab.tsx       # NEW: note list with filters
│   └── case-note-card.tsx       # NEW: individual note display
├── hooks/
│   └── use-case-notes.ts       # NEW: fetch/filter/review/comment mutations
└── app/(protected)/participants/[id]/
    └── page.tsx                 # EXISTING - pass case notes data

supabase/migrations/
└── YYYYMMDD_add_case_notes_phase6.sql  # Migration for new columns + policy changes
```

### Pattern 1: Offline-First Case Note Creation
**What:** Worker creates a case note. If online, it inserts directly via Supabase. If offline, it queues in syncStore and syncs when back online.
**When to use:** Every case note save action from mobile.
**Example:**
```typescript
// Source: Existing pattern in apps/worker-mobile/lib/sync.ts
// Extended for case_note type

// In useCreateCaseNote.ts
export function useCreateCaseNote() {
  const addPendingAction = useSyncStore((s) => s.addPendingAction)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateCaseNoteInput) => {
      const { data, error } = await supabase
        .from('case_notes')
        .insert({
          shift_id: input.shiftId,
          participant_id: input.participantId,
          worker_id: input.workerId,
          content: input.content,
          concern_flag: input.concernFlag,
          concern_text: input.concernText ?? null,
          organization_id: input.organizationId,
          note_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onError: (error, variables) => {
      // Queue for offline sync
      addPendingAction({
        type: 'case_note',
        shiftId: variables.shiftId,
        timestamp: new Date().toISOString(),
        payload: variables,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-notes', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
    },
  })
}
```

### Pattern 2: 24-Hour Window Enforcement
**What:** Workers can create/edit notes only within 24 hours of shift completion (check_out_time from shift_check_ins).
**When to use:** Both creation (My Notes pending list) and edit (within existing note).
**Example:**
```typescript
// Source: Derived from existing shift_check_ins usage in useCheckOut.ts

function isWithinEditWindow(checkOutTime: string): boolean {
  const checkout = new Date(checkOutTime)
  const now = new Date()
  const hoursSinceCheckout = (now.getTime() - checkout.getTime()) / (1000 * 60 * 60)
  return hoursSinceCheckout <= 24
}

// Query for pending shifts (completed, no case note, within 24h)
async function fetchPendingNoteShifts(workerId: string) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('shift_check_ins')
    .select(`
      shift_id,
      check_out_time,
      duration_minutes,
      shifts!inner (
        id, participant_id, worker_id, scheduled_start, scheduled_end,
        participants (first_name, last_name)
      )
    `)
    .eq('shifts.worker_id', workerId)
    .eq('shifts.status', 'completed')
    .not('check_out_time', 'is', null)
    .gte('check_out_time', twentyFourHoursAgo)

  // Filter out shifts that already have a case note
  const shiftIds = data?.map(d => d.shift_id) ?? []
  if (shiftIds.length === 0) return []

  const { data: existingNotes } = await supabase
    .from('case_notes')
    .select('shift_id')
    .in('shift_id', shiftIds)

  const notedShiftIds = new Set(existingNotes?.map(n => n.shift_id) ?? [])
  return (data ?? []).filter(d => !notedShiftIds.has(d.shift_id))
}
```

### Pattern 3: Admin Case Notes Tab with Filters
**What:** Server-side filtered query on participant detail page with date range and worker filters.
**When to use:** Admin viewing case notes for a specific participant.
**Example:**
```typescript
// Source: Derived from existing admin hooks pattern (use-shifts.ts)

export function useParticipantCaseNotes(
  participantId: string,
  filters: { dateFrom?: string; dateTo?: string; workerId?: string }
) {
  return useQuery({
    queryKey: ['case-notes', participantId, filters],
    queryFn: async () => {
      let query = supabase
        .from('case_notes')
        .select(`
          *,
          workers!inner (
            id,
            profiles (first_name, last_name)
          ),
          shifts (
            scheduled_start, scheduled_end,
            shift_check_ins (duration_minutes, check_in_time, check_out_time)
          )
        `)
        .eq('participant_id', participantId)
        .order('created_at', { ascending: false })

      if (filters.dateFrom) query = query.gte('note_date', filters.dateFrom)
      if (filters.dateTo) query = query.lte('note_date', filters.dateTo)
      if (filters.workerId) query = query.eq('worker_id', filters.workerId)

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!participantId,
  })
}
```

### Anti-Patterns to Avoid
- **Client-side filtering for large datasets:** Always push date/worker filters to Supabase query level, not after fetching all notes.
- **Storing note content in Zustand:** Case notes are server state. Use TanStack Query for fetching/caching. Only use Zustand for the offline sync queue.
- **Skipping optimistic updates for note creation:** Since the user expects immediate feedback after save, use optimistic invalidation (invalidate queries on success) rather than full optimistic cache manipulation -- note content is not shown in a list the user is currently viewing.
- **Allowing note edits after 24h via client-only enforcement:** The 24-hour window MUST also be enforced server-side (RLS policy or DB trigger), not just in the UI.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Offline queue for note saves | Custom AsyncStorage queue | Existing `syncStore.ts` Zustand store | Already handles FIFO ordering, persistence, and sync-on-reconnect |
| Date range picker (admin) | Custom date inputs | shadcn/ui DateRangePicker or two Input[type=date] | Accessible, tested |
| Push notifications for concern flag | Custom HTTP to Expo servers | Existing `expo-notifications` + Supabase Edge Function or existing notification pattern | Already have push token infrastructure |
| Tab component on participant detail | Custom tab switcher | shadcn/ui Tabs component | Already available in UI package |
| Badge count on tab bar | Manual native badge | expo-router `tabBarBadge` option | Built-in support |
| Form validation (10 char min) | Manual if-checks | Zod schema `.min(10)` with react-hook-form | Type-safe, declarative |

**Key insight:** This phase extends existing patterns (sync queue, TanStack Query hooks, Supabase RLS) rather than introducing new architectural concepts. The risk is in incorrect RLS policies and missing the 24-hour enforcement at the DB level.

## Common Pitfalls

### Pitfall 1: Participant Can See Case Notes (NOTE-05 violation)
**What goes wrong:** The existing RLS policy `"Participants can view their own case notes (not drafts)"` allows participants to see completed notes.
**Why it happens:** The original migration was designed for a different requirement set. Phase 6 explicitly says notes are NOT visible to participants.
**How to avoid:** The migration MUST drop this policy. Verify with a test query as participant role.
**Warning signs:** If participant portal shows case notes section or API returns notes for participant-role users.

### Pitfall 2: Worker Sees Other Workers' Notes (NOTE-06 violation)
**What goes wrong:** The existing `"Workers can view their own case notes"` policy correctly scopes to own notes. But the My Notes query might accidentally join/return other worker data.
**Why it happens:** Complex Supabase queries with joins can bypass RLS intent if foreign key relationships expose data.
**How to avoid:** Always filter by `worker_id` in the query AND rely on RLS as defense-in-depth. Test with two worker accounts.
**Warning signs:** My Notes tab showing notes from other workers for the same participant.

### Pitfall 3: 24-Hour Window Only Enforced Client-Side
**What goes wrong:** Worker finds a way to submit notes after 24 hours (modified client, API call).
**Why it happens:** UI-only time checks are easily bypassed.
**How to avoid:** Add a database-level check constraint or modify the RLS insert policy to verify `check_out_time` is within 24 hours.
**Warning signs:** Case notes with `created_at` more than 24 hours after associated shift's `check_out_time`.

### Pitfall 4: Concern Flag Notification Not Sent
**What goes wrong:** Admin never gets notified of flagged concerns.
**Why it happens:** Notification sending is async and may fail silently.
**How to avoid:** Use a Supabase database trigger (function) that fires on INSERT with `concern_flag = true`, inserting into the `notifications` table. The existing notification infrastructure will pick it up.
**Warning signs:** Concern notes exist in DB but no corresponding notification records.

### Pitfall 5: Note Creation Duplicated After Offline Sync
**What goes wrong:** Worker creates a note while offline, then the sync queue replays it, but the worker already retried and succeeded online.
**Why it happens:** Race condition between manual retry and queue sync.
**How to avoid:** Use `upsert` with `onConflict: 'shift_id'` constraint (one note per shift) OR add a unique constraint `unique(shift_id, worker_id)` to prevent duplicates.
**Warning signs:** Multiple case notes for the same shift by the same worker.

### Pitfall 6: Admin Edit vs Worker Edit Confusion
**What goes wrong:** Admin accidentally modifies note content instead of just reviewing.
**Why it happens:** Admin has `for all` RLS policy on case_notes.
**How to avoid:** Per context decision: admin cannot edit worker notes (only delete inappropriate ones). The admin UI should not render an edit button for note content. Admin actions are: mark reviewed, add private comment, delete.
**Warning signs:** `updated_at` changing on notes without worker action.

## Code Examples

### Case Note Zod Schema (Mobile)
```typescript
// Source: Project convention from apps/admin/lib/participants/schemas.ts
import { z } from 'zod'

export const caseNoteSchema = z.object({
  content: z.string().min(10, 'Note must be at least 10 characters'),
  concernFlag: z.boolean().default(false),
  concernText: z.string().optional().refine(
    (val) => val === undefined || val.length === 0 || val.length >= 5,
    'Concern description must be at least 5 characters if provided'
  ),
})

export type CaseNoteFormData = z.infer<typeof caseNoteSchema>
```

### DB Migration (New Columns)
```sql
-- Source: Derived from existing migration patterns in supabase/migrations/

-- Add concern flag columns
alter table public.case_notes add column if not exists concern_flag boolean default false;
alter table public.case_notes add column if not exists concern_text text;

-- Add admin review columns
alter table public.case_notes add column if not exists reviewed_at timestamptz;
alter table public.case_notes add column if not exists reviewed_by uuid references profiles(id);
alter table public.case_notes add column if not exists admin_comment text;

-- Add unique constraint to prevent duplicate notes per shift per worker
alter table public.case_notes add constraint unique_shift_worker_note unique(shift_id, worker_id);

-- Drop participant visibility (NOTE-05: case notes are NOT visible to participants)
drop policy if exists "Participants can view their own case notes (not drafts)" on case_notes;

-- Update worker update policy: allow edits within 24h of shift completion (not just drafts)
drop policy if exists "Workers can update their own drafts" on case_notes;
create policy "Workers can update their own notes within 24h"
  on case_notes for update
  to authenticated
  using (
    worker_id in (select id from workers where profile_id = auth.uid())
    and organization_id = get_user_organization_id()
    and created_at > now() - interval '24 hours'
  );

-- Trigger: notify admin on concern flag insert
create or replace function public.notify_concern_flag()
returns trigger
language plpgsql
security definer
as $$
begin
  if NEW.concern_flag = true then
    insert into public.notifications (
      recipient_id,
      type,
      title,
      body,
      data,
      sent_at
    )
    select
      p.id,
      'case_note_added',
      'Concern Flagged',
      'A worker flagged a concern for ' ||
        (select first_name || ' ' || last_name from participants where id = NEW.participant_id),
      jsonb_build_object('case_note_id', NEW.id, 'participant_id', NEW.participant_id),
      now()
    from profiles p
    where p.organization_id = NEW.organization_id
      and p.role = 'admin';
  end if;
  return NEW;
end;
$$;

create trigger case_note_concern_notification
  after insert on public.case_notes
  for each row
  when (NEW.concern_flag = true)
  execute function public.notify_concern_flag();
```

### Sync Store Extension for Case Notes
```typescript
// Source: Existing pattern in apps/worker-mobile/stores/syncStore.ts

export interface PendingAction {
  id: string
  type: 'check_in' | 'check_out' | 'case_note'  // Add 'case_note'
  shiftId: string
  timestamp: string
  latitude: number
  longitude: number
  createdAt: string
  payload?: Record<string, unknown>  // Add payload for case note content
}
```

### My Notes Tab (Pending Shifts List)
```typescript
// Source: Derived from existing useShifts pattern in apps/worker-mobile/hooks/useShifts.ts

export function usePendingNoteShifts(workerId: string | undefined) {
  return useQuery({
    queryKey: ['case-notes', 'pending', workerId],
    queryFn: () => fetchPendingNoteShifts(workerId!),
    enabled: !!workerId,
    staleTime: 2 * 60 * 1000,
  })
}
```

### Admin Review Mutation
```typescript
// Source: Derived from existing admin mutation pattern (use-cancel-shift.ts)

export function useReviewCaseNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ noteId, adminComment }: { noteId: string; adminComment?: string }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('case_notes')
        .update({
          reviewed_at: new Date().toISOString(),
          reviewed_by: user!.id,
          admin_comment: adminComment ?? null,
        })
        .eq('id', noteId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['case-notes'] })
    },
  })
}
```

### Tab Bar Badge for Pending Notes
```typescript
// Source: expo-router tabBarBadge option
// In apps/worker-mobile/app/(tabs)/_layout.tsx

<Tabs.Screen
  name="notes"
  options={{
    title: 'My Notes',
    tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
    tabBarIcon: ({ color, size }) => (
      <MaterialCommunityIcons name="note-text" size={size} color={color} />
    ),
  }}
/>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| RLS `is_draft = true` for worker updates | Time-based window (`created_at > now() - 24h`) | This phase | Workers can edit finalized notes within window, not just drafts |
| Participant can view case notes | Participant CANNOT view case notes | This phase (NOTE-05) | Drop existing RLS policy |
| `goals_addressed` array in case_notes | Single freeform text with guided placeholder | This phase context | Existing column unused, keep for backward compat but don't populate |
| Full-screen modal for note | Bottom sheet / modal after checkout | This phase context | Keep existing Modal component, adjust styling |

**Deprecated/outdated:**
- `is_draft` column: Per phase 6 context, notes are either submitted or not-yet-created. The 24-hour edit window replaces the draft concept. Keep column but set `is_draft = false` on all new inserts.
- `goals_addressed`, `participant_response`, `attachments` columns: Not used in phase 6 (deferred ideas). Keep columns but leave null.

## Open Questions

1. **Concern notification delivery mechanism (email vs push vs both)**
   - What we know: Push token infrastructure exists. Notifications table exists. Context says "push/email notification to admin immediately."
   - What's unclear: Email sending infrastructure is not visible in the codebase. No edge function or SMTP configuration found.
   - Recommendation: Implement push notification via existing pattern (DB trigger inserts into notifications table, separate process sends push). Defer email until email infrastructure is confirmed to exist. Flag as LOW confidence for email.

2. **Admin private comment visibility scope**
   - What we know: Context says admin can leave "private comment on any note (not visible to worker)."
   - What's unclear: Since workers have SELECT on their own notes, the `admin_comment` column would be visible to them.
   - Recommendation: Either (a) create a separate `case_note_admin_comments` table with admin-only RLS, or (b) exclude `admin_comment` from the worker's select query and rely on app-level filtering. Option (a) is more secure -- use a separate table.

3. **Unique constraint: one note per shift or multiple?**
   - What we know: Context says "Workers can add notes within 24 hours of shift completion." The prompt shows one note per checkout.
   - What's unclear: Can a worker write multiple notes for the same shift?
   - Recommendation: One note per shift per worker (unique constraint on `shift_id, worker_id`). Edits within 24h overwrite. This matches "Edits overwrite -- no version history preserved."

## Sources

### Primary (HIGH confidence)
- `/supabase/supabase-js` via Context7 - insert/update/upsert patterns
- `/websites/tanstack_query_v5` via Context7 - useMutation with optimistic updates and invalidation
- Existing codebase files (migrations, hooks, components) - verified current architecture

### Secondary (MEDIUM confidence)
- expo-router documentation for `tabBarBadge` option - matches project's expo-router usage
- Supabase RLS documentation for time-based policies using `now() - interval`

### Tertiary (LOW confidence)
- Email notification delivery for concern flags - no email infrastructure confirmed in codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and in use
- Architecture: HIGH - Extends existing patterns with minimal new concepts
- Pitfalls: HIGH - Derived from actual code review showing existing RLS gaps
- Notification delivery: MEDIUM - Push works, email unconfirmed

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (stable stack, no fast-moving dependencies)
