# Phase 1: Foundation - Research

**Researched:** 2026-01-24
**Domain:** Monorepo infrastructure, Supabase auth/RLS/migrations, Tailwind CSS 4, Testing
**Confidence:** HIGH

## Summary

This phase establishes the entire infrastructure for the Ephraim Care NDIS portal: a Turborepo + pnpm monorepo housing three apps (admin, participant, worker-mobile) and five shared packages, backed by Supabase with PostgreSQL, RLS, and audit logging. The foundation includes authentication with role-based access control, SQL migrations tracked in Git, and a full testing setup.

The standard approach is well-documented across official sources. Turborepo 2.x with pnpm 9.x workspaces is the established pattern for monorepos with Next.js + Expo. Supabase's `@supabase/ssr` package provides cookie-based auth for Next.js 15 App Router, with custom JWT claims enabling RBAC through auth hooks. shadcn/ui has first-class monorepo support with Tailwind CSS 4's CSS-based configuration. The key complexity lies in the intersection of Expo SDK 53 with pnpm (requiring `node-linker=hoisted`), the Supabase auth hook for injecting roles into JWTs, and organizing 14+ tables with triggers and RLS policies across ordered migrations.

**Primary recommendation:** Set up Turborepo + pnpm first, then Supabase migrations (tables, then functions/triggers, then RLS policies, then seed data), then auth with custom claims, then testing infrastructure.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Turborepo | 2.4.x | Monorepo task orchestration | Official Vercel tool, caching, parallelization |
| pnpm | 9.x | Package management | Fast, disk-efficient, workspace protocol |
| Next.js | 15.5.x | Web app framework (admin + participant) | App Router, RSC, Server Actions |
| React | 19.x | UI library | Required by Next.js 15.5 and Expo SDK 53 |
| Expo SDK | 53 | Mobile app framework (worker) | React Native 0.79, React 19, monorepo support |
| expo-router | 5.x | Mobile navigation | File-based routing for Expo |
| Supabase | latest | Backend (PostgreSQL, Auth, RLS, Edge Functions) | Managed Postgres with built-in auth |
| @supabase/ssr | latest | Server-side auth for Next.js | Cookie-based session, PKCE flow |
| @supabase/supabase-js | latest | Supabase client SDK | Type-safe database access |
| Tailwind CSS | 4.x | Utility CSS | CSS-based config, @theme directive |
| shadcn/ui | latest | Component library | First-class monorepo support, Tailwind v4 |
| Vitest | 3.x | Unit/integration testing | Fast, Turborepo compatible |
| Playwright | latest | E2E testing | Cross-browser, Turborepo guide exists |
| React Testing Library | latest | Component testing | Standard for React testing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TanStack Query | 5.x | Server state management | All data fetching from Supabase |
| Zustand | 5.x | Client state management | UI state, auth state, form drafts |
| React Hook Form | latest | Form management | All forms (login, CRUD) |
| Zod | latest | Schema validation | Form validation, API validation |
| date-fns | 4.x | Date utilities | Shift times, invoicing, NDIS dates |
| @date-fns/tz | latest | Timezone handling | Australia/Sydney (AEST/AEDT) |
| tw-animate-css | latest | Animation utility | Replaces tailwindcss-animate for shadcn/ui |
| MSW | latest | API mocking | Testing Supabase API calls |
| lucide-react | latest | Icons | shadcn/ui default icon library |
| React Native Paper | latest | Mobile UI components | Worker mobile app Material Design |
| jwt-decode | latest | JWT parsing | Reading role claims client-side |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| No ORM (supabase-js) | Prisma/Drizzle | Decision locked: supabase-js + generated types, no ORM |
| @date-fns/tz | date-fns-tz (v3 compat) | date-fns v4 native TZ is preferred but zzz format token not fully supported yet |
| supa_audit extension | Custom audit trigger | Custom trigger gives more control over auth.uid() capture |
| moddatetime extension | Custom updated_at trigger | moddatetime is simpler but custom trigger can also protect created_at |

**Installation (root):**
```bash
pnpm add -w turbo
pnpm add -Dw typescript @types/node
```

