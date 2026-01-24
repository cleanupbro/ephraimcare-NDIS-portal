---
status: complete
commit: 673bb22
---

## Plan 05-06: Live Timer, Check-out & Case Note Modal

### What was built
- **useElapsedTimer hook** (`hooks/useActiveShift.ts`): 1-second interval timer reading from shiftStore. AppState listener recalculates on foreground resume (survives backgrounding). formatElapsed produces "HH:MM:SS".
- **useCheckOut hook** (`hooks/useCheckOut.ts`): Gets optional GPS, fetches check-in time, calculates duration_minutes, updates shift_check_ins with check-out data. Offline fallback queues to syncStore. Clears active shift and invalidates queries.
- **TimerBar component** (`components/TimerBar.tsx`): Green dot + HH:MM:SS on light blue background. Shows "with [name]" label. Returns null when no active shift. Rendered above Tabs in _layout.tsx for cross-tab visibility.
- **CaseNoteModal component** (`components/CaseNoteModal.tsx`): Full-screen modal after check-out. Shows "Shift Complete" with participant name and duration. Two paths: "Write Note" opens multiline TextInput (min 10 chars), "Skip" dismisses. Phase 6 will wire DB persistence.
- **Updated shift/[id].tsx**: Check-out button wired to useCheckOut, triggers CaseNoteModal on success, navigates back on dismiss.
- **Updated (tabs)/_layout.tsx**: TimerBar rendered above Tabs component.

### Key decisions
- Timer uses Date.now() - startTime.getTime() (absolute calculation, not increment)
- fontVariant: ['tabular-nums'] prevents digit width jumps
- Check-out GPS is optional (doesn't block if permission denied)
- Duration calculated server-side from check_in_time (not client timer)
- Case note minimum 10 characters to prevent empty submissions

### Artifacts
| File | Purpose |
|------|---------|
| `apps/worker-mobile/hooks/useActiveShift.ts` | AppState-aware elapsed timer |
| `apps/worker-mobile/hooks/useCheckOut.ts` | Check-out with duration calc |
| `apps/worker-mobile/components/TimerBar.tsx` | Persistent header timer |
| `apps/worker-mobile/components/CaseNoteModal.tsx` | Post-checkout note prompt |
