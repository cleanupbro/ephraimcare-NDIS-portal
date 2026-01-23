create table public.case_notes (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid references shifts(id),
  participant_id uuid not null references participants(id),
  worker_id uuid not null references workers(id),
  note_date date not null default current_date,
  content text not null,
  goals_addressed text[],
  participant_response text,
  follow_up_required boolean default false,
  follow_up_notes text,
  is_draft boolean default false,
  attachments text[],
  organization_id uuid not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_case_notes_participant on case_notes(participant_id);
create index idx_case_notes_worker on case_notes(worker_id);
create index idx_case_notes_shift on case_notes(shift_id);
create index idx_case_notes_org on case_notes(organization_id);

create trigger handle_updated_at
  before update on public.case_notes
  for each row execute procedure moddatetime(updated_at);

create trigger audit_case_notes
  after insert or update or delete on public.case_notes
  for each row execute function audit.audit_trigger_func();