**Installation (apps/admin & apps/participant):**
```bash
pnpm add next@15.5 react@19 react-dom@19 @supabase/supabase-js @supabase/ssr @tanstack/react-query zustand react-hook-form zod date-fns @date-fns/tz jwt-decode
pnpm add -D tailwindcss@4 @tailwindcss/postcss postcss tw-animate-css vitest @testing-library/react @testing-library/jest-dom playwright @playwright/test msw
```

**Installation (apps/worker-mobile):**
```bash
pnpm add expo expo-router react-native react-native-paper @supabase/supabase-js @tanstack/react-query zustand react-hook-form zod date-fns @date-fns/tz
```

## Architecture Patterns

### Recommended Project Structure
```
ephraimcare-portal-2026/
├── apps/
│   ├── admin/                    # Next.js 15.5 (Admin portal)
│   │   ├── app/                  # App Router
│   │   │   ├── (auth)/           # Auth routes (login, reset-password)
│   │   │   ├── (protected)/      # Protected routes (dashboard, etc.)
│   │   │   ├── layout.tsx
│   │   │   └── middleware.ts     # Supabase auth middleware
│   │   ├── components/           # App-specific components
│   │   ├── lib/
│   │   │   └── supabase/
│   │   │       ├── client.ts     # Browser client
│   │   │       ├── server.ts     # Server client
│   │   │       └── middleware.ts # updateSession helper
│   │   ├── components.json       # shadcn/ui config
│   │   ├── next.config.ts
│   │   ├── postcss.config.js
│   │   └── package.json
│   ├── participant/              # Next.js 15.5 (Participant portal)
│   │   └── (same structure as admin)
│   └── worker-mobile/            # Expo SDK 53
│       ├── app/                  # expo-router file-based routing
│       ├── components/
│       ├── lib/
│       ├── app.json
│       ├── metro.config.js
│       └── package.json
├── packages/
│   ├── types/                    # Generated Supabase types + shared types
│   │   ├── src/
│   │   │   ├── database.ts      # supabase gen types output
│   │   │   └── index.ts
│   │   └── package.json
│   ├── supabase/                 # Supabase client factory
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── admin.ts         # Service role client (seeding/admin)
│   │   └── package.json
│   ├── utils/                    # Shared utilities
│   │   ├── src/
│   │   │   ├── dates.ts          # Timezone helpers (Australia/Sydney)
│   │   │   ├── currency.ts       # AUD formatting
│   │   │   └── validators.ts     # Shared Zod schemas
│   │   └── package.json
│   ├── ui/                       # shadcn/ui shared components
│   │   ├── src/
│   │   │   ├── components/       # shadcn components
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   │   └── utils.ts      # cn() helper
│   │   │   └── styles/
│   │   │       └── globals.css   # Tailwind theme + Ephraim Care tokens
│   │   ├── components.json
│   │   └── package.json
│   └── config/                   # Shared config (eslint, tsconfig, etc.)
│       ├── eslint/
│       ├── typescript/
│       └── package.json
├── supabase/
│   ├── config.toml               # Supabase local dev config
│   ├── migrations/               # SQL migrations (timestamped)
│   ├── functions/                # Edge Functions
│   ├── seed.sql                  # Seed data script
│   └── package.json              # Workspace member for type gen
├── turbo.json
├── pnpm-workspace.yaml
├── .npmrc
└── package.json
```

### Pattern 1: Supabase SSR Auth (Next.js 15.5 App Router)
**What:** Cookie-based authentication using @supabase/ssr with getAll/setAll cookie pattern
**When to use:** All Next.js apps (admin, participant)

**Server Client (packages/supabase or per-app lib/supabase/server.ts):**
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component - middleware handles refresh
          }
        },
      },
    }
  )
}
```

**Middleware (updateSession pattern):**
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add code between createServerClient and getUser()
  const { data: { user } } = await supabase.auth.getUser()

  // Role-based route protection
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

### Pattern 2: Custom Claims RBAC via Auth Hook
**What:** Inject user role into JWT so RLS policies and middleware can read it without DB queries
**When to use:** All role-based access decisions

**Auth Hook SQL Function:**
```sql
-- Source: https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac
create type public.app_role as enum ('admin', 'coordinator', 'worker', 'participant');

create table public.user_roles (
  id bigint generated by default as identity primary key,
  user_id uuid references auth.users on delete cascade not null,
  role app_role not null,
  organization_id uuid not null,
  unique (user_id, role)
);

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_role public.app_role;
  org_id uuid;
