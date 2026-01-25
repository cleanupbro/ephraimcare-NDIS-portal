# Phase 5: Worker Mobile App - Research

**Researched:** 2026-01-24
**Domain:** Expo React Native mobile app with GPS check-in, live timer, offline caching, push notifications
**Confidence:** HIGH

## Summary

This phase implements a worker-facing mobile app using Expo SDK 53 with expo-router file-based navigation, Supabase auth with `expo-sqlite/localStorage` for session persistence, `expo-location` for GPS proximity enforcement, and `expo-notifications` for push reminders. The app uses `react-native-paper` for Material Design UI components and `zustand` with persist middleware for offline state management.

The key technical challenges are: (1) GPS proximity enforcement requiring haversine distance calculation, (2) live timer display that survives app backgrounding via AppState timestamp approach, (3) offline check-in with silent background sync, (4) auto-checkout which must be server-side via Supabase pg_cron, and (5) push notification scheduling for shift reminders. The existing skeleton already has the correct Expo packages installed and app.json configured with location permissions.

**Primary recommendation:** Use the Expo Router `Stack.Protected` pattern for auth gating, `expo-sqlite/localStorage/install` for Supabase session storage, haversine formula for 500m proximity check, AppState-based elapsed timer (not background timer), zustand persist for offline cache, and pg_cron for auto-checkout.

## Standard Stack

### Core (Already in package.json)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo | ~53.0.0 | Framework | Current SDK, managed workflow |
| expo-router | ~5.0.0 | File-based navigation | Stack.Protected for auth, tab navigation |
| expo-location | ~18.1.0 | GPS coordinates | Foreground location for check-in proximity |
| expo-secure-store | ~14.2.0 | Secure key storage | Encryption key storage (if needed) |
| react-native-paper | ^5.13.0 | UI component library | Material Design cards, buttons, modals, appbar |
| @supabase/supabase-js | ^2.49.0 | Backend client | Auth, database queries, realtime |
| @tanstack/react-query | ^5.65.0 | Server state | Data fetching, caching, offline support |
| zustand | ^5.0.0 | Client state | Offline store, active shift state, timer state |
| date-fns | ^4.1.0 | Date utilities | Duration formatting, time calculations |
| react-hook-form | ^7.54.0 | Form handling | Login form, case note form |
| zod | ^3.24.0 | Validation | Form schemas, API response validation |

### Supporting (Need to Add)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-notifications | ~0.31.0 | Push notifications | Shift reminders, auto-checkout warnings |
| expo-sqlite | ~15.2.0 | localStorage polyfill | Supabase session storage via `expo-sqlite/localStorage/install` |
| @expo/vector-icons | (bundled) | Tab bar icons | MaterialCommunityIcons for bottom nav |
| expo-device | ~7.1.0 | Device detection | Required for push token registration |
| expo-constants | ~17.1.0 | App config access | EAS project ID for push tokens |
| @tanstack/query-async-storage-persister | ^5.x | Query persistence | Offline query cache to disk |
| @tanstack/react-query-persist-client | ^5.x | Persist provider | Wraps app for query persistence |
| @react-native-async-storage/async-storage | ^2.1.0 | Async KV store | TanStack Query persistence adapter |
| react-native-reanimated | ~3.17.0 | Animations | Timer bar transitions, modal animations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-sqlite/localStorage | LargeSecureStore (aes-js) | More secure but adds 2 deps (aes-js, react-native-get-random-values). SQLite approach is simpler and officially recommended by Expo docs |
| zustand persist | TanStack Query persistQueryClient alone | zustand gives sync offline access for active shift state; TanStack persist only covers query cache |
| haversine formula (inline) | @turf/distance | Turf is a large library, haversine is ~10 lines of code |
| react-native-paper BottomNavigation | Expo Router Tabs built-in | Paper BottomNavigation has better Material Design styling, but Expo Router Tabs are simpler. Use Expo Router Tabs with Paper theming |
| AppState timestamp timer | react-native-background-timer | Background timer requires native module, AppState approach works in Expo managed workflow |

