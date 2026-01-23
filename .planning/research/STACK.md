# Stack Research: NDIS Management Platform

**Project:** Ephraim Care Portal
**Provider Context:** Australian NDIS provider, <20 participants
**Research Date:** January 24, 2026
**Architecture:** Monorepo with 3 apps (admin web, participant web, worker mobile)

---

## Recommended Stack

### Monorepo Tooling

| Tool | Version | Rationale |
|------|---------|-----------|
| **Turborepo** | ^2.4.x | Incremental builds, remote caching, task orchestration. Proven with Next.js + Expo monorepos. |
| **pnpm** | ^9.x | Fast installs via global store, native workspace support. Best compatibility with Turborepo. |
| **TypeScript** | ^5.7.x | Strict mode, project references across packages. Single `tsconfig.base.json` at root. |

**Monorepo Structure:**
```
ephraimcare-portal-2026/
  apps/
    admin/          # Next.js 15.5 - Admin portal
    participant/    # Next.js 15.5 - Participant/family portal
    worker/         # Expo SDK 53 - Worker check-in/out mobile app
  packages/
    shared/         # Types, validators, constants, utilities
    ui/             # Shared UI primitives (cross-platform where possible)
    supabase/       # Supabase client, queries, types, migrations
    config/         # Shared ESLint, TSConfig, Prettier configs
  supabase/
    migrations/     # SQL migration files (Git-tracked)
    functions/      # Edge Functions
    config.toml     # Local dev config
    seed.sql        # Seed data for dev
  turbo.json
  pnpm-workspace.yaml
  .npmrc
```

**pnpm .npmrc Configuration (required for Expo compatibility):**
```ini
node-linker=hoisted
shamefully-hoist=true
auto-install-peers=true
```

---

### Web Apps (Next.js)

| Library | Version | Purpose | Rationale |
|---------|---------|---------|-----------|
| **Next.js** | 15.5.x | Framework | Last stable 15.x release. Battle-tested, Turbopack dev support, App Router. Maintenance LTS but fully supported. Avoids 16.x which is too new (Dec 2025) for a care platform requiring stability. |
| **React** | 19.0.x | UI library | Ships with Next.js 15.5. Server Components, Actions, Suspense boundaries. |
| **Tailwind CSS** | ^4.0.x | Styling | Utility-first, design-token support, JIT compilation. v4 is stable and significantly faster. |
| **shadcn/ui** | latest (CLI) | Component library | Not an npm dependency - copies source into project. Full control, accessible (Radix UI), AI-editable. Use `npx shadcn@latest init`. |
| **Radix UI** | latest | Primitives | Accessible headless components. shadcn/ui is built on top of Radix. |
| **TanStack Query** | ^5.64.x | Server state | Caching, background refetch, optimistic updates. Essential for NDIS data that changes infrequently but must be fresh. |
| **Zustand** | ^5.0.x | Client state | Lightweight global state. Use for UI state (sidebar open, filters). NOT for server data. |
| **React Hook Form** | ^7.54.x | Forms | Uncontrolled inputs for performance. NDIS forms can be complex (50+ fields). |
| **Zod** | ^3.24.x | Validation | Runtime type checking + TypeScript inference. Shared between client and server. Single source of truth for form schemas. |
| **@react-pdf/renderer** | ^4.3.x | PDF generation | React-component-based PDF creation. Service agreements, invoices, progress notes. Runs in API routes. |
| **date-fns** | ^4.1.x | Date handling | Tree-shakeable, immutable. NDIS billing cycles, shift calculations, roster dates. |
| **nuqs** | ^2.4.x | URL state | Type-safe search params. Filter states in admin tables (participant list, shifts). |
| **next-safe-action** | ^7.10.x | Server Actions | Type-safe server actions with validation middleware. |
| **Motion** | ^11.18.x | Animations | Page transitions, micro-interactions. Formerly Framer Motion. |

