create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id),
  worker_id uuid not null references workers(id),
  service_agreement_item_id uuid references service_agreement_items(id),
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  actual_start timestamptz,
  actual_end timestamptz,
  status public.shift_status default 'scheduled',
  check_in_latitude double precision,
  check_in_longitude double precision,
  check_out_latitude double precision,
  check_out_longitude double precision,
  cancellation_reason text,
  notes text,
  organization_id uuid not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_shifts_worker on shifts(worker_id);
create index idx_shifts_participant on shifts(participant_id);
create index idx_shifts_scheduled_start on shifts(scheduled_start);
create index idx_shifts_status on shifts(status);
create index idx_shifts_org on shifts(organization_id);

create trigger handle_updated_at
  before update on public.shifts
  for each row execute procedure moddatetime(updated_at);

create trigger audit_shifts
  after insert or update or delete on public.shifts
  for each row execute function audit.audit_trigger_func();