**Installation:**
```bash
cd apps/worker-mobile
npx expo install expo-notifications expo-sqlite expo-device expo-constants react-native-reanimated
npm install @tanstack/query-async-storage-persister @tanstack/react-query-persist-client @react-native-async-storage/async-storage
```

## Architecture Patterns

### Recommended Project Structure
```
apps/worker-mobile/
├── app/
│   ├── _layout.tsx              # Root layout: SessionProvider + QueryClientProvider
│   ├── login.tsx                # Public: login screen
│   └── (tabs)/                  # Protected tab group
│       ├── _layout.tsx          # Tab navigator with 4 tabs + timer header
│       ├── index.tsx            # Home: today's shifts list
│       ├── schedule.tsx         # Weekly calendar grid
│       ├── notes.tsx            # My case notes list
│       └── profile.tsx          # Worker profile + logout
├── app/shift/
│   └── [id].tsx                 # Shift detail view (check-in/out, alerts)
├── components/
│   ├── ShiftCard.tsx            # Minimal shift card (name + time + status)
│   ├── TimerBar.tsx             # Persistent header timer during active shift
│   ├── WeeklyCalendar.tsx       # 7-column calendar grid
│   ├── AlertBadge.tsx           # Color-coded severity alert
│   ├── CaseNoteModal.tsx        # Post-checkout note prompt
│   └── OfflineIndicator.tsx     # Connectivity status
├── hooks/
│   ├── useAuth.tsx              # Auth context + Supabase session
│   ├── useLocation.ts           # GPS permission + current position
│   ├── useProximity.ts          # Haversine distance check
│   ├── useActiveShift.ts        # Active shift timer state
│   ├── useShifts.ts             # TanStack Query shift fetching
│   └── useNotifications.ts     # Push notification registration
├── stores/
│   ├── authStore.ts             # Zustand: auth session state
│   ├── shiftStore.ts            # Zustand: offline shift cache + active shift
│   └── syncStore.ts             # Zustand: pending offline actions queue
├── lib/
│   ├── supabase.ts              # Supabase client with expo-sqlite storage
│   ├── proximity.ts             # Haversine distance calculation
│   ├── notifications.ts         # Push token registration + scheduling
│   └── sync.ts                  # Background sync logic
└── constants/
    └── config.ts                # CHECK_IN_RADIUS_METERS = 500, etc.
```

### Pattern 1: Supabase Client with expo-sqlite localStorage
**What:** Session persistence using SQLite-backed localStorage polyfill
**When to use:** App startup, all Supabase calls
**Example:**
```typescript
// Source: https://docs.expo.dev/guides/using-supabase/
// lib/supabase.ts
import 'expo-sqlite/localStorage/install'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@ephraimcare/types'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

### Pattern 2: Auth Context with Stack.Protected
**What:** Expo Router auth gating using Stack.Protected guard
**When to use:** Root layout for protecting tab routes
**Example:**
```typescript
// Source: https://docs.expo.dev/router/advanced/authentication/
// app/_layout.tsx
import { Stack } from 'expo-router'
import { SessionProvider, useSession } from '../hooks/useAuth'
import { QueryClientProvider } from '@tanstack/react-query'

function RootLayoutNav() {
  const { session, isLoading } = useSession()

  if (isLoading) return null // Splash screen still showing

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="shift/[id]" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
      </QueryClientProvider>
    </SessionProvider>
  )
}
```

### Pattern 3: GPS Proximity Check with Haversine
**What:** Calculate distance between worker GPS and participant address
**When to use:** Before allowing check-in
**Example:**
```typescript
// lib/proximity.ts
const EARTH_RADIUS_METERS = 6_371_000

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export function getDistanceMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) ** 2
  const c = 2 * Math.asin(Math.sqrt(a))
  return EARTH_RADIUS_METERS * c
}

