create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id),
  type public.notification_type not null,
  title text not null,
  body text,
  data jsonb,
  is_read boolean default false,
  sent_at timestamptz default now(),
  read_at timestamptz
);

create index idx_notifications_recipient on notifications(recipient_id, is_read);
create index idx_notifications_sent_at on notifications(sent_at);
