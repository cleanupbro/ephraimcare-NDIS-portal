---
status: complete
commit: adc4718
---

## Plan 05-07: Schedule Calendar, Profile & Notes

### What was built
- **WeeklyCalendar component** (`components/WeeklyCalendar.tsx`): 7-column grid (Mon-Sun) with shifts rendered as colored time blocks positioned by scheduled hours. Status-based colors (orange=pending, green=confirmed, blue=in_progress, grey=completed). Time labels 6AM-10PM on left axis. Today's column highlighted green. Tapping a block navigates to shift detail.
- **Schedule tab** (`app/(tabs)/schedule.tsx`): Week navigation with chevron arrows, date range header, scrollable calendar grid using useWeekShifts hook.
- **Profile tab** (`app/(tabs)/profile.tsx`): Shows worker name (from user_metadata), email, role label, pending sync count (amber card), red logout button, and "Powered by OpBros" footer.
- **Notes tab** (`app/(tabs)/notes.tsx`): Clean placeholder with note icon and message about case notes appearing after shifts.

### Key decisions
- Calendar time range 6AM-10PM covers typical care shift hours
- 40px per hour height provides readable block sizes on mobile
- Shifts filtered by day using `isSameDay(parseISO(scheduled_start), day)` matching actual interface
- User name extracted from session metadata with email-prefix fallback
- Sync status shown on profile to give workers visibility into offline queue

### Artifacts
| File | Purpose |
|------|---------|
| `apps/worker-mobile/components/WeeklyCalendar.tsx` | 7-column calendar grid |
| `apps/worker-mobile/app/(tabs)/schedule.tsx` | Schedule tab with week nav |
| `apps/worker-mobile/app/(tabs)/profile.tsx` | Profile with logout + sync status |
| `apps/worker-mobile/app/(tabs)/notes.tsx` | Placeholder for Phase 6 |