begin
  select role, organization_id into user_role, org_id
  from public.user_roles
  where user_id = (event->>'user_id')::uuid
  limit 1;

  claims := event->'claims';

  if user_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    claims := jsonb_set(claims, '{organization_id}', to_jsonb(org_id));
  else
    claims := jsonb_set(claims, '{user_role}', 'null');
    claims := jsonb_set(claims, '{organization_id}', 'null');
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;
```

**RLS Helper Functions:**
```sql
-- Get current user's role from JWT claims
create or replace function public.get_user_role()
returns public.app_role
language sql
stable
as $$
  select (auth.jwt() ->> 'user_role')::public.app_role;
$$;

-- Check if user is admin or coordinator
create or replace function public.is_admin_or_coordinator()
returns boolean
language sql
stable
as $$
  select get_user_role() in ('admin', 'coordinator');
$$;

-- Get current user's organization from JWT claims
create or replace function public.get_user_organization_id()
returns uuid
language sql
stable
as $$
  select (auth.jwt() ->> 'organization_id')::uuid;
$$;
```

**RLS Policy Pattern (organization isolation):**
```sql
-- Example for shifts table
alter table shifts enable row level security;

create policy "Users can view shifts in their organization"
  on shifts for select
  to authenticated
  using (organization_id = get_user_organization_id());

create policy "Admin/coordinator can insert shifts"
  on shifts for insert
  to authenticated
  with check (
    is_admin_or_coordinator()
    and organization_id = get_user_organization_id()
  );

create policy "Admin/coordinator can update shifts"
  on shifts for update
  to authenticated
  using (
    is_admin_or_coordinator()
    and organization_id = get_user_organization_id()
  );
```

### Pattern 3: Audit Trail Trigger
**What:** Automatic audit logging of all data changes with user context
**When to use:** All sensitive tables (participants, shifts, invoices, etc.)

```sql
-- Source: https://supabase.com/blog/postgres-audit (adapted with auth.uid)
create schema if not exists audit;

create table audit.audit_log (
  id bigserial primary key,
  table_name text not null,
  record_id uuid,
  operation text not null,  -- INSERT/UPDATE/DELETE
  old_data jsonb,
  new_data jsonb,
  changed_by uuid,          -- auth.uid()
  changed_at timestamptz not null default now()
);

create or replace function audit.audit_trigger_func()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'INSERT' then
    insert into audit.audit_log (table_name, record_id, operation, new_data, changed_by)
    values (TG_TABLE_NAME, new.id, TG_OP, to_jsonb(new), auth.uid());
    return new;
  elsif TG_OP = 'UPDATE' then
    insert into audit.audit_log (table_name, record_id, operation, old_data, new_data, changed_by)
    values (TG_TABLE_NAME, new.id, TG_OP, to_jsonb(old), to_jsonb(new), auth.uid());
    return new;
  elsif TG_OP = 'DELETE' then
    insert into audit.audit_log (table_name, record_id, operation, old_data, changed_by)
    values (TG_TABLE_NAME, old.id, TG_OP, to_jsonb(old), auth.uid());
    return old;
  end if;
end;
$$;

-- Apply to a table:
create trigger audit_log_trigger
  after insert or update or delete on public.shifts
  for each row execute function audit.audit_trigger_func();
```

### Pattern 4: Tailwind CSS 4 + shadcn/ui Monorepo Theme
**What:** CSS-based Tailwind config with Ephraim Care branding tokens
**When to use:** packages/ui/src/styles/globals.css

```css
/* Source: https://ui.shadcn.com/docs/tailwind-v4 */
@import "tailwindcss";
@import "tw-animate-css";

/* Ephraim Care brand tokens */
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.65 0.15 145);      /* Green #66BB6A */
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.60 0.12 185);    /* Teal #00BFA5 */
  --secondary-foreground: oklch(1 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --border: oklch(0.922 0 0);
  --ring: oklch(0.65 0.15 145);
  --radius: 8px;
  /* ... other shadcn tokens */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... dark mode overrides */
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 4px);
  --font-heading: 'Montserrat', sans-serif;
  --font-body: 'Inter', sans-serif;
}

