-- Custom access token hook for RBAC
-- Injects role + organization_id into JWT claims

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
  -- Read role from profiles table
  select role, organization_id into user_role, org_id
  from public.profiles
  where id = (event->>'user_id')::uuid;

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

-- Grant permissions for the auth hook
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
grant select on public.profiles to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- Helper functions for RLS
create or replace function public.get_user_role()
returns public.app_role
language sql
stable
as $$
  select (auth.jwt() ->> 'user_role')::public.app_role;
$$;

create or replace function public.is_admin_or_coordinator()
returns boolean
language sql
stable
as $$
  select public.get_user_role() in ('admin', 'coordinator');
$$;

create or replace function public.get_user_organization_id()
returns uuid
language sql
stable
as $$
  select (auth.jwt() ->> 'organization_id')::uuid;
$$;
