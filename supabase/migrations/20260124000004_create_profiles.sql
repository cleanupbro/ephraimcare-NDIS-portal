-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'participant',
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  organization_id uuid not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_profiles_org on profiles(organization_id);
create index idx_profiles_role on profiles(role);

-- Auto-update updated_at
create trigger handle_updated_at
  before update on public.profiles
  for each row execute procedure moddatetime(updated_at);

-- Audit trail
create trigger audit_profiles
  after insert or update or delete on public.profiles
  for each row execute function audit.audit_trigger_func();
