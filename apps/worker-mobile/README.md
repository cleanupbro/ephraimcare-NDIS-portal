# Worker Mobile App — `@ephraimcare/worker-mobile`

Expo 53 / React Native mobile app for support workers to manage shifts, clock in/out with GPS, and log case notes.

**Framework:** Expo 53, React Native 0.79, Expo Router 5

## Structure

```
apps/worker-mobile/
├── app/
│   ├── _layout.tsx           → Root stack (auth check, conditional render)
│   ├── login.tsx             → Login screen (email/password)
│   └── (tabs)/               → Authenticated tab navigation
│       ├── _layout.tsx       → Tab bar (home, schedule, notes, profile)
│       ├── index.tsx         → Home — today's shifts, active shift timer, quick actions
│       ├── schedule.tsx      → Schedule — week calendar, upcoming shifts
│       ├── notes.tsx         → Case notes — list, create new, goals addressed
│       └── profile.tsx       → Profile — worker info, settings, logout
├── app/shift/[id].tsx        → Shift detail — info, GPS check-in, timer, check-out
├── components/
│   ├── ShiftCard.tsx         → Shift display card
│   ├── CheckInButton.tsx     → GPS-enabled check-in
│   ├── CheckOutButton.tsx    → Check-out with location
│   ├── CaseNoteForm.tsx      → Quick case note form
│   └── ShiftTimer.tsx        → Real-time duration counter
├── hooks/
│   ├── use-shifts.ts             → Fetch worker's shifts
│   ├── use-shift-check-in.ts    → Check-in mutation with GPS
│   ├── use-shift-check-out.ts   → Check-out mutation
│   ├── use-case-notes.ts        → Fetch worker's case notes
│   ├── use-create-case-note.ts  → Create case note mutation
│   └── use-location.ts          → Expo Location API wrapper
├── lib/
│   ├── supabase/client.ts    → Mobile Supabase client
│   ├── gps/                  → Location + distance calculation
│   └── storage/              → AsyncStorage for auth tokens + cache
├── stores/                   → Zustand state stores
├── constants/                → App constants
├── app.json                  → Expo config (permissions: location, notifications, camera)
└── metro.config.js           → Metro bundler config (monorepo support)
```

## Key Dependencies

- `expo-location` — GPS for shift check-in/out
- `expo-notifications` — Push notifications for shift reminders
- `expo-secure-store` — Secure token storage
- `expo-sqlite` — Local SQLite cache
- `react-native-paper` — Material Design UI
- `zustand` — Client state management
- `@tanstack/react-query` — Server state with persistent cache

## Development

```bash
cd apps/worker-mobile
pnpm dev              # Start Expo dev server
pnpm start            # Start with clear cache
```

## Deployment

Built and distributed via EAS (Expo Application Services) for iOS and Android.