@source "../../apps/admin/app/**/*.{ts,tsx}";
@source "../../apps/participant/app/**/*.{ts,tsx}";
@source "../ui/src/**/*.{ts,tsx}";
```

### Pattern 5: Turborepo Configuration
**What:** turbo.json task definitions for the monorepo
**When to use:** Root turbo.json

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:watch": {
      "cache": false,
      "persistent": true
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "outputs": ["playwright-report/**"],
      "passThroughEnv": ["PLAYWRIGHT_*"]
    },
    "generate": {
      "cache": false
    }
  },
  "globalEnv": ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]
}
```

### Pattern 6: SQL Migration Organization
**What:** Ordered migrations for complex schema with dependencies
**When to use:** supabase/migrations/ directory

```
supabase/migrations/
├── 20260124000001_create_extensions.sql          # Extensions (moddatetime, pgcrypto)
├── 20260124000002_create_types.sql               # Custom enums (app_role, shift_status, etc.)
├── 20260124000003_create_audit_schema.sql        # Audit table + trigger function
├── 20260124000004_create_profiles.sql            # profiles table (references auth.users)
├── 20260124000005_create_user_roles.sql          # user_roles + auth hook function
├── 20260124000006_create_participants.sql        # participants table
├── 20260124000007_create_workers.sql             # workers table
├── 20260124000008_create_ndis_plans.sql          # ndis_plans + plan_budgets
├── 20260124000009_create_service_agreements.sql  # service_agreements + items
├── 20260124000010_create_shifts.sql              # shifts table
├── 20260124000011_create_case_notes.sql          # case_notes table
├── 20260124000012_create_invoices.sql            # invoices + line_items
├── 20260124000013_create_ndis_price_guide.sql    # price guide reference data
├── 20260124000014_create_notifications.sql       # notifications table
├── 20260124000015_create_error_log.sql           # error_log table (INFR-04)
├── 20260124000016_create_triggers.sql            # All triggers (updated_at, audit, etc.)
├── 20260124000017_create_rls_policies.sql        # All RLS policies
└── 20260124000018_grant_permissions.sql          # Auth hook permissions
```

### Anti-Patterns to Avoid
- **Storing roles in user_metadata:** user_metadata can be modified by end users, creating security holes. Always use a separate user_roles table with an auth hook.
- **Using getSession() for auth protection:** getSession() does not revalidate the JWT. Use getUser() or getClaims() on the server.
- **Individual get/set/remove cookies:** @supabase/ssr REQUIRES getAll/setAll pattern only. Never use individual cookie methods.
- **Shared tailwind.config.js:** Tailwind CSS 4 uses CSS-based configuration with @theme directive. No JavaScript config file needed.
- **Putting supabase/ outside the workspace:** The supabase directory should be a pnpm workspace member for type generation scripts.
- **Running `supabase gen types` from app directories:** Always run from the monorepo root and output to packages/types.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cookie-based auth | Custom cookie management | @supabase/ssr createServerClient | Handles PKCE, token refresh, chunked cookies |
| JWT role extraction | Manual JWT parsing | auth.jwt() in SQL, jwt-decode client-side | Built-in Supabase functions handle claims |
| Audit logging | Custom INSERT after each operation | Trigger function with TG_OP + to_jsonb | Automatic, cannot be bypassed, captures OLD/NEW |
| Updated timestamps | Application-level timestamps | moddatetime extension trigger | Database-level, cannot be forgotten |
| Type generation | Manual type definitions | `supabase gen types typescript` | Auto-generates from schema, always in sync |
| Component library | Custom design system | shadcn/ui with Ephraim Care theme | Accessible, tested, monorepo-ready |
| Form validation | Manual validation logic | React Hook Form + Zod schemas | Type-safe, composable, shared between apps |
| Animation | Custom CSS animations | tw-animate-css | shadcn/ui default, works with Tailwind v4 |
| Date timezone handling | Manual UTC offset math | @date-fns/tz TZDate | DST-aware, IANA timezone support |

**Key insight:** Supabase provides database-level security (RLS) and automation (triggers) that should be the source of truth. Application code should be a consumer of these guarantees, not a reimplementation.

## Common Pitfalls

### Pitfall 1: Expo + pnpm Symlink Resolution
**What goes wrong:** Metro bundler cannot resolve packages through pnpm's symlinked node_modules
**Why it happens:** pnpm uses a content-addressable store with symlinks by default, which Metro does not follow
**How to avoid:** Use `node-linker=hoisted` in root `.npmrc` AND `shamefully-hoist=true` for full compatibility
**Warning signs:** "Unable to resolve module" errors when importing workspace packages in Expo

