# Architecture Research: NDIS Management Platform

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         VERCEL (Hosting)                            │
│  ┌──────────────────────┐    ┌──────────────────────┐              │
│  │   Admin Portal        │    │  Participant Portal   │              │
│  │   (Next.js 14+)       │    │  (Next.js 14+)        │              │
│  │   apps/admin           │    │  apps/participant      │              │
│  └──────────┬─────────────┘    └──────────┬─────────────┘              │
│             │                              │                           │
└─────────────┼──────────────────────────────┼───────────────────────────┘
              │                              │
              ▼                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SUPABASE (Backend)                             │
│  ┌────────────┐  ┌─────────┐  ┌──────────┐  ┌─────────────────┐   │
│  │ PostgreSQL  │  │  Auth   │  │ Realtime │  │ Edge Functions  │   │
│  │ + RLS       │  │ + JWT   │  │ + Push   │  │ + Triggers      │   │
│  └────────────┘  └─────────┘  └──────────┘  └─────────────────┘   │
│  ┌────────────┐                                                     │
│  │  Storage   │                                                     │
│  │ (files)    │                                                     │
│  └────────────┘                                                     │
└─────────────────────────────────────────────────────────────────────┘
              ▲
              │
┌─────────────┼───────────────────┐
│  Worker Mobile App               │
│  (React Native / Expo)           │
│  apps/worker-mobile              │
│  ┌──────────────────────────┐   │
│  │ Offline Layer (SQLite)    │   │
│  │ Sync Queue                │   │
│  └──────────────────────────┘   │
└──────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Talks To |
|-----------|---------------|----------|
| Admin Portal | Manage workers, participants, shifts, invoices, reports | Supabase (direct + server actions) |
| Participant Portal | View shifts, case notes, invoices, progress | Supabase (direct client, read-heavy) |
| Worker Mobile App | View shifts, check-in/out, write case notes, GPS | Supabase (via sync layer) + Local SQLite |
| Supabase Auth | Authentication, JWT tokens, session management | All apps |
| Supabase PostgreSQL | Data persistence, RLS enforcement, triggers | All apps (via PostgREST) |
| Supabase Realtime | Live updates (shift changes, notifications) | Admin + Worker apps |
| Supabase Edge Functions | Business logic (invoicing, notifications, NDIS calculations) | PostgreSQL, External APIs |
| Supabase Storage | Case note attachments, documents, profile photos | All apps (via signed URLs) |

---

## Monorepo Structure

### Tooling Decision: Turborepo + pnpm Workspaces

**Why Turborepo:**
- Native Vercel integration (remote caching on deploy)
- Simple `turbo.json` pipeline configuration
- Handles build ordering automatically via dependency graph
- Incremental builds - only rebuilds what changed
- Less configuration overhead than Nx for this project size

**Why pnpm:**
- Strict dependency isolation (no phantom dependencies)
- Efficient disk usage with content-addressable storage
- Workspace protocol for internal packages
- Fast install times

### Folder Layout

```
ephraimcare-portal-2026/
├── .planning/                        # Architecture docs, roadmap
│   ├── research/
│   │   └── ARCHITECTURE.md
│   └── ROADMAP.md
├── apps/
│   ├── admin/                        # Next.js 14+ Admin Portal
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx        # Sidebar + role guard
│   │   │   │   ├── page.tsx          # Dashboard home
│   │   │   │   ├── participants/
│   │   │   │   │   ├── page.tsx      # List
│   │   │   │   │   ├── [id]/page.tsx # Detail
│   │   │   │   │   └── new/page.tsx  # Create
│   │   │   │   ├── workers/
│   │   │   │   ├── shifts/
│   │   │   │   ├── invoices/
│   │   │   │   ├── case-notes/
│   │   │   │   ├── service-agreements/
│   │   │   │   └── settings/
│   │   │   ├── api/
│   │   │   │   └── webhooks/
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── shifts/
│   │   │   ├── participants/
│   │   │   └── invoices/
│   │   ├── lib/
│   │   │   ├── actions/              # Server actions
│   │   │   ├── queries/              # Data fetching
│   │   │   └── utils.ts
│   │   ├── middleware.ts             # Auth + role checking
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── participant/                  # Next.js 14+ Participant Portal
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── shifts/           # Upcoming/past shifts
│   │   │   │   ├── notes/            # Case notes (read-only)
│   │   │   │   ├── invoices/         # View/download invoices
│   │   │   │   ├── plan/             # NDIS plan budget tracking
│   │   │   │   └── profile/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   ├── lib/
│   │   ├── middleware.ts
│   │   └── package.json
│   │
│   └── worker-mobile/                # React Native / Expo
│       ├── app/                      # Expo Router (file-based)
│       │   ├── (tabs)/
│       │   │   ├── _layout.tsx
│       │   │   ├── shifts.tsx        # Today's shifts list
│       │   │   ├── notes.tsx         # Case notes list
│       │   │   └── profile.tsx       # Worker profile
│       │   ├── shift/
│       │   │   └── [id].tsx          # Shift detail + check-in/out
│       │   ├── note/
│       │   │   ├── new.tsx           # Create case note
│       │   │   └── [id].tsx          # View case note
│       │   ├── _layout.tsx
│       │   └── login.tsx
│       ├── components/
│       │   ├── ShiftCard.tsx
│       │   ├── CheckInButton.tsx
│       │   ├── CaseNoteForm.tsx
│       │   └── OfflineIndicator.tsx
│       ├── hooks/
│       │   ├── useShifts.ts
│       │   ├── useOfflineSync.ts
│       │   └── useLocation.ts
│       ├── services/
│       │   ├── supabase.ts           # Client configuration
│       │   ├── sync.ts               # Sync engine
│       │   ├── offline-queue.ts      # Queue management
│       │   └── notifications.ts     # Expo push
│       ├── stores/
│       │   ├── auth.ts              # Zustand auth store
│       │   └── shifts.ts            # Zustand shifts store
│       ├── db/
│       │   ├── schema.ts            # Local SQLite schema
│       │   └── migrations.ts
│       ├── utils/
│       ├── app.json
│       ├── eas.json
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── types/                        # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── database.ts          # Generated from Supabase
│   │   │   ├── shifts.ts            # Domain types
│   │   │   ├── participants.ts
│   │   │   ├── invoices.ts
│   │   │   ├── case-notes.ts
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── supabase/                     # Shared Supabase configuration
│   │   ├── src/
│   │   │   ├── client.ts            # Browser client factory
│   │   │   ├── server.ts            # Server client factory (Next.js)
│   │   │   ├── middleware.ts         # Auth middleware helper
│   │   │   ├── admin.ts             # Service role client
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── utils/                        # Shared utilities
│   │   ├── src/
│   │   │   ├── ndis/
│   │   │   │   ├── price-guide.ts   # NDIS price calculations
│   │   │   │   ├── budget.ts        # Budget tracking helpers
│   │   │   │   └── item-numbers.ts  # NDIS item number lookups
│   │   │   ├── dates.ts             # Date formatting (AU timezone)
│   │   │   ├── currency.ts          # AUD formatting
│   │   │   ├── validators.ts        # Zod schemas
│   │   │   ├── constants.ts         # Shift statuses, roles, etc.
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── ui/                           # Shared UI components (web only)
│       ├── src/
│       │   ├── components/
│       │   │   ├── Button.tsx
│       │   │   ├── Card.tsx
│       │   │   ├── DataTable.tsx
│       │   │   ├── StatusBadge.tsx
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── supabase/                         # Supabase project configuration
│   ├── migrations/                   # SQL migrations (Git-tracked)
│   │   ├── 001_create_profiles.sql
│   │   ├── 002_create_participants.sql
│   │   ├── 003_create_workers.sql
│   │   ├── 004_create_shifts.sql
│   │   ├── 005_create_case_notes.sql
│   │   ├── 006_create_invoices.sql
│   │   ├── 007_create_service_agreements.sql
│   │   ├── 008_create_ndis_plans.sql
│   │   ├── 009_rls_policies.sql
│   │   ├── 010_functions_triggers.sql
│   │   └── 011_seed_ndis_price_guide.sql
│   ├── functions/                    # Edge Functions
│   │   ├── generate-invoice/
│   │   ├── send-notification/
│   │   ├── auto-checkout/
│   │   └── sync-ndis-rates/
│   ├── seed.sql                      # Dev seed data
│   └── config.toml                   # Supabase local config
│
├── turbo.json                        # Turborepo pipeline config
├── pnpm-workspace.yaml               # Workspace definition
├── package.json                      # Root package.json
├── .env.local                        # Local env vars (git-ignored)
├── .env.example                      # Template for env vars
├── .gitignore
└── tsconfig.base.json                # Shared TS config
```