**Next.js Configuration (next.config.ts):**
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
    serverActions: {
      bodySizeLimit: '5mb', // For file uploads
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

export default nextConfig
```

---

### Mobile App (React Native / Expo)

| Library | Version | Purpose | Rationale |
|---------|---------|---------|-----------|
| **Expo SDK** | 53 | Framework | Stable release (April 2025). React Native 0.79. New Architecture enabled by default. SDK 54 is beta with known build issues (MMKV, etc). |
| **expo-router** | ~5.0.x | Navigation | File-based routing (same mental model as Next.js). Deep linking, typed routes. |
| **React Native** | 0.79.x | Runtime | Ships with Expo SDK 53. New Architecture (Fabric, TurboModules) default. |
| **@react-navigation/native** | ^7.x | Navigation core | Underlying navigation engine for expo-router. |
| **Zustand** | ^5.0.x | State management | Same as web - shared mental model, minimal boilerplate. |
| **TanStack Query** | ^5.64.x | Server state | Same as web. Offline-first with `persistQueryClient`. |
| **expo-secure-store** | ~14.0.x | Secure storage | Auth tokens, sensitive data. Uses Keychain (iOS) / Keystore (Android). |
| **expo-location** | ~18.0.x | Geolocation | Worker check-in/out location verification. Background location for shift tracking. |
| **expo-camera** | ~16.0.x | Camera | Photo evidence for incident reports, task completion. |
| **expo-notifications** | ~0.30.x | Push notifications | Shift reminders, schedule changes, urgent alerts. |
| **expo-local-authentication** | ~15.0.x | Biometrics | FaceID/TouchID for quick clock-in. |
| **React Native Paper** | ^5.13.x | UI components | Material Design 3 components. Consistent, accessible, good for forms. |
| **react-native-reanimated** | ~3.16.x | Animations | Smooth 60fps animations. Gesture-driven interactions. |
| **AsyncStorage** | ~2.1.x | Local storage | Offline shift data, cached schedules. Use for non-sensitive data only. |

**Expo app.json Configuration:**
```json
{
  "expo": {
    "name": "Ephraim Care Worker",
    "slug": "ephraimcare-worker",
    "version": "1.0.0",
    "scheme": "ephraimcare",
    "newArchEnabled": true,
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Ephraim Care needs your location to verify shift check-in/out."
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Ephraim Care needs camera access for incident documentation."
        }
      ],
      [
        "expo-local-authentication",
        {
          "faceIDPermission": "Allow Ephraim Care to use Face ID for quick clock-in."
        }
      ]
    ]
  }
}
```

---

### Backend (Supabase)

| Component | Version/Config | Purpose | Rationale |
|-----------|---------------|---------|-----------|
| **supabase-js** | ^2.49.x | Client SDK | Isomorphic JS client. Works in Next.js (server/client) and React Native. |
| **@supabase/ssr** | ^0.6.x | Next.js SSR helpers | Cookie-based auth for App Router. Server Components + Server Actions. |
| **Supabase CLI** | ^2.x | Local dev + migrations | `supabase init`, `supabase start`, `supabase db diff`, `supabase migration new`. |
| **PostgreSQL** | 15+ (Supabase managed) | Database | RLS, triggers, functions, full-text search. Supabase manages the instance. |
| **Edge Functions** | Deno runtime | Serverless logic | Complex business logic, NDIS API integrations, PDF generation triggers. |

**Auth Strategy:**
```
- Email/password for admin and participant portals
- Magic link as backup for participants (accessibility)
- PIN + biometric for worker mobile app (quick clock-in)
- Custom claims in JWT for role-based access:
  - admin: Full CRUD on all resources
  - coordinator: Manage rosters, participants, workers in their team
  - worker: Own shifts, own participants, clock-in/out
  - participant: Own plans, own service agreements, view schedules
  - family: Read-only access to linked participant's data
```

**RLS Strategy (Row Level Security):**
```sql
-- Example: Workers can only see their assigned participants
CREATE POLICY "workers_own_participants" ON participants
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT participant_id FROM participant_assignments
      WHERE worker_id = (SELECT auth.uid())
    )
  );

-- Example: Admin sees all
CREATE POLICY "admin_all_participants" ON participants
  FOR ALL TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

-- Performance: Always use subselects for auth functions
-- Always index foreign key columns used in RLS policies
CREATE INDEX idx_participant_assignments_worker_id
  ON participant_assignments(worker_id);
```

**Multi-Environment Setup:**
```
Environments:
  - Development: Local Supabase via CLI (supabase start)
  - Staging: Supabase project "ephraimcare-staging"
  - Production: Supabase project "ephraimcare-prod"

Migration Workflow:
  1. Make schema changes in local Supabase Studio
  2. Run: supabase db diff --schema public -f descriptive_name
  3. Review generated migration SQL
  4. Commit migration file to Git
  5. CI applies migration to staging on merge to develop
  6. CI applies migration to production on merge to main