### Pitfall 2: Duplicate React/React Native Versions
**What goes wrong:** Runtime errors ("Invalid hook call" or "Cannot read properties of null")
**Why it happens:** Multiple React instances in the dependency tree
**How to avoid:** Pin React versions in root package.json using pnpm `overrides`; verify with `pnpm why react`
**Warning signs:** Hook-related errors, "rendered more hooks than during the previous render"

### Pitfall 3: getSession() vs getUser() in Server Code
**What goes wrong:** Auth bypass; spoofed cookies pass validation
**Why it happens:** getSession() reads cookies without revalidating the JWT with Supabase servers
**How to avoid:** ALWAYS use getUser() or getClaims() on the server; getClaims() validates JWT signature
**Warning signs:** Users accessing pages they should not be able to

### Pitfall 4: RLS Policies Blocking Seed Data
**What goes wrong:** Seed script fails with "new row violates row-level security policy"
**Why it happens:** RLS enforces policies on all operations, including seed inserts
**How to avoid:** Use a dedicated admin client with `SUPABASE_SERVICE_ROLE_KEY` for seeding (bypasses RLS); never use @supabase/ssr's createServerClient for admin operations
**Warning signs:** Empty tables after running seed script with no errors

### Pitfall 5: Custom Claims Not Appearing in JWT
**What goes wrong:** Auth hook function exists but roles are not in the JWT claims
**Why it happens:** Missing grants to `supabase_auth_admin` role, or hook not enabled in dashboard
**How to avoid:** Grant EXECUTE on function AND SELECT on user_roles table to supabase_auth_admin; enable hook in Authentication > Hooks (Beta) in dashboard
**Warning signs:** `auth.jwt() ->> 'user_role'` returns NULL in RLS policies

### Pitfall 6: Tailwind CSS 4 @source Directive Missing
**What goes wrong:** Tailwind classes from workspace packages not being compiled
**Why it happens:** Tailwind v4 only scans files specified by @source directives in CSS
**How to avoid:** Add explicit @source paths for ALL directories containing Tailwind classes
**Warning signs:** Classes apply in development but components render unstyled

### Pitfall 7: Next.js 15 Middleware Cookie Write Timing
**What goes wrong:** Auth state becomes stale, user gets logged out
**Why it happens:** Server Components cannot write cookies; if middleware doesn't refresh tokens, they expire
**How to avoid:** Middleware MUST call getUser() which triggers token refresh and cookie update; do NOT put code between createServerClient and getUser()
**Warning signs:** Users randomly logged out, 401 errors after being idle

### Pitfall 8: Turborepo Task Missing in turbo.json
**What goes wrong:** Running `turbo run <task>` shows "ERROR: task not found"
**Why it happens:** Turborepo only orchestrates explicitly declared tasks
**How to avoid:** Declare ALL tasks (build, dev, lint, test, test:e2e, generate) in turbo.json
**Warning signs:** Tasks run individually via pnpm but not via turbo

### Pitfall 9: Supabase Type Generation Path Issues in Monorepo
**What goes wrong:** Types generated in wrong location or import paths break
**Why it happens:** `supabase gen types` runs relative to CWD, not monorepo root
**How to avoid:** Always cd to monorepo root before running type gen; output to packages/types/src/database.ts
**Warning signs:** TypeScript errors about missing Database type exports

### Pitfall 10: date-fns v4 Timezone Display (zzz token)
**What goes wrong:** Abbreviated timezone names (AEST/AEDT) display as GMT offsets
**Why it happens:** date-fns v4 format() does not fully support zzz token with @date-fns/tz
**How to avoid:** Use explicit timezone abbreviation mapping for display, or use formatInTimeZone from date-fns-tz as fallback for display-only needs. Store/compute dates using TZDate from @date-fns/tz.
**Warning signs:** "GMT+11" displayed instead of "AEDT"

## Code Examples

### Turborepo Root Configuration Files