### Turborepo Configuration

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env.local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "db:generate": {
      "cache": false
    }
  }
}
```

### pnpm Workspace

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Package Dependencies (internal)

```
apps/admin          → packages/types, packages/supabase, packages/utils, packages/ui
apps/participant    → packages/types, packages/supabase, packages/utils, packages/ui
apps/worker-mobile  → packages/types, packages/utils (NOT packages/supabase server, NOT packages/ui)
```

Note: Worker mobile app uses its own Supabase client configuration (React Native specific) and its own UI components (React Native, not React DOM).

---

## Data Architecture

### Core Database Schema

```sql
-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'coordinator', 'worker', 'participant')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PARTICIPANTS
-- ============================================
CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),  -- NULL if no portal access
  ndis_number TEXT UNIQUE NOT NULL,          -- NDIS participant number
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  phone TEXT,
  email TEXT,
  address_line_1 TEXT,
  address_line_2 TEXT,
  suburb TEXT,
  state TEXT DEFAULT 'NSW',
  postcode TEXT,
  latitude DOUBLE PRECISION,                -- For GPS check-in radius
  longitude DOUBLE PRECISION,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKERS
-- ============================================
CREATE TABLE public.workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  employee_id TEXT UNIQUE,
  qualification TEXT[],                      -- Array of qualifications
  services_provided TEXT[],                  -- NDIS service types
  hourly_rate DECIMAL(10,2),
  max_hours_per_week INTEGER DEFAULT 38,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NDIS PLANS
-- ============================================
CREATE TABLE public.ndis_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id),
  plan_number TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_budget DECIMAL(12,2) NOT NULL,
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PLAN BUDGETS (per support category)
-- ============================================
CREATE TABLE public.plan_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES ndis_plans(id) ON DELETE CASCADE,
  category TEXT NOT NULL,                    -- e.g., 'Core', 'Capacity Building', 'Capital'
  subcategory TEXT,                          -- e.g., 'Assistance with Daily Life'
  allocated_amount DECIMAL(12,2) NOT NULL,
  used_amount DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SERVICE AGREEMENTS
-- ============================================
CREATE TABLE public.service_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id),
  plan_id UUID NOT NULL REFERENCES ndis_plans(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'expired', 'cancelled')),
  document_url TEXT,                         -- Signed agreement PDF
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SERVICE AGREEMENT ITEMS
-- ============================================
CREATE TABLE public.service_agreement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES service_agreements(id) ON DELETE CASCADE,
  ndis_item_number TEXT NOT NULL,            -- e.g., '01_011_0107_1_1'
  description TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity_allocated DECIMAL(10,2),          -- Hours or units allocated
  budget_category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SHIFTS
-- ============================================
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id),
  worker_id UUID NOT NULL REFERENCES workers(id),
  service_agreement_item_id UUID REFERENCES service_agreement_items(id),
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,                  -- Check-in time
  actual_end TIMESTAMPTZ,                    -- Check-out time
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
  )),
  check_in_latitude DOUBLE PRECISION,
  check_in_longitude DOUBLE PRECISION,
  check_out_latitude DOUBLE PRECISION,
  check_out_longitude DOUBLE PRECISION,
  cancellation_reason TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CASE NOTES
-- ============================================
CREATE TABLE public.case_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES shifts(id),
  participant_id UUID NOT NULL REFERENCES participants(id),
  worker_id UUID NOT NULL REFERENCES workers(id),
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  content TEXT NOT NULL,
  goals_addressed TEXT[],                    -- NDIS goals worked on
  participant_response TEXT,                 -- How participant responded
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_notes TEXT,
  is_draft BOOLEAN DEFAULT false,            -- For offline drafts
  attachments TEXT[],                        -- Storage bucket paths
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVOICES
-- ============================================
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,       -- Auto-generated: INV-202601-0001
  participant_id UUID NOT NULL REFERENCES participants(id),
  plan_id UUID REFERENCES ndis_plans(id),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  gst DECIMAL(12,2) NOT NULL DEFAULT 0,     -- NDIS services are GST-free
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending', 'submitted', 'paid', 'overdue', 'cancelled'
  )),
  payment_reference TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVOICE LINE ITEMS