```

**Edge Functions (key use cases):**
```typescript
// supabase/functions/generate-invoice/index.ts
// Triggered by: shift completion -> invoice generation
// Uses: @react-pdf/renderer for PDF, stores in Supabase Storage

// supabase/functions/send-notification/index.ts
// Triggered by: schedule change, shift reminder
// Uses: Expo Push API for mobile, email for web users

// supabase/functions/ndis-price-sync/index.ts
// Triggered by: weekly cron
// Uses: Fetches latest NDIS Price Guide rates
```

---

### Supabase Realtime

| Feature | Use Case | Configuration |
|---------|----------|---------------|
| **Postgres Changes** | Shift status updates, new messages | Subscribe to `shifts`, `messages` tables. Enable in Publication settings. |
| **Broadcast** | Live notifications, typing indicators | Ephemeral messages between connected clients. |
| **Presence** | Who's online, active workers | Track worker online status, coordinator availability. |

**Realtime Implementation Pattern:**
```typescript
// Subscribe to shift updates for a specific worker
const channel = supabase
  .channel('worker-shifts')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'shifts',
      filter: `worker_id=eq.${workerId}`,
    },
    (payload) => {
      // Handle shift update
    }
  )
  .subscribe()
```

**Realtime Limitations to Plan For:**
- Max 100 channels per tenant (sufficient for <20 participants)
- Max 200 concurrent users per channel (not a concern at this scale)
- DELETE events cannot be filtered by RLS
- Table names must not contain spaces

---

### File Storage & PDF Generation

| Component | Purpose | Configuration |
|-----------|---------|---------------|
| **Supabase Storage** | File storage | Buckets: `documents`, `photos`, `avatars`, `invoices` |
| **@react-pdf/renderer** | PDF creation | React components render to PDF stream |
| **Next.js API Routes** | PDF endpoints | Generate + stream PDFs on demand |

**Storage Buckets:**
```
documents/          # Service agreements, NDIS plans, policies (private)
photos/             # Incident photos, task completion evidence (private)
avatars/            # User profile pictures (public, with transforms)
invoices/           # Generated invoice PDFs (private)
progress-notes/     # Progress note attachments (private)
```

**PDF Generation Pattern (Midday.ai approach):**
```typescript
// apps/admin/app/api/invoice/[id]/route.ts
import { renderToStream } from '@react-pdf/renderer'
import { InvoiceTemplate } from '@/components/pdf/invoice-template'
import { createClient } from '@ephraimcare/supabase/server'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, line_items(*), participant(*)')
    .eq('id', params.id)
    .single()

  const stream = await renderToStream(
    <InvoiceTemplate invoice={invoice} />
  )

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${invoice.number}.pdf"`,
    },
  })
}
```

---

### Shared Libraries (packages/)

#### `packages/shared`
```
Purpose: Cross-platform types, validators, constants
Contents:
  - types/           # TypeScript interfaces (Participant, Shift, Invoice, etc.)
  - validators/      # Zod schemas (shared between client forms + server actions)
  - constants/       # NDIS support categories, price guide items, shift types
  - utils/           # Pure utility functions (date formatting, currency, ABN validation)
```

#### `packages/supabase`
```
Purpose: Supabase client configuration, typed queries, generated types
Contents:
  - client.ts        # createClient() for different environments (server, browser, mobile)
  - queries/         # Typed query functions (getParticipant, getShifts, etc.)
  - types.ts         # Auto-generated from: supabase gen types typescript
  - middleware.ts    # Supabase auth middleware for Next.js
```

#### `packages/ui`
```
Purpose: Shared UI components (primarily web, some cross-platform)
Contents:
  - components/      # Copied shadcn/ui components + custom ones
  - hooks/           # Shared React hooks (useDebounce, useMediaQuery)
  - lib/             # cn() utility, theme config
```

#### `packages/config`
```
Purpose: Shared tooling configuration
Contents:
  - eslint/          # Shared ESLint configs (base, next, react-native)
  - typescript/      # Base tsconfig.json
  - prettier/        # Shared Prettier config