**pnpm-workspace.yaml:**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'supabase'
```

**.npmrc:**
```
node-linker=hoisted
shamefully-hoist=true
```

**Root package.json scripts:**
```json
{
  "name": "ephraimcare-portal",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "test:e2e": "turbo run test:e2e",
    "db:generate-types": "cd supabase && supabase gen types typescript --local > ../packages/types/src/database.ts",
    "db:reset": "supabase db reset",
    "db:migrate": "supabase migration up",
    "db:seed": "supabase db reset --seed-only"
  }
}
```

### Next.js Config for Monorepo (apps/admin/next.config.ts)

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@ephraimcare/ui',
    '@ephraimcare/utils',
    '@ephraimcare/supabase',
    '@ephraimcare/types',
  ],
}

export default nextConfig
```

### PostCSS Config (apps/admin/postcss.config.js)

```javascript
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

### shadcn/ui Monorepo components.json (packages/ui)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@ephraimcare/ui/components",
    "utils": "@ephraimcare/ui/lib/utils",
    "hooks": "@ephraimcare/ui/hooks",
    "lib": "@ephraimcare/ui/lib",
    "ui": "@ephraimcare/ui/components"
  }
}
```

### shadcn/ui App-Level components.json (apps/admin)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "../../packages/ui/src/styles/globals.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "hooks": "@/hooks",
    "lib": "@/lib",
    "utils": "@ephraimcare/ui/lib/utils",
    "ui": "@ephraimcare/ui/components"
  }
}
```

### Browser Client (packages/supabase/src/client.ts)

```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@ephraimcare/types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Admin/Service Client (packages/supabase/src/admin.ts)

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@ephraimcare/types'

// ONLY for server-side admin operations (seeding, migrations, etc.)
// NEVER expose in browser code
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

### Updated_at Trigger (moddatetime)

```sql
-- Source: https://supabase.com/docs/guides/database/postgres/triggers
create extension if not exists moddatetime schema extensions;

-- Apply to each table:
create trigger handle_updated_at
  before update on public.profiles
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at
  before update on public.shifts
  for each row execute procedure moddatetime(updated_at);

-- Repeat for all tables with updated_at column
```

### Supabase Type Generation Script (supabase/package.json)

```json
{
  "name": "@ephraimcare/supabase-config",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "generate": "supabase gen types typescript --local > ../packages/types/src/database.ts"
  }
}
```

### Seed Data Pattern (supabase/seed.sql)

```sql
-- Seed data runs with service_role (bypasses RLS)
-- Must respect foreign key constraints order

-- 1. Create auth users first (via Supabase auth API, not direct insert)
-- 2. Create profiles linked to auth users
-- 3. Create participants
-- 4. Create workers
-- 5. Create shifts (references participants + workers)
-- 6. Create invoices (references participants + shifts)

-- Example: Insert test participants
insert into public.participants (id, first_name, last_name, ndis_number, date_of_birth, organization_id)
values
  (gen_random_uuid(), 'Alice', 'Johnson', '431234567', '1985-03-15', 'ORG_ID_HERE'),
  (gen_random_uuid(), 'Bob', 'Smith', '431234568', '1990-07-22', 'ORG_ID_HERE'),
  (gen_random_uuid(), 'Carol', 'Williams', '431234569', '1978-11-30', 'ORG_ID_HERE'),
  (gen_random_uuid(), 'David', 'Brown', '431234570', '1995-01-08', 'ORG_ID_HERE'),
  (gen_random_uuid(), 'Eve', 'Davis', '431234571', '1982-09-14', 'ORG_ID_HERE');
```

### Expo Metro Config (apps/worker-mobile/metro.config.js)

```javascript
// Source: https://docs.expo.dev/guides/monorepos/
// SDK 53 auto-configures monorepo support when using expo/metro-config
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
```

### Vitest Configuration (apps/admin/vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@ephraimcare/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@ephraimcare/utils': path.resolve(__dirname, '../../packages/utils/src'),
    },
  },
})
```

### Playwright Configuration (apps/admin/playwright.config.ts)

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Session Auto-Logout (8 hours inactivity - AUTH-03)

```typescript
// packages/supabase/src/session-monitor.ts
// Client-side inactivity tracker
const INACTIVITY_TIMEOUT = 8 * 60 * 60 * 1000 // 8 hours in ms

