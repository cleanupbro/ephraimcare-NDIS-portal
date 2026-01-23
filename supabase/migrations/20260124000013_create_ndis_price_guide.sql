create table public.ndis_price_guide (
  id uuid primary key default gen_random_uuid(),
  item_number text not null,
  item_name text not null,
  registration_group text,
  support_category text,
  unit text,
  price_national decimal(10,2),
  price_remote decimal(10,2),
  price_very_remote decimal(10,2),
  effective_from date not null,
  effective_to date,
  is_current boolean default true,
  created_at timestamptz default now()
);

create index idx_ndis_price_guide_item on ndis_price_guide(item_number, is_current);
create index idx_ndis_price_guide_category on ndis_price_guide(support_category);
