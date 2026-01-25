# Phase 5: Worker Mobile App - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Workers can view their shifts, check in with GPS (proximity-enforced), see a live timer, check out, and access their weekly schedule from a mobile app (Expo) that persists sessions indefinitely. Includes offline check-in capability and push notification reminders. Case note creation (Phase 6) is prompted but the full notes system is a separate phase.

</domain>

<decisions>
## Implementation Decisions

### Check-in/out flow
- GPS proximity enforced: worker must be within 500 meters of participant address to check in
- If outside 500m radius, check-in is blocked with clear distance message
- During active shift: persistent timer bar in header, worker can still navigate normally (browse schedule, notes, profile)
- Auto-checkout triggers 30 minutes after scheduled end time
- Push notification warning 20 minutes after scheduled end: "Auto-checkout in 10 minutes — check out now if you're done"

### Home & schedule views
- Today's shifts: simple chronological list of shift cards
- Shift card shows minimal info: participant name + time range + status dot (tap for details)
- Weekly schedule: calendar grid with 7-column layout, shifts as colored time blocks
- Empty state (no shifts today): shows next upcoming shift ("No shifts today. Next shift: Wednesday 2pm with John S.")

### Offline & session behavior
- Offline check-in allowed: records check-in locally with GPS, syncs when back online
- Sync happens silently in background — no toast or notification to worker
- Session never expires — worker stays logged in until manual logout (SecureStore token persistence)

### Alerts & pre-shift info
- Medical alerts and special instructions shown in shift detail view (always accessible, not forced)
- Alerts are color-coded by severity: Red = critical (allergies, seizures), Yellow = caution (mobility, dietary), Blue = info (preferences)
- After check-out: full-screen modal prompt for case note with "Write Note" and "Skip" buttons
- Push notification reminder 1 hour before shift start: "Shift with [Participant] starts at [time]"

### Claude's Discretion
- Offline cache window (today+tomorrow vs full week)
- Check-in button placement and visual design
- Calendar grid interaction patterns (tap vs long-press)
- Timer bar visual design and positioning
- Offline indicator UI when connection is lost
- Navigation tab icons and labels

</decisions>

<specifics>
## Specific Ideas

- Timer should be small and persistent (header bar), not dominating the screen — workers need to use the app normally during shifts
- Calendar grid for weekly view gives a visual density overview that a list can't match
- Proximity enforcement at 500m balances GPS accuracy issues with actual location verification
- Silent sync means the worker doesn't need to think about connectivity — it just works

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-worker-mobile-app*
*Context gathered: 2026-01-24*
