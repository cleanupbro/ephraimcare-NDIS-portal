---
status: complete
commit: 341a20f
---

## Plan 05-09: Offline Sync, Push Notifications & Query Persistence

### What was built
- **Push notifications** (`lib/notifications.ts`): Requests permission, creates Android 'shifts' channel (HIGH importance), gets Expo push token, upserts to worker_push_tokens table. Uses SDK 53 shouldShowBanner/shouldShowList API.
- **Sync engine** (`lib/sync.ts`): syncPendingActions processes FIFO queue — check-in inserts with synced_from_offline=true, check-out updates with duration calculation. Breaks on first failure to maintain order. startSyncListener subscribes to NetInfo connectivity changes.
- **useNotificationSetup hook** (`hooks/useNotifications.ts`): Registers push token on userId change (fires once on login).
- **OfflineIndicator component** (`components/OfflineIndicator.tsx`): Amber banner with white text "No internet connection – changes will sync when online". Subscribes to NetInfo, hidden when connected.
- **Root layout update** (`app/_layout.tsx`): PersistQueryClientProvider with AsyncStorage persister (24h maxAge, key='EPHRAIMCARE_QUERY_CACHE'). Sync listener starts on auth, stops on unmount. OfflineIndicator above Slot. Notification setup in AuthGate. Fixed auth redirect to /(tabs).

### Key decisions
- SessionProvider wraps PersistQueryClientProvider (session needed before queries persist)
- Sync breaks on failure to maintain FIFO order (check-in must sync before check-out)
- Push token upserted on `worker_id` conflict (one token per worker)
- Offline indicator uses NetInfo subscribe (not polling)
- Query cache key scoped to prevent collision with other AsyncStorage data

### Artifacts
| File | Purpose |
|------|---------|
| `apps/worker-mobile/lib/notifications.ts` | Push token registration |
| `apps/worker-mobile/lib/sync.ts` | FIFO offline queue processor |
| `apps/worker-mobile/hooks/useNotifications.ts` | Notification setup hook |
| `apps/worker-mobile/components/OfflineIndicator.tsx` | Offline banner |
