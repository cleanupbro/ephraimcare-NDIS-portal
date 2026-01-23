create table public.workers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id),
  employee_id text unique,
  qualification text[],
  services_provided text[],
  hourly_rate decimal(10,2),
  max_hours_per_week integer default 38,
  organization_id uuid not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_workers_org on workers(organization_id);
create index idx_workers_profile on workers(profile_id);

create trigger handle_updated_at
  before update on public.workers
  for each row execute procedure moddatetime(updated_at);

create trigger audit_workers
  after insert or update or delete on public.workers
  for each row execute function audit.audit_trigger_func();
