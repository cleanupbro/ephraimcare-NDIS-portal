-- Fix RLS helper functions to work without custom access token hook enabled
-- Falls back to direct profiles table lookup when JWT claims are not present

create or replace function public.get_user_organization_id()
returns uuid
language sql
stable
security definer
as $$
  select coalesce(
    (auth.jwt() ->> 'organization_id')::uuid,
    (select organization_id from public.profiles where id = auth.uid())
  );
$$;

create or replace function public.get_user_role()
returns public.app_role
language sql
stable
security definer
as $$
  select coalesce(
    (auth.jwt() ->> 'user_role')::public.app_role,
    (select role from public.profiles where id = auth.uid())
  );
$$;

create or replace function public.is_admin_or_coordinator()
returns boolean
language sql
stable
security definer
as $$
  select public.get_user_role() in ('admin', 'coordinator');
$$;