export function isWithinRadius(
  workerLat: number, workerLon: number,
  participantLat: number, participantLon: number,
  radiusMeters: number = 500
): { within: boolean; distance: number } {
  const distance = getDistanceMeters(workerLat, workerLon, participantLat, participantLon)
  return { within: distance <= radiusMeters, distance: Math.round(distance) }
}
```

### Pattern 4: AppState-Based Live Timer
**What:** Persistent elapsed timer that survives backgrounding
**When to use:** During active shift (after check-in, before check-out)
**Example:**
```typescript
// hooks/useActiveShift.ts
import { useEffect, useRef, useState } from 'react'
import { AppState, AppStateStatus } from 'react-native'

export function useElapsedTimer(startTime: Date | null) {
  const [elapsed, setElapsed] = useState(0) // seconds
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!startTime) { setElapsed(0); return }

    const updateElapsed = () => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000))
    }

    updateElapsed()
    intervalRef.current = setInterval(updateElapsed, 1000)

    // Handle app backgrounding
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        updateElapsed() // Recalculate on foreground
      }
    })

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      subscription.remove()
    }
  }, [startTime])

  return elapsed
}

export function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}
```

### Pattern 5: Offline Check-in with Sync Queue
**What:** Queue check-in action locally, sync when online
**When to use:** When worker has no internet connectivity
**Example:**
```typescript
// stores/syncStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface PendingAction {
  id: string
  type: 'check_in' | 'check_out'
  shiftId: string
  timestamp: string
  latitude: number
  longitude: number
  createdAt: string
}

interface SyncStore {
  pendingActions: PendingAction[]
  addPendingAction: (action: Omit<PendingAction, 'id' | 'createdAt'>) => void
  removePendingAction: (id: string) => void
  clearSynced: () => void
}

