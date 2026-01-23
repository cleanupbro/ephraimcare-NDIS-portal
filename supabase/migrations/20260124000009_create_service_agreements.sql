create table public.service_agreements (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id),
  plan_id uuid not null references ndis_plans(id),
  start_date date not null,
  end_date date not null,
  status public.service_agreement_status default 'active',
  document_url text,
  notes text,
  organization_id uuid not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.service_agreement_items (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references service_agreements(id) on delete cascade,
  ndis_item_number text not null,
  description text not null,
  unit_price decimal(10,2) not null,
  quantity_allocated decimal(10,2),
  budget_category text not null,
  created_at timestamptz default now()
);

create index idx_service_agreements_participant on service_agreements(participant_id);
create index idx_service_agreements_org on service_agreements(organization_id);

create trigger handle_service_agreements_updated_at
  before update on public.service_agreements
  for each row execute procedure moddatetime(updated_at);
