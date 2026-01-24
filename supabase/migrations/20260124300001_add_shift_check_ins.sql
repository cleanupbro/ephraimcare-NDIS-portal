-- Migration: Shift check-ins, push tokens, and participant geo columns
-- Phase 5 Plan 01: Worker Mobile App data layer
-- Creates shift_check_ins table, worker_push_tokens table, adds geo columns to participants,
-- RLS policies, auto-checkout pg_cron job, and audit/updated_at triggers.

-- ============================================
-- 1. SHIFT CHECK-INS TABLE
-- ============================================
create table public.shift_check_ins (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  check_in_time timestamptz not null,
  check_in_latitude double precision not null,
  check_in_longitude double precision not null,
  check_out_time timestamptz,
  check_out_latitude double precision,
  check_out_longitude double precision,
  check_out_type text default 'manual' check (check_out_type in ('manual', 'auto', 'admin_override')),
  duration_minutes integer,
  synced_from_offline boolean default false,
  organization_id uuid not null references public.organizations(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint unique_shift_check_in unique(shift_id)
);

create index idx_shift_check_ins_shift on public.shift_check_ins(shift_id);
create index idx_shift_check_ins_org on public.shift_check_ins(organization_id);
create index idx_shift_check_ins_checkin_time on public.shift_check_ins(check_in_time);

-- ============================================
-- 2. WORKER PUSH TOKENS TABLE
-- ============================================
create table public.worker_push_tokens (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.profiles(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android')),
  organization_id uuid not null references public.organizations(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint unique_worker_platform unique(worker_id, platform)
);

create index idx_push_tokens_worker on public.worker_push_tokens(worker_id);
create index idx_push_tokens_org on public.worker_push_tokens(organization_id);

-- ============================================
-- 3. ADD GEO COLUMNS TO PARTICIPANTS
-- ============================================
alter table public.participants add column if not exists latitude double precision;
alter table public.participants add column if not exists longitude double precision;

-- ============================================
-- 4. ENABLE RLS
-- ============================================
alter table public.shift_check_ins enable row level security;
alter table public.worker_push_tokens enable row level security;

-- ============================================
-- 5. RLS POLICIES ON SHIFT_CHECK_INS
-- ============================================

-- Workers can view their own check-ins
create policy "Workers can view their own check-ins"
  on public.shift_check_ins for select
  to authenticated
  using (
    shift_id in (
      select s.id from public.shifts s
      inner join public.workers w on s.worker_id = w.id
      where w.profile_id = auth.uid()
    )
    and organization_id = get_user_organization_id()
  );

-- Workers can insert check-ins for their own shifts
create policy "Workers can insert their own check-ins"
  on public.shift_check_ins for insert
  to authenticated
  with check (
    shift_id in (
      select s.id from public.shifts s
      inner join public.workers w on s.worker_id = w.id
      where w.profile_id = auth.uid()
    )
    and organization_id = get_user_organization_id()
  );

-- Workers can update check-out fields on their own check-ins
create policy "Workers can update their own check-ins"
  on public.shift_check_ins for update
  to authenticated
  using (
    shift_id in (
      select s.id from public.shifts s
      inner join public.workers w on s.worker_id = w.id
      where w.profile_id = auth.uid()
    )
    and organization_id = get_user_organization_id()
  );

-- Admins/Coordinators can view all check-ins in their org
create policy "Admin/coordinator can view all check-ins"
  on public.shift_check_ins for select
  to authenticated
  using (
    is_admin_or_coordinator()
    and organization_id = get_user_organization_id()
  );

-- Admins can update any check-in in their org (for admin_override)
create policy "Admin can update any check-in in org"
  on public.shift_check_ins for update
  to authenticated
  using (
    get_user_role() = 'admin'
    and organization_id = get_user_organization_id()
  );

-- ============================================
-- 6. RLS POLICIES ON WORKER_PUSH_TOKENS
-- ============================================

-- Workers can manage their own push tokens
create policy "Workers can insert their own push tokens"
  on public.worker_push_tokens for insert
  to authenticated
  with check (
    worker_id = auth.uid()
    and organization_id = get_user_organization_id()
  );

create policy "Workers can update their own push tokens"
  on public.worker_push_tokens for update
  to authenticated
  using (
    worker_id = auth.uid()
    and organization_id = get_user_organization_id()
  );

create policy "Workers can delete their own push tokens"
  on public.worker_push_tokens for delete
  to authenticated
  using (
    worker_id = auth.uid()
    and organization_id = get_user_organization_id()
  );

create policy "Workers can view their own push tokens"
  on public.worker_push_tokens for select
  to authenticated
  using (
    worker_id = auth.uid()
    and organization_id = get_user_organization_id()
  );

-- Admins can view all push tokens in their org (for sending notifications)
create policy "Admin can view all push tokens in org"
  on public.worker_push_tokens for select
  to authenticated
  using (
    is_admin_or_coordinator()
    and organization_id = get_user_organization_id()
  );

-- ============================================
-- 7. PG_CRON AUTO-CHECKOUT JOB
-- ============================================
create extension if not exists pg_cron;

-- Auto-checkout function: closes open check-ins where shift ended 30+ minutes ago
create or replace function public.auto_checkout_stale_shifts()
returns void
language plpgsql
security definer
as $$
begin
  -- Update shift_check_ins: set check_out_time and type for stale open check-ins
  update public.shift_check_ins sci
  set
    check_out_time = s.scheduled_end + interval '30 minutes',
    check_out_type = 'auto',
    duration_minutes = extract(epoch from (s.scheduled_end + interval '30 minutes' - sci.check_in_time)) / 60,
    updated_at = now()
  from public.shifts s
  where sci.shift_id = s.id
    and sci.check_in_time is not null
    and sci.check_out_time is null
    and s.scheduled_end + interval '30 minutes' < now();

  -- Also update shifts status to 'completed' for auto-checked-out shifts
  update public.shifts s
  set
    status = 'completed',
    actual_end = s.scheduled_end + interval '30 minutes',
    updated_at = now()
  from public.shift_check_ins sci
  where s.id = sci.shift_id
    and sci.check_out_type = 'auto'
    and s.status not in ('completed', 'cancelled');
end;
$$;

-- Schedule the auto-checkout job to run every 5 minutes
select cron.schedule(
  'auto-checkout-stale-shifts',
  '*/5 * * * *',
  $$select public.auto_checkout_stale_shifts()$$
);

-- ============================================
-- 8. UPDATED_AT TRIGGERS
-- ============================================
create trigger handle_shift_check_ins_updated_at
  before update on public.shift_check_ins
  for each row execute procedure moddatetime(updated_at);

create trigger handle_worker_push_tokens_updated_at
  before update on public.worker_push_tokens
  for each row execute procedure moddatetime(updated_at);

-- ============================================
-- 9. AUDIT TRIGGERS (if audit schema exists)
-- ============================================
do $$
begin
  if exists (select 1 from pg_proc where proname = 'audit_trigger_func' and pronamespace = (select oid from pg_namespace where nspname = 'audit')) then
    execute 'create trigger audit_shift_check_ins after insert or update or delete on public.shift_check_ins for each row execute function audit.audit_trigger_func()';
    execute 'create trigger audit_worker_push_tokens after insert or update or delete on public.worker_push_tokens for each row execute function audit.audit_trigger_func()';
  end if;
end;
$$;