```

---

### Testing

| Tool | Version | Scope | Rationale |
|------|---------|-------|-----------|
| **Vitest** | ^3.0.x | Unit + Integration | Fast, ESM-native, Jest-compatible API. Works with Next.js App Router. |
| **React Testing Library** | ^16.2.x | Component tests | Tests user behavior, not implementation. Accessibility-focused. |
| **Playwright** | ^1.50.x | E2E tests | Multi-browser, mobile emulation, visual regression. Used for critical user flows. |
| **MSW (Mock Service Worker)** | ^2.7.x | API mocking | Intercepts network requests in tests. Mock Supabase responses without hitting DB. |
| **@testing-library/react-native** | ^12.9.x | Mobile component tests | Same Testing Library API for React Native components. |
| **Faker.js** | ^9.4.x | Test data | Generate realistic NDIS test data (participants, shifts, invoices). |

**Testing Strategy:**
```
Coverage Targets:
  - Unit tests (Vitest): 80%+ coverage on business logic
  - Component tests (RTL): All form components, data display components
  - Integration tests (Vitest + MSW): API routes, Server Actions
  - E2E tests (Playwright): Critical paths only

Critical E2E Paths:
  1. Admin: Create participant -> Assign worker -> Create shift
  2. Worker: Clock-in -> Complete tasks -> Clock-out -> Submit notes
  3. Participant: View schedule -> View progress notes -> Download invoice
  4. Auth: Login -> Role-based redirect -> Logout

Test File Structure:
  apps/admin/
    __tests__/
      components/     # Component unit tests
      app/            # Route handler + Server Action tests
    e2e/              # Playwright E2E tests
    playwright.config.ts
    vitest.config.ts
```

**Vitest Configuration:**
```typescript
// apps/admin/vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'e2e/', '**/*.config.*'],
    },
    include: ['__tests__/**/*.{test,spec}.{ts,tsx}'],
  },
})
```

**Playwright Configuration:**
```typescript
// apps/admin/playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 15'] } },
  ],
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

---

### DevOps & Deployment

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **Vercel** | Web hosting | Both Next.js apps deployed. Monorepo support via Root Directory setting. |
| **EAS Build** | Mobile builds | Expo Application Services for iOS/Android builds. |
| **EAS Submit** | App store submission | Automated TestFlight/Play Store uploads. |
| **GitHub Actions** | CI/CD | Lint, type-check, test, build on PRs. Deploy on merge. |
| **Supabase CLI** | DB migrations | Applied via CI on environment branches. |

