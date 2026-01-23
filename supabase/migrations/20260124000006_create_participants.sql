create table public.participants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  ndis_number text unique not null,
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  phone text,
  email text,
  address_line_1 text,
  address_line_2 text,
  suburb text,
  state text default 'NSW',
  postcode text,
  latitude double precision,
  longitude double precision,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  organization_id uuid not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_participants_org on participants(organization_id);
create index idx_participants_ndis on participants(ndis_number);

create trigger handle_updated_at
  before update on public.participants
  for each row execute procedure moddatetime(updated_at);

create trigger audit_participants
  after insert or update or delete on public.participants
  for each row execute function audit.audit_trigger_func();
