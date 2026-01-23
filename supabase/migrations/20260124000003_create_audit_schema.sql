-- Audit schema and trigger function
create schema if not exists audit;

create table audit.audit_log (
  id bigserial primary key,
  table_name text not null,
  record_id uuid,
  operation text not null,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid,
  changed_at timestamptz not null default now()
);

create index idx_audit_log_table on audit.audit_log(table_name);
create index idx_audit_log_record on audit.audit_log(record_id);
create index idx_audit_log_changed_at on audit.audit_log(changed_at);

create or replace function audit.audit_trigger_func()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'INSERT' then
    insert into audit.audit_log (table_name, record_id, operation, new_data, changed_by)
    values (TG_TABLE_NAME, new.id, TG_OP, to_jsonb(new), auth.uid());
    return new;
  elsif TG_OP = 'UPDATE' then
    insert into audit.audit_log (table_name, record_id, operation, old_data, new_data, changed_by)
    values (TG_TABLE_NAME, new.id, TG_OP, to_jsonb(old), to_jsonb(new), auth.uid());
    return new;
  elsif TG_OP = 'DELETE' then
    insert into audit.audit_log (table_name, record_id, operation, old_data, changed_by)
    values (TG_TABLE_NAME, old.id, TG_OP, to_jsonb(old), auth.uid());
    return old;
  end if;
end;
$$;