**GitHub Actions Workflow:**
```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [main, develop]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo lint typecheck
      - run: pnpm turbo test -- --coverage
      - run: pnpm turbo build

  e2e:
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: npx playwright install --with-deps chromium
      - run: pnpm --filter admin e2e

  migrate-staging:
    if: github.base_ref == 'develop'
    runs-on: ubuntu-latest
    needs: [quality, e2e]
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase db push --project-ref ${{ secrets.STAGING_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

**Environment Strategy:**
```
Branches:
  main      -> Production (Vercel prod, Supabase prod)
  develop   -> Staging (Vercel preview, Supabase staging)
  feature/* -> Preview (Vercel preview, local Supabase)

Environment Variables (per environment):
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY (server-only)
  SUPABASE_DB_URL (migrations only)
```

**Vercel Monorepo Configuration:**
```
Admin app:
  Root Directory: apps/admin
  Build Command: cd ../.. && pnpm turbo build --filter=admin
  Output Directory: apps/admin/.next

Participant app:
  Root Directory: apps/participant
  Build Command: cd ../.. && pnpm turbo build --filter=participant
  Output Directory: apps/participant/.next
```

---

## What NOT to Use

| Technology | Why NOT | Use Instead |
|-----------|---------|-------------|
| **Prisma** | Adds abstraction over Supabase's already-typed client. Conflicts with RLS (bypasses policies). Unnecessary ORM when supabase-js handles typed queries via `supabase gen types`. | supabase-js + generated types |
| **tRPC** | Over-engineering for this scale. Supabase client already provides typed API access. Server Actions handle mutations. | Server Actions + TanStack Query |
| **Redux / Redux Toolkit** | Massive boilerplate for a <20 participant app. Zustand provides same capabilities in 1/10th the code. | Zustand |
| **Styled Components / CSS Modules** | Runtime CSS-in-JS adds bundle size and hydration complexity. Tailwind is faster, more maintainable, better AI compatibility. | Tailwind CSS |
| **Firebase** | Google ecosystem lock-in. Supabase provides equivalent features with Postgres (SQL), better RLS, open-source, Australian data residency options. | Supabase |
| **NextAuth.js / Auth.js** | Unnecessary when Supabase Auth handles everything: email, magic link, OAuth, custom claims, session management. Adding Auth.js creates two auth systems. | Supabase Auth |
| **Expo SDK 54** | Still in beta (Aug 2025). Known build issues with react-native-mmkv on both iOS and Android. React Native 0.81 is too new for production care apps. | Expo SDK 53 |
| **Next.js 16** | Released Dec 2025 - too new for a care management platform. Ecosystem (shadcn, middleware patterns) not fully validated. | Next.js 15.5 (Maintenance LTS) |
| **Jest** | Slower than Vitest, doesn't natively support ESM, more configuration needed for App Router. Vitest is the successor. | Vitest |
| **Puppeteer (for PDFs)** | Requires headless Chrome, heavy memory usage, cold start issues in serverless. @react-pdf/renderer is lighter and React-native. | @react-pdf/renderer |
| **react-native-mmkv** | Known build failures on Expo SDK 53/54 with New Architecture. Not worth the debugging. | expo-secure-store + AsyncStorage |
| **Drizzle ORM** | Same issue as Prisma - bypasses Supabase RLS, adds unnecessary abstraction layer. If you need raw SQL, use Supabase Edge Functions with direct Postgres connection. | supabase-js |
| **Chakra UI / Material UI (web)** | Heavy bundle size, opinionated styling that fights Tailwind. shadcn/ui gives you ownership of component code. | shadcn/ui |
| **Formik** | Legacy, larger bundle, more re-renders than React Hook Form. RHF's uncontrolled approach is better for complex NDIS forms. | React Hook Form |
| **Moment.js** | Deprecated, massive bundle. date-fns is tree-shakeable and immutable. | date-fns |
| **Socket.io** | Unnecessary when Supabase Realtime provides WebSocket channels with Postgres integration out of the box. | Supabase Realtime |

---

## Confidence Levels

### HIGH Confidence (90%+ - Battle-tested, community consensus)

| Choice | Confidence | Notes |
|--------|-----------|-------|
| Turborepo + pnpm | 95% | Industry standard for JS monorepos. Vercel-maintained. |
| Next.js 15.5 | 92% | Stable LTS, massive ecosystem, App Router mature. |
| Tailwind CSS 4 | 95% | Undisputed standard for utility-first styling. |
| shadcn/ui | 93% | Dominant React component approach in 2025. Full code ownership. |
| TanStack Query 5 | 95% | De facto server state management. |
| Zustand 5 | 93% | Lightweight, minimal boilerplate, excellent DX. |
| React Hook Form + Zod | 94% | Best form library + best validator. Industry standard pair. |
| Vitest + RTL | 92% | Modern testing stack, Jest-compatible, fast. |
| Playwright | 94% | Best E2E framework. Multi-browser, reliable. |
| Supabase Auth | 90% | Handles all auth patterns needed. Built-in RLS integration. |
| @react-pdf/renderer | 88% | Proven at scale (Midday.ai). React-native approach to PDFs. |

### MEDIUM Confidence (70-89% - Good choice but alternatives exist)

| Choice | Confidence | Notes |
|--------|-----------|-------|
| Expo SDK 53 | 85% | Stable, but SDK 54 will be stable soon. May need upgrade mid-project. |
| expo-router | 82% | Maturing rapidly, some edge cases. File-based routing is the future. |
| React Native Paper | 78% | Good for forms/data-heavy apps. NativeWind + custom components is alternative. |
| Supabase Realtime | 80% | Works well at small scale. At larger scale, Broadcast preferred over Postgres Changes. |
| date-fns | 85% | Solid choice. Temporal API (Stage 3) may eventually replace, but not yet stable. |
| nuqs | 80% | Newer library, but solves URL state perfectly for admin tables. |
| next-safe-action | 78% | Relatively newer, but type-safe Server Actions are essential. |
| Motion (Framer) | 82% | Best animation library, but adds bundle size. Only use where UX demands it. |

### LOWER Confidence (60-69% - Monitor for changes)

| Choice | Confidence | Notes |
|--------|-----------|-------|
| Supabase Edge Functions | 68% | Deno runtime is solid but tooling/debugging still maturing. May prefer Next.js API routes for some logic. |
| MSW 2.x | 72% | Great for API mocking but setup complexity in App Router. Worth it for isolated tests. |
| EAS Build for pnpm monorepo | 65% | EAS internally assumes Yarn. May need workarounds for pnpm workspace resolution. Test early. |
| AsyncStorage for offline | 68% | Works but not performant for large datasets. If offline-first becomes critical, reconsider Watermelon DB. |

---

## NDIS-Specific Technical Considerations

### Data Model Priorities
```
Core Entities (Phase 1):
  - Organizations (the provider - Ephraim Care)
  - Participants (NDIS participants)
  - Workers (support workers)
  - Shifts (clock-in/out records)
  - Service Agreements
  - Invoices + Line Items

NDIS Compliance:
  - NDIS Price Guide rates (updated annually, store as versioned lookup table)
  - Support categories and item numbers
  - Participant plans with budget tracking
  - Progress notes (mandatory for billing)
  - Incident reports (mandatory for quality & safeguards)
```

### Australian Compliance
```
Data Residency:
  - Supabase: Use Sydney region (ap-southeast-2) for both projects
  - Vercel: Sydney Edge deployment
  - All PII must stay in Australia

Privacy:
  - Australian Privacy Principles (APPs) apply
  - NDIS Quality and Safeguards Commission requirements
  - Participant consent for data sharing
  - Right to access/correct personal information
```

### Accessibility (WCAG 2.1 AA)
```
Requirements:
  - All web apps must meet WCAG 2.1 AA minimum
  - Many participants have cognitive/physical disabilities
  - High contrast themes available
  - Screen reader compatible (Radix UI primitives handle this)
  - Keyboard navigation for all interactive elements
  - Large touch targets on mobile (minimum 44x44px)
```

---

## Version Lock File

**Recommended exact versions (as of January 2026):**

```json
{
  "web-dependencies": {
    "next": "15.5.3",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "tailwindcss": "4.0.6",
    "@tanstack/react-query": "5.64.2",
    "zustand": "5.0.3",
    "react-hook-form": "7.54.2",
    "zod": "3.24.1",
    "@react-pdf/renderer": "4.3.0",
    "date-fns": "4.1.0",
    "nuqs": "2.4.1",
    "next-safe-action": "7.10.4",
    "motion": "11.18.2",
    "@supabase/supabase-js": "2.49.1",
    "@supabase/ssr": "0.6.1"
  },
  "mobile-dependencies": {
    "expo": "~53.0.0",
    "react-native": "0.79.2",
    "expo-router": "~5.0.6",
    "expo-secure-store": "~14.0.1",
    "expo-location": "~18.0.3",
    "expo-camera": "~16.0.6",
    "expo-notifications": "~0.30.2",
    "expo-local-authentication": "~15.0.2",
    "react-native-paper": "5.13.1",
    "react-native-reanimated": "~3.16.7",
    "@react-native-async-storage/async-storage": "2.1.0",
    "@tanstack/react-query": "5.64.2",
    "zustand": "5.0.3"
  },
  "dev-dependencies": {
    "typescript": "5.7.3",
    "vitest": "3.0.4",
    "@testing-library/react": "16.2.0",
    "@playwright/test": "1.50.1",
    "msw": "2.7.0",
    "@testing-library/react-native": "12.9.0",
    "@faker-js/faker": "9.4.0",
    "turbo": "2.4.4",
    "eslint": "9.18.0",
    "prettier": "3.4.2"
  },
  "tooling": {
    "node": ">=22.0.0",
    "pnpm": ">=9.15.0",
    "supabase-cli": ">=2.0.0"
  }
}
```

---

## Decision Record

| Decision | Date | Rationale | Revisit When |
|----------|------|-----------|--------------|
| Next.js 15.5 over 16 | 2026-01-24 | 16.x too new (1 month old). Care platforms need stability. | March 2026 (if 16.1+ proves stable) |
| Expo SDK 53 over 54 | 2026-01-24 | SDK 54 beta with build issues. SDK 53 is stable + New Arch default. | When SDK 54 reaches stable (est. Feb 2026) |
| No ORM (Prisma/Drizzle) | 2026-01-24 | Supabase-js + generated types + RLS is the complete data layer. ORMs bypass RLS. | Never (architectural principle) |
| @react-pdf over Puppeteer | 2026-01-24 | Lighter, serverless-friendly, React-native API. | If PDF quality issues arise |
| Supabase over Firebase | 2026-01-24 | Open-source, Postgres, RLS, AU data residency, better for regulated industries. | Never (architectural principle) |
| pnpm over Yarn/Bun | 2026-01-24 | Best Turborepo integration, proven monorepo support, fast installs. | If EAS Build issues are unresolvable |

---

*This document feeds into the project roadmap. All versions verified as of January 24, 2026.*
