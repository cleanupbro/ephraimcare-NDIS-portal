create table public.ndis_plans (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id),
  plan_number text,
  start_date date not null,
  end_date date not null,
  total_budget decimal(12,2) not null,
  is_current boolean default true,
  organization_id uuid not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.plan_budgets (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references ndis_plans(id) on delete cascade,
  category text not null,
  subcategory text,
  allocated_amount decimal(12,2) not null,
  used_amount decimal(12,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_ndis_plans_participant on ndis_plans(participant_id);
create index idx_ndis_plans_org on ndis_plans(organization_id);
create index idx_plan_budgets_plan on plan_budgets(plan_id);

create trigger handle_ndis_plans_updated_at
  before update on public.ndis_plans
  for each row execute procedure moddatetime(updated_at);

create trigger handle_plan_budgets_updated_at
  before update on public.plan_budgets
  for each row execute procedure moddatetime(updated_at);
