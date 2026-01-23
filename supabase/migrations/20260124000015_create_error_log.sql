-- Error log for capturing failed operations (INFR-04)
create table public.error_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  operation text not null,
  error_message text not null,
  error_code text,
  context jsonb,
  created_at timestamptz default now()
);

create index idx_error_log_user on error_log(user_id);
create index idx_error_log_created_at on error_log(created_at);