export function createInactivityMonitor(onTimeout: () => void) {
  let timeoutId: NodeJS.Timeout

  const resetTimer = () => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(onTimeout, INACTIVITY_TIMEOUT)
  }

  const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
  events.forEach(event => document.addEventListener(event, resetTimer))

  resetTimer() // Start initial timer

  return () => {
    clearTimeout(timeoutId)
    events.forEach(event => document.removeEventListener(event, resetTimer))
  }
}
```

### Timezone Utility (packages/utils/src/dates.ts)

```typescript
// Source: https://blog.date-fns.org/v40-with-time-zone-support/
import { TZDate } from '@date-fns/tz'
import { format, addHours } from 'date-fns'

const TIMEZONE = 'Australia/Sydney'

export function toSydneyTime(date: Date | string): TZDate {
  return new TZDate(date, TIMEZONE)
}

export function formatSydneyDate(date: Date | string, formatStr: string): string {
  const tzDate = toSydneyTime(date)
  return format(tzDate, formatStr)
}

export function getCurrentSydneyTime(): TZDate {
  return new TZDate(new Date(), TIMEZONE)
}

// For display purposes where AEST/AEDT abbreviation needed
export function getTimezoneAbbreviation(date: Date): string {
  const offset = new TZDate(date, TIMEZONE).getTimezoneOffset()
  return offset === -660 ? 'AEDT' : 'AEST' // -660 = UTC+11, -600 = UTC+10
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @supabase/auth-helpers-nextjs | @supabase/ssr | 2024 | Must use getAll/setAll cookie pattern |
| tailwindcss-animate | tw-animate-css | Tailwind v4 | Different import, CSS-based |
| tailwind.config.js | @theme inline in CSS | Tailwind v4 | No JavaScript config file |
| HSL color values | OKLCH color values | shadcn/ui + Tailwind v4 | Better perceptual uniformity |
| forwardRef components | Function components + data-slot | React 19 + shadcn/ui | Simpler component patterns |
| Turborepo "pipeline" | Turborepo "tasks" | Turborepo 2.x | Config key renamed |
| date-fns-tz (separate pkg) | @date-fns/tz (built-in) | date-fns v4 | First-class TZ, TZDate class |
| Zustand create with shallow | createWithEqualityFn or useShallow | Zustand 5.x | Selector stability required |
| Expo manual Metro config | Auto monorepo detection | Expo SDK 52+ | Less configuration needed |
| getSession() for auth | getUser() or getClaims() | @supabase/ssr security update | JWT signature validation required |
| node-linker=hoisted only | hoisted + shamefully-hoist | pnpm + Expo best practice | Full compatibility with Metro |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Replaced by @supabase/ssr. Never import from it.
- `tailwindcss-animate`: Replaced by tw-animate-css for Tailwind v4 projects.
- `next-transpile-modules`: Built into Next.js as `transpilePackages` config option.
- `expo-av` Audio: Replaced by `expo-audio` in SDK 53.
- `expo-background-fetch`: Replaced by `expo-background-task` in SDK 53.
- Turborepo `pipeline` key: Renamed to `tasks` in Turborepo 2.x.

## Open Questions

1. **getClaims() vs getUser() availability**
   - What we know: Supabase docs now recommend getClaims() for JWT validation. getUser() makes a network request to Supabase Auth server.
   - What's unclear: getClaims() may be a very recent addition (possibly post-2025). Some docs still only reference getUser(). Need to verify which method is available in the current @supabase/ssr version.
   - Recommendation: Use getUser() as the safe default (always works). If getClaims() is available, prefer it in middleware for performance (local JWT validation without network call). Test during implementation.

2. **Supabase Auth Hook enablement method**
   - What we know: The custom_access_token_hook function must be enabled in the Supabase Dashboard under Authentication > Hooks (Beta).
   - What's unclear: Whether this can be configured via config.toml for local development, or requires manual dashboard setup per environment.
   - Recommendation: Document manual dashboard step for both dev and prod environments. Check if `supabase/config.toml` supports hook configuration.

3. **Expo SDK 53 auto Metro config with pnpm hoisted**
   - What we know: SDK 52+ auto-detects monorepo structure. Previous manual Metro configs should be removed.
   - What's unclear: With `node-linker=hoisted`, whether the auto-detection still works correctly or if minimal config is needed.
   - Recommendation: Start with the minimal `expo/metro-config` default. Only add manual config if resolution errors occur.

4. **EAS Build with pnpm frozen lockfile**
   - What we know: SDK 53 uses `--frozen-lockfile` by default for EAS builds.
   - What's unclear: Whether workspace packages resolve correctly in EAS with hoisted node_modules.
   - Recommendation: This is a production concern (Phase 1 is dev focus). Address EAS build config in a later phase when mobile deployment is needed.

5. **OKLCH color conversion for Ephraim Care brand colors**
   - What we know: shadcn/ui + Tailwind v4 uses OKLCH. Brand colors are specified as hex (#66BB6A, #00BFA5).
   - What's unclear: Exact OKLCH equivalents for the brand colors.
   - Recommendation: Use an OKLCH converter tool during implementation. The values in the CSS example above are approximations that need fine-tuning.

## Sources

### Primary (HIGH confidence)
- [Supabase SSR Client Setup](https://supabase.com/docs/guides/auth/server-side/creating-a-client) - Complete cookie pattern
- [Supabase Next.js Server-Side Auth](https://supabase.com/docs/guides/auth/server-side/nextjs) - Middleware, server client
- [Supabase Custom Claims & RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac) - Auth hook, authorize function
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) - Policy patterns
- [Supabase Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations) - Migration workflow
- [Supabase Postgres Audit Blog](https://supabase.com/blog/postgres-audit) - Audit trigger implementation
- [Supabase Triggers Docs](https://supabase.com/docs/guides/database/postgres/triggers) - moddatetime, trigger patterns
- [shadcn/ui Monorepo Guide](https://ui.shadcn.com/docs/monorepo) - Component sharing pattern
- [shadcn/ui Tailwind v4 Guide](https://ui.shadcn.com/docs/tailwind-v4) - CSS config, tw-animate-css
- [Expo Monorepo Guide](https://docs.expo.dev/guides/monorepos/) - pnpm, Metro, workspace setup
- [Expo SDK 53 Changelog](https://expo.dev/changelog/sdk-53) - Breaking changes, React Native 0.79
- [Turborepo Next.js Guide](https://turborepo.dev/docs/guides/frameworks/nextjs) - Framework integration
- [Turborepo Vitest Guide](https://turborepo.dev/docs/guides/tools/vitest) - Test configuration
- [Turborepo Playwright Guide](https://turborepo.com/docs/guides/tools/playwright) - E2E test setup
- [Turborepo Configuration Reference](https://turborepo.dev/docs/reference/configuration) - turbo.json schema
- [date-fns v4 Time Zone Blog](https://blog.date-fns.org/v40-with-time-zone-support/) - TZDate, @date-fns/tz
- [Zustand v5 Migration Guide](https://zustand.docs.pmnd.rs/migrations/migrating-to-v5) - Breaking changes
- [Next.js transpilePackages](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages) - Monorepo package config

### Secondary (MEDIUM confidence)
- [Supabase Monorepo with Turborepo blog](https://philipp.steinroetter.com/posts/supabase-turborepo) - Type gen in monorepo
- [Turborepo Environment Variables](https://turborepo.dev/docs/crafting-your-repository/using-environment-variables) - env, passthrough
- [byCedric/expo-monorepo-example](https://github.com/byCedric/expo-monorepo-example) - Reference implementation
- [Supabase Service Role Key](https://supabase.com/docs/guides/api/api-keys) - Bypassing RLS for seeding

### Tertiary (LOW confidence)
- [Medium: React Native Monorepo with Turbo, pnpm, Expo (Dec 2025)](https://medium.com/code-sense/how-i-finally-got-a-react-native-monorepo-working-with-turbo-pnpm-and-an-expo-shell-after-c8afd85522ea) - EAS Build workarounds
- [date-fns GitHub Issue #3943](https://github.com/date-fns/date-fns/issues/3943) - zzz token limitation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via official docs; versions confirmed from changelogs
- Architecture: HIGH - Patterns sourced from official Supabase, shadcn/ui, Turborepo documentation
- Auth/RLS: HIGH - Official Supabase RBAC guide with complete code examples
- Pitfalls: HIGH - Verified through official docs, GitHub issues, and known community challenges
- Timezone handling: MEDIUM - date-fns v4 TZ support confirmed but zzz token limitation is a known gap
- EAS Build in monorepo: LOW - Limited to community sources; not critical for Phase 1

**Research date:** 2026-01-24
**Valid until:** 2026-02-23 (30 days - stable ecosystem, locked versions)
