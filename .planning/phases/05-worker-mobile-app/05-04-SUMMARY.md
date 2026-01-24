---
status: complete
commit: 17bc247
---

## Plan 05-04: Home Screen & Tab Navigation

### What was built
- **ShiftCard component** (`components/ShiftCard.tsx`): Card with status dot (color-coded by shift status), participant name, time range, support type. Tappable to navigate to shift detail.
- **4-tab layout** (`app/(tabs)/_layout.tsx`): Bottom tab bar with Home, Schedule, My Notes, Profile tabs using MaterialCommunityIcons.
- **Home screen** (`app/(tabs)/index.tsx`): Today's shifts in a FlatList with pull-to-refresh. Empty state shows next upcoming shift from the week.

### Key decisions
- Used `expo-router` Tabs layout for bottom navigation
- Status dot colors: pending/proposed=orange, confirmed=green, in_progress=blue, completed=grey
- EmptyState fetches week shifts to show "Next: [day] [time] with [name]"

### Artifacts
| File | Purpose |
|------|---------|
| `apps/worker-mobile/components/ShiftCard.tsx` | Shift list item card |
| `apps/worker-mobile/app/(tabs)/_layout.tsx` | 4-tab bottom navigation |
| `apps/worker-mobile/app/(tabs)/index.tsx` | Home screen with today's shifts |