-- ============================================
CREATE TABLE public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shifts(id),
  ndis_item_number TEXT NOT NULL,
  description TEXT NOT NULL,
  service_date DATE NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,           -- Hours
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NDIS PRICE GUIDE (Reference table)
-- ============================================
CREATE TABLE public.ndis_price_guide (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_number TEXT NOT NULL,
  item_name TEXT NOT NULL,
  registration_group TEXT,
  support_category TEXT,
  unit TEXT,                                 -- 'Hour', 'Each', 'Day'
  price_national DECIMAL(10,2),
  price_remote DECIMAL(10,2),
  price_very_remote DECIMAL(10,2),
  effective_from DATE NOT NULL,
  effective_to DATE,
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN (
    'shift_assigned', 'shift_cancelled', 'shift_reminder',
    'invoice_finalised', 'case_note_added', 'plan_expiring'
  )),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,                                -- Metadata (shift_id, invoice_id, etc.)
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- ============================================
-- AUDIT LOG
-- ============================================
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,                      -- 'INSERT', 'UPDATE', 'DELETE'
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_shifts_worker ON shifts(worker_id);
CREATE INDEX idx_shifts_participant ON shifts(participant_id);
CREATE INDEX idx_shifts_scheduled_start ON shifts(scheduled_start);
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_case_notes_participant ON case_notes(participant_id);
CREATE INDEX idx_case_notes_shift ON case_notes(shift_id);
CREATE INDEX idx_invoices_participant ON invoices(participant_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX idx_plan_budgets_plan ON plan_budgets(plan_id);
CREATE INDEX idx_ndis_price_guide_item ON ndis_price_guide(item_number, is_current);
```

### RLS (Row Level Security) Strategy

**Architecture Pattern:** Role-based access using `profiles.role` checked against `auth.uid()`.

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ndis_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: Get current user's role
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- HELPER FUNCTION: Check if user is admin/coordinator
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin_or_coordinator()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'coordinator')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- PROFILES POLICIES
-- ============================================
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin_or_coordinator());

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (is_admin_or_coordinator());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));
  -- Prevents users from changing their own role

-- ============================================
-- SHIFTS POLICIES
-- ============================================
CREATE POLICY "Admins/coordinators can do everything with shifts"
  ON shifts FOR ALL
  USING (is_admin_or_coordinator());

CREATE POLICY "Workers can view their own shifts"
  ON shifts FOR SELECT
  USING (
    worker_id = (SELECT id FROM workers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Workers can update their own shifts (check-in/out)"
  ON shifts FOR UPDATE
  USING (
    worker_id = (SELECT id FROM workers WHERE profile_id = auth.uid())
  )
  WITH CHECK (
    worker_id = (SELECT id FROM workers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Participants can view their own shifts"
  ON shifts FOR SELECT
  USING (
    participant_id = (
      SELECT id FROM participants WHERE profile_id = auth.uid()
    )
  );

-- ============================================
-- CASE NOTES POLICIES
-- ============================================
CREATE POLICY "Admins/coordinators can do everything with case notes"
  ON case_notes FOR ALL
  USING (is_admin_or_coordinator());

CREATE POLICY "Workers can view and create their own case notes"
  ON case_notes FOR SELECT
  USING (
    worker_id = (SELECT id FROM workers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Workers can insert case notes"
  ON case_notes FOR INSERT
  WITH CHECK (
    worker_id = (SELECT id FROM workers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Workers can update their own draft case notes"
  ON case_notes FOR UPDATE
  USING (
    worker_id = (SELECT id FROM workers WHERE profile_id = auth.uid())
    AND is_draft = true
  );

CREATE POLICY "Participants can view their own case notes"
  ON case_notes FOR SELECT
  USING (
    participant_id = (
      SELECT id FROM participants WHERE profile_id = auth.uid()
    )
    AND is_draft = false  -- Participants cannot see drafts
  );

-- ============================================
-- INVOICES POLICIES
-- ============================================
CREATE POLICY "Admins/coordinators manage all invoices"
  ON invoices FOR ALL
  USING (is_admin_or_coordinator());

CREATE POLICY "Participants can view their own invoices"
  ON invoices FOR SELECT
  USING (
    participant_id = (
      SELECT id FROM participants WHERE profile_id = auth.uid()
    )
    AND status != 'draft'  -- Participants cannot see drafts
  );

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "Users can mark their own notifications as read"
  ON notifications FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());
```

### Database Functions and Triggers

```sql
-- ============================================
-- AUTO-GENERATE INVOICE NUMBER
-- ============================================
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  year_month TEXT;
  sequence_num INTEGER;
BEGIN
  year_month := TO_CHAR(NEW.invoice_date, 'YYYYMM');

  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(invoice_number, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || year_month || '-%';

  NEW.invoice_number := 'INV-' || year_month || '-' || LPAD(sequence_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL)
  EXECUTE FUNCTION generate_invoice_number();

-- ============================================
-- AUTO-CHECKOUT (Edge Function triggered by pg_cron)
-- ============================================
CREATE OR REPLACE FUNCTION auto_checkout_overdue_shifts()
RETURNS void AS $$
BEGIN
  UPDATE shifts
  SET
    actual_end = scheduled_end,
    status = 'completed',
    notes = COALESCE(notes, '') || ' [Auto-checked out: exceeded scheduled duration]',
    updated_at = NOW()
  WHERE
    status = 'in_progress'
    AND actual_start IS NOT NULL
    AND actual_end IS NULL
    AND NOW() > scheduled_end + INTERVAL '2 hours';  -- 2 hour grace period
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE BUDGET ON INVOICE FINALISATION
-- ============================================
CREATE OR REPLACE FUNCTION update_budget_on_invoice()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'submitted' AND OLD.status = 'draft' THEN
    -- Update used_amount in plan_budgets
    UPDATE plan_budgets pb
    SET used_amount = used_amount + (
      SELECT COALESCE(SUM(line_total), 0)
      FROM invoice_line_items
      WHERE invoice_id = NEW.id
    )
    WHERE pb.plan_id = NEW.plan_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_budget
  AFTER UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_on_invoice();

-- ============================================
-- SHIFT STATUS CHANGE NOTIFICATION
-- ============================================
CREATE OR REPLACE FUNCTION notify_shift_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify worker when shift is assigned
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (recipient_id, type, title, body, data)
    SELECT
      w.profile_id,
      'shift_assigned',
      'New Shift Assigned',
      'You have a new shift on ' || TO_CHAR(NEW.scheduled_start, 'DD Mon YYYY at HH:MI AM'),
      jsonb_build_object('shift_id', NEW.id)
    FROM workers w WHERE w.id = NEW.worker_id;
  END IF;

  -- Notify worker when shift is cancelled
  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    INSERT INTO notifications (recipient_id, type, title, body, data)
    SELECT
      w.profile_id,
      'shift_cancelled',
      'Shift Cancelled',
      'Your shift on ' || TO_CHAR(NEW.scheduled_start, 'DD Mon YYYY') || ' has been cancelled.',
      jsonb_build_object('shift_id', NEW.id, 'reason', NEW.cancellation_reason)
    FROM workers w WHERE w.id = NEW.worker_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_shift_change
  AFTER INSERT OR UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION notify_shift_change();

-- ============================================
-- UPDATED_AT TRIGGER (reusable)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_participants_updated_at BEFORE UPDATE ON participants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_workers_updated_at BEFORE UPDATE ON workers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_shifts_updated_at BEFORE UPDATE ON shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_case_notes_updated_at BEFORE UPDATE ON case_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- AUDIT LOG TRIGGER (for sensitive tables)
-- ============================================
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_shifts AFTER INSERT OR UPDATE OR DELETE ON shifts FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();
CREATE TRIGGER trg_audit_invoices AFTER INSERT OR UPDATE OR DELETE ON invoices FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();
CREATE TRIGGER trg_audit_case_notes AFTER INSERT OR UPDATE OR DELETE ON case_notes FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();
```

### Storage Buckets

```
Buckets:
├── avatars/              # Profile photos
│   └── {user_id}/photo.jpg
├── case-note-attachments/  # Case note files
│   └── {note_id}/{filename}
├── documents/            # Service agreements, invoices PDFs
│   └── {participant_id}/{filename}
└── exports/              # Generated reports (temporary)
    └── {user_id}/{filename}
```

Storage RLS:
- Avatars: Users can upload/read their own; admins can read all
- Case note attachments: Workers can upload to their notes; admins/coordinators read all; participants read their own
- Documents: Admins upload; participants read their own

---

## Application Architecture

### Admin Portal (apps/admin)

**Role Access:** Admin, Coordinator

#### Route Structure (Next.js App Router)

```
app/
├── (auth)/
│   ├── login/page.tsx              # Email/password login
│   └── layout.tsx                  # Minimal auth layout
├── (dashboard)/
│   ├── layout.tsx                  # Main layout: sidebar + header + role guard
│   ├── page.tsx                    # Dashboard: today's shifts, pending actions, stats
│   ├── participants/
│   │   ├── page.tsx                # Searchable list with filters
│   │   ├── [id]/
│   │   │   ├── page.tsx            # Participant detail (tabs: info, shifts, notes, invoices, plan)
│   │   │   └── edit/page.tsx       # Edit participant
│   │   └── new/page.tsx            # Create participant
│   ├── workers/
│   │   ├── page.tsx                # Worker list with availability status
│   │   ├── [id]/page.tsx           # Worker detail (tabs: info, shifts, schedule)
│   │   └── new/page.tsx            # Create/invite worker
│   ├── shifts/
│   │   ├── page.tsx                # Calendar + list view toggle
│   │   ├── [id]/page.tsx           # Shift detail with timeline
│   │   └── new/page.tsx            # Create shift (participant + worker + time)
│   ├── case-notes/
│   │   ├── page.tsx                # All notes (filterable by participant, worker, date)
│   │   └── [id]/page.tsx           # Note detail
│   ├── invoices/
│   │   ├── page.tsx                # Invoice list (draft, pending, paid, overdue)
│   │   ├── [id]/page.tsx           # Invoice detail + PDF preview
│   │   ├── new/page.tsx            # Generate invoice from shifts
│   │   └── generate/page.tsx       # Batch invoice generation
│   ├── service-agreements/
│   │   ├── page.tsx                # Agreement list
│   │   ├── [id]/page.tsx           # Agreement detail
│   │   └── new/page.tsx            # Create agreement
│   ├── reports/
│   │   └── page.tsx                # NDIS reports, utilisation, financial
│   └── settings/
│       ├── page.tsx                # Org settings
│       ├── team/page.tsx           # Manage admin/coordinator users
│       └── ndis-rates/page.tsx     # Price guide management
└── api/
    └── webhooks/
        └── route.ts                # External webhook handlers
```

#### Data Access Patterns

```typescript
// Server Component pattern (recommended for reads)
// app/(dashboard)/shifts/page.tsx
import { createServerClient } from '@ephraimcare/supabase/server';

export default async function ShiftsPage() {
  const supabase = createServerClient();

  const { data: shifts } = await supabase
    .from('shifts')
    .select(`
      *,
      participant:participants(first_name, last_name),
      worker:workers(profile:profiles(first_name, last_name))
    `)
    .gte('scheduled_start', new Date().toISOString())
    .order('scheduled_start', { ascending: true });

  return <ShiftsList shifts={shifts} />;
}

// Server Action pattern (for mutations)
// lib/actions/shifts.ts
'use server';

import { createServerClient } from '@ephraimcare/supabase/server';
import { revalidatePath } from 'next/cache';
import { shiftSchema } from '@ephraimcare/utils/validators';

export async function createShift(formData: FormData) {
  const supabase = createServerClient();
  const validated = shiftSchema.parse(Object.fromEntries(formData));

  const { data, error } = await supabase
    .from('shifts')
    .insert(validated)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/shifts');
  return data;
}
```

#### Middleware (Auth Guard)

```typescript
// middleware.ts
import { createMiddlewareClient } from '@ephraimcare/supabase/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);

  const { data: { session } } = await supabase.auth.getSession();

  // Redirect to login if not authenticated
  if (!session && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check role for admin portal
  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile && !['admin', 'coordinator'].includes(profile.role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login).*)'],
};
```

#### Key Components

| Component | Purpose |
|-----------|---------|
| `ShiftCalendar` | Week/month view of shifts with drag-to-create |
| `ParticipantProfile` | Tabbed view: info, shifts, notes, invoices, plan |
| `InvoiceGenerator` | Select date range + participant, auto-populate from shifts |
| `BudgetTracker` | Visual budget remaining per NDIS category |
| `WorkerSchedule` | Week view of worker availability + assigned shifts |
| `DataTable` | Reusable table with sort, filter, pagination, export |

---

### Participant Portal (apps/participant)

**Role Access:** Participant (linked via `participants.profile_id`)

#### Route Structure

```
app/
├── (auth)/
│   ├── login/page.tsx              # Magic link login (simpler for participants)
│   └── layout.tsx
├── (dashboard)/
│   ├── layout.tsx                  # Simple layout: nav + content
│   ├── page.tsx                    # Home: upcoming shifts, recent notes
│   ├── shifts/
│   │   └── page.tsx                # Upcoming + past shifts (read-only)
│   ├── notes/
│   │   └── page.tsx                # Case notes from workers (read-only)
│   ├── invoices/
│   │   ├── page.tsx                # Invoice list
│   │   └── [id]/page.tsx           # Invoice detail + download PDF
│   ├── plan/
│   │   └── page.tsx                # NDIS plan overview + budget remaining
│   └── profile/
│       └── page.tsx                # Update contact details
```

#### Design Considerations

- **Accessibility-first:** WCAG 2.1 AA minimum (many NDIS participants have disabilities)
- **Simplified UI:** Larger text, clear CTAs, minimal navigation depth
- **Magic link auth:** No password to remember
- **Read-heavy:** Most interactions are viewing, not creating
- **Mobile-responsive:** Many participants access via phone/tablet

---

### Worker Mobile App (apps/worker-mobile)

**Role Access:** Worker

#### Navigation (Expo Router)

```
app/
├── (tabs)/
│   ├── _layout.tsx                 # Bottom tab navigator
│   ├── shifts.tsx                  # Today's shifts + upcoming
│   ├── notes.tsx                   # Recent case notes
│   └── profile.tsx                 # Worker profile + settings
├── shift/
│   └── [id].tsx                    # Shift detail: check-in/out + participant info
├── note/
│   ├── new.tsx                     # Create case note (rich form)
│   └── [id].tsx                    # View case note
├── notifications.tsx               # Notification centre
├── _layout.tsx                     # Root layout (auth check)
└── login.tsx                       # Email/password login
```

#### Offline-First Architecture

```
┌─────────────────────────────────────────────────┐
│              Worker Mobile App                   │
│                                                  │
│  ┌──────────────┐    ┌────────────────────────┐ │
│  │  UI Layer     │    │    State (Zustand)      │ │
│  │  (React       │◄──│    - shifts[]           │ │
│  │   Native)     │    │    - caseNotes[]        │ │
│  └──────┬────────┘    │    - syncStatus         │ │
│         │              └────────┬───────────────┘ │
│         ▼                       │                 │
│  ┌──────────────────────────────▼──────────────┐ │
│  │           Sync Engine                        │ │
│  │  ┌─────────────────┐  ┌──────────────────┐ │ │
│  │  │  Offline Queue   │  │  Conflict        │ │ │
│  │  │  (pending ops)   │  │  Resolver        │ │ │
│  │  └────────┬─────────┘  └──────────────────┘ │ │
│  └───────────┼──────────────────────────────────┘ │
│              │                                     │
│  ┌───────────▼──────────────────────────────────┐ │
│  │     Local Database (expo-sqlite)              │ │
│  │     - cached_shifts                           │ │
│  │     - draft_case_notes                        │ │
│  │     - pending_checkins                        │ │
│  │     - sync_queue                              │ │
│  └───────────┬──────────────────────────────────┘ │
│              │                                     │
└──────────────┼─────────────────────────────────────┘
               │ (when online)
               ▼
┌──────────────────────────┐
│    Supabase Backend       │
│    (PostgreSQL + RLS)     │
└──────────────────────────┘
```

#### Offline Strategy Details

| Operation | Offline Behaviour | Sync Strategy |
|-----------|------------------|---------------|
| View shifts | Read from local SQLite cache | Pull on app open + every 15 min background |
| Check-in | Write to local + queue for sync | Push immediately when online, retry with backoff |
| Check-out | Write to local + queue for sync | Push immediately when online |
| Create case note | Save as draft in local DB | Push when online, mark as synced |
| View case notes | Read from local cache | Pull on app open |
| Notifications | Missed while offline | Fetch unread on reconnect |

#### Sync Queue Implementation

```typescript
// services/offline-queue.ts
interface QueueItem {
  id: string;
  operation: 'INSERT' | 'UPDATE';
  table: string;
  data: Record<string, unknown>;
  created_at: string;
  retry_count: number;
  status: 'pending' | 'syncing' | 'failed';
}

// On action (e.g., check-in):
// 1. Write to local SQLite immediately
// 2. Add to sync queue
// 3. Attempt sync if online
// 4. If offline, queue persists until next connectivity

// Conflict resolution:
// - Shifts: server wins (admin may have changed schedule)
// - Case notes: client wins (worker's content is authoritative)
// - Check-in/out: merge (keep earliest check-in, latest check-out)
```

#### GPS Check-in Verification

```typescript
// hooks/useLocation.ts
import * as Location from 'expo-location';

const CHECK_IN_RADIUS_METERS = 200; // Must be within 200m of participant address

export function useCheckInVerification(participantLocation: { lat: number; lng: number }) {
  const verifyLocation = async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return false;

    const location = await Location.getCurrentPositionAsync({});
    const distance = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      participantLocation.lat,
      participantLocation.lng
    );

    return distance <= CHECK_IN_RADIUS_METERS;
  };

  return { verifyLocation };
}
```

---

## Data Flow

### 1. Shift Lifecycle Flow

```
Admin/Coordinator                  Supabase                    Worker App
      │                               │                            │
      │  1. Create shift              │                            │
      ├──────────────────────────────►│                            │
      │                               │  2. Trigger: notify        │
      │                               ├───────────────────────────►│
      │                               │     (push notification)    │
      │                               │                            │
      │                               │  3. Worker confirms        │
      │                               │◄───────────────────────────┤
      │                               │                            │
      │                               │  4. Day-of: Check-in       │
      │                               │◄───────────────────────────┤
      │                               │     (GPS + timestamp)      │
      │                               │                            │
      │                               │  5. Shift complete:        │
      │                               │     Check-out              │
      │                               │◄───────────────────────────┤
      │                               │                            │
      │                               │  6. Case note submitted    │
      │                               │◄───────────────────────────┤
      │                               │                            │
      │  7. Generate invoice          │                            │
      ├──────────────────────────────►│                            │
      │     (from completed shifts)   │                            │
      │                               │                            │
      │  8. Finalise invoice          │                            │
      ├──────────────────────────────►│                            │
      │                               │  9. Trigger: notify        │
      │                               │     participant            │
      │                               │─────────►Participant Portal│
```

### 2. Authentication Flow

```
User (any role)              Next.js/Expo            Supabase Auth         PostgreSQL
      │                           │                       │                     │
      │  1. Login (email/pwd)     │                       │                     │
      ├──────────────────────────►│                       │                     │
      │                           │  2. signInWithPassword│                     │
      │                           ├──────────────────────►│                     │
      │                           │                       │  3. Verify creds    │
      │                           │                       ├────────────────────►│
      │                           │                       │◄────────────────────┤
      │                           │  4. JWT + session     │                     │
      │                           │◄──────────────────────┤                     │
      │                           │                       │                     │
      │                           │  5. Fetch profile     │                     │
      │                           │     (with JWT, RLS)   │                     │
      │                           ├──────────────────────────────────────────── ►│
      │                           │◄────────────────────────────────────────────┤
      │                           │                       │                     │
      │  6. Redirect to dashboard │                       │                     │
      │◄──────────────────────────┤                       │                     │
      │     (role-appropriate)    │                       │                     │
```

### 3. Offline Sync Flow (Worker App)

```
Worker App                    Local SQLite              Sync Engine             Supabase
     │                            │                        │                       │
     │  1. Check-in (offline)     │                        │                       │
     ├───────────────────────────►│                        │                       │
     │     Write immediately      │                        │                       │
     │                            │  2. Add to queue       │                       │
     │                            ├───────────────────────►│                       │
     │                            │                        │  3. Detect online     │
     │                            │                        ├──────────────────────►│
     │                            │                        │     Push pending ops  │
     │                            │                        │◄──────────────────────┤
     │                            │                        │     Confirm sync      │
     │                            │  4. Mark synced        │                       │
     │                            │◄───────────────────────┤                       │
     │                            │                        │                       │
     │                            │                        │  5. Pull updates      │
     │                            │                        │◄──────────────────────┤
     │                            │  6. Update cache       │     (new/changed      │
     │                            │◄───────────────────────┤      shifts)          │
     │  7. UI updates             │                        │                       │
     │◄──────────────────────────┤                        │                       │
```

### 4. Notification Flow

```
Database Trigger           Edge Function              External Service         Recipient
      │                         │                          │                       │
      │  1. Shift inserted/     │                          │                       │
      │     updated             │                          │                       │
      ├────────────────────────►│                          │                       │
      │                         │  2a. Push notification   │                       │
      │                         ├─────────────────────────►│                       │
      │                         │     (Expo Push API)      │  3a. Push to device   │
      │                         │                          ├──────────────────────►│
      │                         │                          │                       │
      │                         │  2b. Email (optional)    │                       │
      │                         ├─────────────────────────►│                       │
      │                         │     (Resend API)         │  3b. Email delivered  │
      │                         │                          ├──────────────────────►│
```

---

## Build Order

### Phase Dependencies Diagram

```
Phase 1: Foundation
    │
    ├── Phase 2: Core CRUD (Admin)
    │       │
    │       ├── Phase 3: Shift Scheduling
    │       │       │
    │       │       ├── Phase 4: Worker Mobile (View + Check-in)
    │       │       │       │
    │       │       │       ├── Phase 5: Case Notes
    │       │       │       │       │
    │       │       │       │       └── Phase 6: Invoicing
    │       │       │       │               │
    │       │       │       │               └── Phase 7: Participant Portal
    │       │       │       │
    │       │       │       └── Phase 8: Offline Support
    │       │       │
    │       │       └── Phase 9: Notifications + Realtime
    │       │
    │       └── Phase 10: Reporting
    │
    └── (Independent): CI/CD Pipeline, Testing Infrastructure
```

### Detailed Build Phases

#### Phase 1: Foundation (Week 1-2)
**Dependencies:** None (first)

| Task | Details |
|------|---------|
| Monorepo setup | Turborepo + pnpm + TypeScript configs |
| Supabase project | Create dev + prod projects |
| Database schema | All migrations (tables, indexes, RLS) |
| Auth configuration | Email/password + magic link providers |
| Shared packages | types, supabase client, utils scaffolding |
| Environment setup | .env files, Vercel project linking |
| Type generation | `supabase gen types` → packages/types |

**Outputs:** Working monorepo, database live, auth functional, types generated.

#### Phase 2: Admin Portal - Core CRUD (Week 3-4)
**Dependencies:** Phase 1

| Task | Details |
|------|---------|
| Admin app scaffold | Next.js 14 + Tailwind + shadcn/ui |
| Auth flow | Login page + middleware + session management |
| Dashboard layout | Sidebar navigation + header + role display |
| Participants CRUD | List, create, edit, detail views |
| Workers CRUD | List, create, edit, detail + invite flow |
| Service agreements | Create + link to NDIS plan |
| NDIS plan management | Create plan + budget categories |

**Outputs:** Admin can manage participants, workers, agreements.

#### Phase 3: Shift Scheduling (Week 5-6)
**Dependencies:** Phase 2 (participants + workers must exist)

| Task | Details |
|------|---------|
| Shift creation form | Select participant + worker + datetime |
| Calendar view | Week/month view with shift blocks |
| List view | Filterable shift list with status badges |
| Shift detail page | Timeline, status transitions |
| Bulk operations | Create recurring shifts |
| Validation | Worker availability, no overlaps |

**Outputs:** Admin can schedule shifts, view calendar.

#### Phase 4: Worker Mobile App - Core (Week 7-9)
**Dependencies:** Phase 3 (shifts must exist to view)

| Task | Details |
|------|---------|
| Expo project setup | Expo Router + Supabase client |
| Auth flow | Login screen + secure token storage |
| Shift list | Today's shifts + upcoming 7 days |
| Shift detail | Participant info + address + map |
| Check-in | GPS verification + timestamp capture |
| Check-out | Duration display + confirm |
| Pull-to-refresh | Refresh shift data from server |

**Outputs:** Worker can view shifts, check-in/out with GPS.

#### Phase 5: Case Notes (Week 10-11)
**Dependencies:** Phase 4 (check-in/out must work, notes attach to shifts)

| Task | Details |
|------|---------|
| Case note form (mobile) | Rich text + goals + participant response |
| File attachments | Photo capture + file picker + upload to Storage |
| Case note list (mobile) | Recent notes by worker |
| Case note list (admin) | All notes, filterable |
| Case note detail (admin) | View note + attachments |
| Draft support | Save locally, submit when ready |

**Outputs:** Workers write case notes on mobile, admins review.

#### Phase 6: Invoicing (Week 12-13)
**Dependencies:** Phase 5 (completed shifts + case notes needed for invoice generation)

| Task | Details |
|------|---------|
| Invoice generation | Select participant + date range → auto-populate from shifts |
| Line item management | NDIS item numbers + rates from price guide |
| Invoice preview | PDF-style preview before finalising |
| Invoice status flow | Draft → Pending → Submitted → Paid |
| Budget tracking | Update plan_budgets.used_amount on submit |
| PDF export | Generate downloadable invoice PDF |
| Batch generation | Generate invoices for multiple participants |

**Outputs:** Admin generates NDIS-compliant invoices from shifts.

#### Phase 7: Participant Portal (Week 14-15)
**Dependencies:** Phase 6 (invoices must exist to view)

| Task | Details |
|------|---------|
| Participant app scaffold | Next.js 14 + accessible UI |
| Magic link auth | Simplified login flow |
| Shift view | Upcoming + past shifts (read-only) |
| Case notes view | Notes from workers (read-only, no drafts) |
| Invoice view | List + detail + PDF download |
| Plan overview | Budget remaining per category (visual) |
| Profile editing | Update contact details |

**Outputs:** Participants view their shifts, notes, invoices, plan status.

#### Phase 8: Offline Support (Week 16-17)
**Dependencies:** Phase 4-5 (worker app must work online first)

| Task | Details |
|------|---------|
| Local SQLite setup | expo-sqlite schema + migrations |
| Shift caching | Cache upcoming 7 days on sync |
| Offline check-in/out | Write locally + queue for sync |
| Offline case notes | Draft locally + sync when online |
| Sync engine | Queue processor + retry logic + conflict resolution |
| Connectivity detection | NetInfo listener + UI indicator |
| Background sync | expo-background-fetch for periodic sync |

**Outputs:** Worker app fully functional without internet.

#### Phase 9: Notifications + Realtime (Week 18-19)
**Dependencies:** Phase 3 (shifts) + Phase 6 (invoices) for trigger sources

| Task | Details |
|------|---------|
| Edge Function: notifications | Process notification queue |
| Expo Push setup | Push token registration + Expo Push API |
| Email notifications | Resend/SendGrid integration |
| Notification types | Shift assigned/cancelled, invoice finalised, plan expiring |
| Notification centre (mobile) | List + mark as read |
| Realtime subscriptions | Live shift updates in admin calendar |
| In-app notifications (web) | Toast/badge for admin portal |

**Outputs:** All stakeholders receive timely notifications.

#### Phase 10: Reporting + Analytics (Week 20)
**Dependencies:** Phase 6 (invoices) for financial data

| Task | Details |
|------|---------|
| Dashboard stats | Total shifts, hours, revenue, active participants |
| Worker utilisation | Hours worked vs available |
| Budget reports | Per-participant budget status |
| NDIS compliance reports | Service delivery summaries |
| CSV/PDF export | Downloadable reports |

**Outputs:** Admin has visibility into business performance.

---

## Security Architecture

### Authentication Strategy

| App | Auth Method | Token Storage | Session Duration |
|-----|-------------|---------------|-----------------|
| Admin Portal | Email/password | HTTP-only cookie (Next.js) | 1 hour (refresh: 7 days) |
| Participant Portal | Magic link (email) | HTTP-only cookie (Next.js) | 24 hours (refresh: 30 days) |
| Worker Mobile | Email/password | expo-secure-store | 30 days (refresh: 90 days) |

### Security Layers

```
Layer 1: Network
├── HTTPS everywhere (Vercel + Supabase enforce)
├── CORS configured per app domain
└── Rate limiting (Supabase built-in)

Layer 2: Authentication
├── Supabase Auth (JWT-based)
├── Password requirements (8+ chars, mixed case, number)
├── Magic link expiry (5 minutes)
└── Session refresh on activity

Layer 3: Authorization (RLS)
├── Row-level security on ALL tables
├── Role-based policies (admin > coordinator > worker > participant)
├── Helper functions (is_admin_or_coordinator, get_user_role)
└── No direct table access without policy match

Layer 4: Application
├── Next.js middleware (route-level role checks)
├── Server-side session validation
├── Input validation (Zod schemas in shared utils)
└── CSRF protection (Next.js built-in for server actions)

Layer 5: Data
├── Sensitive data not exposed (service role key server-only)
├── Signed URLs for file downloads (time-limited)
├── Audit log for sensitive operations
└── PII encryption at rest (Supabase PostgreSQL)
```

### Key Security Rules

1. **Service role key** NEVER leaves server-side code (Edge Functions, Next.js server actions)
2. **Anon key** used in client apps - all protection via RLS
3. **Workers cannot see other workers' shifts** - RLS enforces this
4. **Participants cannot see other participants' data** - profile_id linking enforces isolation
5. **Case note drafts** invisible to participants until worker marks as final
6. **Invoice drafts** invisible to participants until status moves past 'draft'
7. **GPS coordinates** stored for check-in verification, not exposed to participants
8. **File uploads** restricted by bucket RLS policies + file size limits
9. **Admin actions** logged in audit_log for compliance

### Environment Variables

```env
# .env.local (git-ignored)
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...  # Server-only!

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Notifications
RESEND_API_KEY=re_xxxxx
EXPO_PUSH_ACCESS_TOKEN=xxxxx

# Dev/Prod switching
NEXT_PUBLIC_ENVIRONMENT=development
```

### Multi-Environment Strategy

| Environment | Supabase Project | Vercel Environment | Branch |
|-------------|-----------------|-------------------|--------|
| Development | ephraimcare-dev | Preview | feature/* |
| Staging | ephraimcare-dev | Preview (staging) | staging |
| Production | ephraimcare-prod | Production | main |

---

## Testing Strategy

### Test Pyramid

```
         ┌─────────┐
         │   E2E   │  Playwright (admin + participant portals)
         │  (few)  │  Detox (worker mobile)
         ├─────────┤
         │ Integr. │  Supabase local + test DB
         │  (some) │  RLS policy tests
         ├─────────┤
         │  Unit   │  Vitest (shared packages)
         │ (many)  │  Jest (React Native)
         └─────────┘
```

### Testing Approach by Layer

| Layer | Tool | What to Test |
|-------|------|-------------|
| Shared utils | Vitest | NDIS calculations, date formatting, validators |
| RLS policies | pgTAP / Supabase test helpers | Role-based access for every table |
| Server actions | Vitest + Supabase local | CRUD operations, error handling |
| Components | React Testing Library | Forms, data display, interactions |
| Mobile | Jest + React Native Testing Library | Offline queue, sync logic, forms |
| E2E (web) | Playwright | Full workflows: login → create shift → invoice |
| E2E (mobile) | Detox (optional) | Check-in flow, offline mode |

### RLS Test Example

```sql
-- Test: Worker cannot see other workers' shifts
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "worker-1-uuid"}';

-- Should return 0 rows (worker-2's shifts)
SELECT COUNT(*) FROM shifts WHERE worker_id = 'worker-2-uuid';
-- Expected: 0
```

---

## Technology Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monorepo tool | Turborepo | Vercel integration, simple config, remote caching |
| Package manager | pnpm | Strict deps, efficient, workspace support |
| Web framework | Next.js 14+ (App Router) | Server components, server actions, Vercel deploy |
| Mobile framework | Expo (React Native) | Managed workflow, EAS Build, Expo Router |
| Backend | Supabase | PostgreSQL + Auth + RLS + Realtime + Storage + Edge Functions |
| Hosting (web) | Vercel | Turborepo integration, preview deployments, edge |
| CSS | Tailwind CSS | Utility-first, consistent, fast development |
| UI components (web) | shadcn/ui | Accessible, customisable, not a dependency |
| State (mobile) | Zustand | Lightweight, TypeScript-first, works with persistence |
| Offline storage | expo-sqlite | Structured data, SQL queries, reliable |
| Validation | Zod | TypeScript-native, shared between client/server |
| Email | Resend | Simple API, React Email templates |
| Push notifications | Expo Push API | Native to Expo, reliable delivery |
| Testing (web) | Vitest + Playwright | Fast unit tests + reliable E2E |
| Testing (mobile) | Jest + RNTL | Standard React Native testing |

---

## NDIS-Specific Considerations

### Compliance Requirements

1. **Case notes** must include: date, duration, goals addressed, participant response, worker signature (digital)
2. **Invoices** must reference: NDIS item numbers, service dates, quantities, rates from price guide
3. **Service agreements** must be signed before services commence
4. **Budget tracking** must prevent over-servicing (alerts at 80%, block at 100%)
5. **Audit trail** required for all changes to shifts, invoices, case notes
6. **Data retention** minimum 7 years for financial records

### NDIS Price Guide Integration

- Store current price guide in `ndis_price_guide` table
- Annual update process (July each year when new guide released)
- Edge Function to validate rates during invoice generation
- Support for different rate types: weekday, Saturday, Sunday, public holiday, evening

### Support Categories Tracked

- Core Supports (Assistance with Daily Life, Transport, Consumables)
- Capacity Building (Daily Activities, Employment, Social/Community Participation)
- Capital Supports (Assistive Technology, Home Modifications)

---

## Key Architectural Decisions (ADRs)

### ADR-001: Server Actions over API Routes
**Decision:** Use Next.js Server Actions for mutations, direct Supabase client for reads.
**Rationale:** Server Actions provide type-safe mutations with automatic revalidation. API routes only needed for external webhooks. Direct client reads leverage Supabase RLS without extra server hop.

### ADR-002: Separate Supabase Client per Platform
**Decision:** Worker mobile app has its own Supabase client setup (not sharing packages/supabase).
**Rationale:** React Native requires @supabase/supabase-js with AsyncStorage adapter, different from Next.js cookie-based approach. Shared types and utils still used.

### ADR-003: expo-sqlite over WatermelonDB
**Decision:** Use expo-sqlite for offline storage in worker app.
**Rationale:** Simpler setup, no ORM overhead, direct SQL control, smaller bundle size. WatermelonDB adds complexity not needed for our limited offline data set (shifts + drafts).

### ADR-004: Zustand over Redux/Context
**Decision:** Use Zustand for worker mobile app state management.
**Rationale:** Minimal boilerplate, built-in persistence middleware (for offline), TypeScript-first, works well with React Native. No need for Redux complexity at this scale.

### ADR-005: shadcn/ui over Component Library
**Decision:** Use shadcn/ui (copy-paste components) for web apps.
**Rationale:** Full control over components, accessible by default (Radix primitives), no version-lock dependency, Tailwind-native, customisable to NDIS accessibility needs.

### ADR-006: Single Supabase Project per Environment
**Decision:** Separate Supabase projects for dev and prod (not branches).
**Rationale:** Complete isolation of data, independent RLS testing, no risk of dev migrations affecting prod. Supabase branching is preview-only and not production-ready for this use case.
