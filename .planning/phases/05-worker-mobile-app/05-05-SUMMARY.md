---
status: complete
commit: 8ee8226
---

## Plan 05-05: Shift Detail + GPS Check-in

### What was built
- **useLocation hook** (`hooks/useLocation.ts`): Requests foreground GPS permission, gets current position with High accuracy, retries with BestForNavigation if accuracy exceeds threshold.
- **useCheckIn hook** (`hooks/useCheckIn.ts`): Full check-in flow — GPS → 500m proximity check via haversine → insert shift_check_ins → update shift status → set active shift store. Offline fallback queues to syncStore.
- **AlertBadge component** (`components/AlertBadge.tsx`): Color-coded alert badges (red=critical, yellow=caution, blue=info). Includes parseAlerts() to parse "[CRITICAL]", "[CAUTION]", "[INFO]" prefixes.
- **Shift detail screen** (`app/shift/[id].tsx`): Full shift view with participant info, medical alerts, address, shift notes, check-in record display, and GPS-enforced check-in button. Check-out button placeholder for Plan 06.

### Key decisions
- Proximity enforced BEFORE any database write (no spoofed check-ins)
- Distance error shows exact meters: "You are 850m away. Must be within 500m."
- Participant notes field parsed as medical alerts (severity prefix format)
- Address composed from address_line_1 + suburb
- Check-out button renders but delegates to Plan 05-06

### Artifacts
| File | Purpose |
|------|---------|
| `apps/worker-mobile/hooks/useLocation.ts` | GPS permission + position hook |
| `apps/worker-mobile/hooks/useCheckIn.ts` | Proximity-enforced check-in |
| `apps/worker-mobile/components/AlertBadge.tsx` | Severity-colored alert badges |
| `apps/worker-mobile/app/shift/[id].tsx` | Shift detail screen |