export const useSyncStore = create<SyncStore>()(
  persist(
    (set, get) => ({
      pendingActions: [],
      addPendingAction: (action) => set((state) => ({
        pendingActions: [...state.pendingActions, {
          ...action,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        }]
      })),
      removePendingAction: (id) => set((state) => ({
        pendingActions: state.pendingActions.filter(a => a.id !== id)
      })),
      clearSynced: () => set({ pendingActions: [] }),
    }),
    {
      name: 'sync-queue',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

### Pattern 6: Push Notification Registration
**What:** Register device for push notifications, store token in Supabase
**When to use:** After successful login
**Example:**
```typescript
// lib/notifications.ts
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { supabase } from './supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function registerForPushNotifications(workerId: string): Promise<string | null> {
  if (!Device.isDevice) return null

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('shifts', {
      name: 'Shift Reminders',
      importance: Notifications.AndroidImportance.HIGH,
    })
  }

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId
    ?? Constants?.easConfig?.projectId
  if (!projectId) return null

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })

  // Store token in Supabase for server-side push
  await supabase
    .from('worker_push_tokens')
    .upsert({ worker_id: workerId, token, platform: Platform.OS })

  return token
}
```

### Anti-Patterns to Avoid
- **Using `react-native-background-timer` for elapsed display:** Overkill and requires native modules. AppState + Date.now() recalculation is sufficient for a display timer.
- **Client-side auto-checkout:** iOS kills background tasks after 30 seconds. Auto-checkout MUST be server-side (pg_cron).
- **Storing full session in SecureStore directly:** Session JWT is >2048 bytes, exceeds SecureStore limit. Use `expo-sqlite/localStorage` instead.
- **Using `setInterval` without AppState awareness:** Timer will drift/freeze when app is backgrounded and show wrong time on resume.
- **Requesting background location permissions:** Only foreground location is needed for check-in. Background location triggers app review flags and is unnecessary.
- **Polling for shift updates:** Use Supabase realtime subscriptions for live shift status changes instead of periodic polling.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GPS distance calculation | Custom sphere math | Haversine formula (10 lines, well-known) | Edge cases with antipodal points, numerical stability |
| Session token storage | Direct SecureStore | `expo-sqlite/localStorage/install` | Token >2048 bytes, SQLite handles unlimited size |
| Offline data persistence | Custom file-based cache | zustand persist + AsyncStorage | Handles serialization, rehydration, versioning |
| Push notification scheduling | Custom interval-based system | `expo-notifications` scheduleNotificationAsync | OS-managed, battery efficient, survives app kill |
| Auth state management | Manual token refresh logic | Supabase `autoRefreshToken: true` + `onAuthStateChange` | Handles token expiry, race conditions, retry |
| Query caching for offline | Custom cache layer | TanStack Query + AsyncStorage persister | Stale-while-revalidate, deduplication, GC |
| Form validation | Manual if/else checks | react-hook-form + zod | Type-safe, performant, proper error messages |
| Auto-checkout timing | Background task/timer | Supabase pg_cron server-side job | Reliable, not dependent on app state |

**Key insight:** Mobile apps have severe constraints on background execution. Any time-critical operation (auto-checkout, push notifications) must be server-side or OS-scheduled, never in-app timers.

## Common Pitfalls

### Pitfall 1: SecureStore 2048-byte Limit
**What goes wrong:** Storing Supabase JWT session directly in SecureStore throws an error because the session object exceeds 2048 bytes.
**Why it happens:** SecureStore has a documented 2048-byte value limit. Supabase sessions include access_token + refresh_token + user metadata.
**How to avoid:** Use `expo-sqlite/localStorage/install` as the Supabase auth storage adapter. It has no size limit and is the officially recommended approach.
**Warning signs:** Error "Provided value to SecureStore is larger than 2048 bytes" in development.

### Pitfall 2: Timer Drift After Backgrounding
**What goes wrong:** Elapsed timer shows wrong time (frozen or jumped) after app returns from background.
**Why it happens:** `setInterval` is paused when JavaScript thread is suspended in background. Timer state becomes stale.
**How to avoid:** Store check-in timestamp (Date), recalculate elapsed from `Date.now() - startTime` on every tick AND on AppState 'active' event.
**Warning signs:** Timer shows same value after multitasking, or jumps by large amounts.

### Pitfall 3: GPS Accuracy on First Fix
**What goes wrong:** First `getCurrentPositionAsync` call returns inaccurate cached location, failing proximity check incorrectly.
**Why it happens:** GPS hardware needs time to get a fix. First result may be from cell tower triangulation (100-500m accuracy).
**How to avoid:** Use `accuracy: Location.Accuracy.High` and add a 5-second timeout. Show loading state while acquiring GPS. If accuracy is >100m, retry once.
**Warning signs:** Workers reporting "too far" when they're at the right location.

### Pitfall 4: Offline Queue Ordering
**What goes wrong:** Check-in and check-out sync in wrong order, creating invalid shift state.
**Why it happens:** Network requests may complete out of order if queued naively.
**How to avoid:** Process sync queue sequentially (FIFO). Include timestamp in each action. Server should validate action ordering.
**Warning signs:** Shift records with check-out before check-in, or duplicate check-ins.

### Pitfall 5: Push Token Not Available in Expo Go
**What goes wrong:** Push notifications don't work during development with Expo Go.
**Why it happens:** Expo Go uses its own project ID. Push tokens require EAS project configuration.
**How to avoid:** Test push notifications only in development builds (`npx expo run:ios` or EAS Build). Use local notifications for development testing.
**Warning signs:** "Project ID not found" error, or token is undefined.

### Pitfall 6: React Query Cache Garbage Collection
**What goes wrong:** Offline cached data disappears after 5 minutes of inactivity.
**Why it happens:** Default `gcTime` (formerly `cacheTime`) is 300000ms (5 min). Queries without active observers get garbage collected.
**How to avoid:** Set `gcTime: 1000 * 60 * 60 * 24` (24 hours) on the QueryClient for offline-relevant queries. Match this with persister's `maxAge`.
**Warning signs:** Cached shift data gone after briefly switching apps.

### Pitfall 7: Expo Router Protected Routes Issue (SDK 53)
**What goes wrong:** Protected routes may not redirect correctly, showing blank screen.
**Why it happens:** Known issue #37305 in expo-router ~5.0.7 with Stack.Protected.
**How to avoid:** Use the redirect pattern as fallback: `if (!session) return <Redirect href="/login" />` inside `(tabs)/_layout.tsx`. Test both patterns during development.
**Warning signs:** Blank screen after login, or login screen flashing before tabs appear.

## Code Examples

### Check-in Flow (Complete)
```typescript
// hooks/useCheckIn.ts
import { useState } from 'react'
import * as Location from 'expo-location'
import { supabase } from '../lib/supabase'
import { isWithinRadius } from '../lib/proximity'
import { useSyncStore } from '../stores/syncStore'
import { useShiftStore } from '../stores/shiftStore'

interface CheckInResult {
  success: boolean
  error?: string
  distance?: number
}

export function useCheckIn() {
  const [loading, setLoading] = useState(false)
  const addPendingAction = useSyncStore(s => s.addPendingAction)
  const setActiveShift = useShiftStore(s => s.setActiveShift)

  async function checkIn(
    shiftId: string,
    participantLat: number,
    participantLon: number
  ): Promise<CheckInResult> {
    setLoading(true)
    try {
      // 1. Get current GPS position
      const { status } = await Location.getForegroundPermissionsAsync()
      if (status !== 'granted') {
        return { success: false, error: 'Location permission required' }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })
      const { latitude, longitude } = location.coords

      // 2. Check proximity (500m radius)
      const { within, distance } = isWithinRadius(
        latitude, longitude,
        participantLat, participantLon,
        500
      )

      if (!within) {
        return {
          success: false,
          error: `You are ${distance}m away. Must be within 500m to check in.`,
          distance,
        }
      }

      // 3. Record check-in
      const timestamp = new Date().toISOString()
      const { error: dbError } = await supabase
        .from('shift_check_ins')
        .insert({
          shift_id: shiftId,
          check_in_time: timestamp,
          check_in_latitude: latitude,
          check_in_longitude: longitude,
        })

      if (dbError) {
        // Offline: queue for later sync
        addPendingAction({
          type: 'check_in',
          shiftId,
          timestamp,
          latitude,
          longitude,
        })
      }

      // 4. Update local state
      setActiveShift(shiftId, new Date(timestamp))
      return { success: true }
    } finally {
      setLoading(false)
    }
  }

  return { checkIn, loading }
}
```

### Shift Card Component
```typescript
// components/ShiftCard.tsx
import { Card, Text, Chip } from 'react-native-paper'
import { format } from 'date-fns'
import { useRouter } from 'expo-router'

interface ShiftCardProps {
  id: string
  participantName: string
  startTime: Date
  endTime: Date
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed'
}

const STATUS_COLORS = {
  pending: '#FFA726',
  confirmed: '#66BB6A',
  in_progress: '#42A5F5',
  completed: '#BDBDBD',
}

export function ShiftCard({ id, participantName, startTime, endTime, status }: ShiftCardProps) {
  const router = useRouter()

  return (
    <Card
      onPress={() => router.push(`/shift/${id}`)}
      style={{ marginBottom: 8 }}
    >
      <Card.Content style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{
          width: 10, height: 10, borderRadius: 5,
          backgroundColor: STATUS_COLORS[status],
        }} />
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium">{participantName}</Text>
          <Text variant="bodySmall" style={{ color: '#666' }}>
            {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
          </Text>
        </View>
      </Card.Content>
    </Card>
  )
}
```

### Timer Bar Component
```typescript
// components/TimerBar.tsx
import { View } from 'react-native'
import { Text, Surface } from 'react-native-paper'
import { useShiftStore } from '../stores/shiftStore'
import { useElapsedTimer, formatElapsed } from '../hooks/useActiveShift'

export function TimerBar() {
  const activeShiftStart = useShiftStore(s => s.activeShiftStart)
  const elapsed = useElapsedTimer(activeShiftStart)

  if (!activeShiftStart) return null

  return (
    <Surface style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      paddingHorizontal: 16,
      backgroundColor: '#E3F2FD',
    }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#43A047', marginRight: 8 }} />
      <Text variant="labelLarge" style={{ fontVariant: ['tabular-nums'] }}>
        {formatElapsed(elapsed)}
      </Text>
    </Surface>
  )
}
```

### Auto-Checkout (Server-Side pg_cron)
```sql
-- Source: https://supabase.com/docs/guides/cron
-- Run every 5 minutes to check for overdue shifts
SELECT cron.schedule(
  'auto-checkout-overdue-shifts',
  '*/5 * * * *',
  $$
    UPDATE shift_check_ins
    SET
      check_out_time = (
        SELECT s.scheduled_end + interval '30 minutes'
        FROM shifts s
        WHERE s.id = shift_check_ins.shift_id
      ),
      check_out_type = 'auto',
      updated_at = now()
    WHERE
      check_out_time IS NULL
      AND check_in_time IS NOT NULL
      AND shift_id IN (
        SELECT s.id FROM shifts s
        WHERE s.scheduled_end + interval '30 minutes' < now()
      )
  $$
);
```

### Offline Sync Background Process
```typescript
// lib/sync.ts
import NetInfo from '@react-native-community/netinfo'
import { useSyncStore } from '../stores/syncStore'
import { supabase } from './supabase'

export async function syncPendingActions(): Promise<void> {
  const { isConnected } = await NetInfo.fetch()
  if (!isConnected) return

  const { pendingActions, removePendingAction } = useSyncStore.getState()
  if (pendingActions.length === 0) return

  // Process sequentially (FIFO) to maintain ordering
  for (const action of pendingActions) {
    try {
      if (action.type === 'check_in') {
        await supabase.from('shift_check_ins').insert({
          shift_id: action.shiftId,
          check_in_time: action.timestamp,
          check_in_latitude: action.latitude,
          check_in_longitude: action.longitude,
          synced_from_offline: true,
        })
      } else if (action.type === 'check_out') {
        await supabase.from('shift_check_ins')
          .update({
            check_out_time: action.timestamp,
            check_out_latitude: action.latitude,
            check_out_longitude: action.longitude,
            synced_from_offline: true,
          })
          .eq('shift_id', action.shiftId)
      }
      removePendingAction(action.id)
    } catch (error) {
      // Keep in queue for next sync attempt
      console.warn('Sync failed for action:', action.id, error)
      break // Stop processing on first failure to maintain order
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `<Redirect>` for auth | `Stack.Protected` guard prop | Expo SDK 53 (2025) | Declarative, less boilerplate |
| AsyncStorage for Supabase session | `expo-sqlite/localStorage/install` | 2025 | No extra dependency, unlimited size |
| `cacheTime` in React Query | `gcTime` (renamed) | TanStack Query v5 | Update config key name |
| `react-navigation` tabs | expo-router `(tabs)` folder | Expo Router v3+ | File-based, simpler |
| expo-background-fetch for periodic work | expo-background-task (SDK 53) | 2025 | Better scheduling, WorkManager/BGTaskScheduler |
| `shouldShowAlert` in notification handler | `shouldShowBanner` + `shouldShowList` | Expo SDK 53 | More granular notification display |

**Deprecated/outdated:**
- `@react-native-async-storage/async-storage` for Supabase: Still works but `expo-sqlite/localStorage` is now preferred
- `shouldShowAlert` in NotificationHandler: Replaced by `shouldShowBanner` and `shouldShowList` in SDK 53
- `cacheTime` in React Query: Renamed to `gcTime` in v5

## Open Questions

1. **Push notification server infrastructure**
   - What we know: Expo push tokens can be stored in Supabase. Shift reminders (1 hour before) require server-side push sending.
   - What's unclear: Whether to use Supabase Edge Function or a pg_cron + pg_net approach to send pushes at the right time.
   - Recommendation: Use pg_cron to run every minute checking for shifts starting in 60 minutes, send via Expo Push API using `pg_net.http_post`.

2. **Auto-checkout push notification (20 min warning)**
   - What we know: Worker should receive "Auto-checkout in 10 minutes" notification 20 minutes after scheduled end.
   - What's unclear: Same server-side push question as above.
   - Recommendation: Same pg_cron job checks for shifts 20 min past end with no checkout, sends warning push.

3. **Participant address geocoding**
   - What we know: Proximity check needs participant lat/lon coordinates.
   - What's unclear: Whether participant addresses are already geocoded in the database from Phase 2.
   - Recommendation: Verify participants table has latitude/longitude columns. If not, add geocoding during participant creation (Phase 2 enhancement).

4. **NetInfo dependency**
   - What we know: `@react-native-community/netinfo` is commonly used for connectivity detection.
   - What's unclear: Whether this is bundled with Expo SDK 53 or needs explicit installation.
   - Recommendation: Install `expo-network` (Expo's version) or `@react-native-community/netinfo`. Check Expo docs at build time.

5. **Stack.Protected stability (SDK 53)**
   - What we know: GitHub issue #37305 reports problems. The feature is new.
   - What's unclear: Whether this is fixed in expo-router ~5.0.7+.
   - Recommendation: Implement with Stack.Protected but have the Redirect fallback pattern ready. Test during development.

## Sources

### Primary (HIGH confidence)
- Context7 `/llmstxt/expo_dev_llms_txt` - expo-location getCurrentPositionAsync, expo-secure-store, expo-notifications, Expo Router authentication patterns
- Context7 `/supabase/supabase-js` - Auth client initialization, session management, onAuthStateChange
- Context7 `/pmndrs/zustand/v5.0.8` - persist middleware with AsyncStorage, createJSONStorage
- Context7 `/callstack/react-native-paper` - Card, Modal, Appbar, BottomNavigation components
- Expo official docs (https://docs.expo.dev/router/advanced/authentication/) - Stack.Protected pattern, SessionProvider
- Expo official docs (https://docs.expo.dev/guides/using-supabase/) - expo-sqlite/localStorage/install for Supabase

### Secondary (MEDIUM confidence)
- Supabase docs (https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native?auth-store=secure-store) - LargeSecureStore alternative
- Supabase cron docs (https://supabase.com/docs/guides/cron) - pg_cron scheduling pattern
- TanStack Query docs (https://tanstack.com/query/v4/docs/react/plugins/createAsyncStoragePersister) - AsyncStorage persister
- Movable Type Scripts (https://www.movable-type.co.uk/scripts/latlong.html) - Haversine formula reference

### Tertiary (LOW confidence)
- DEV Community articles on offline-first React Native patterns - General architecture guidance
- Medium articles on AppState timer management - Timer backgrounding approach

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in package.json or from official Expo/Supabase docs
- Architecture: HIGH - Patterns from Context7 official documentation, verified against existing project structure
- Pitfalls: HIGH - Documented issues (SecureStore limit, timer drift) with verified solutions
- Auto-checkout: MEDIUM - pg_cron approach is standard but specific SQL needs testing
- Push notifications: MEDIUM - Server-side push sending architecture not fully resolved

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable stack, Expo SDK 53 is current)
