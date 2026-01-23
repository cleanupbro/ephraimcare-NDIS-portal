create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique,
  participant_id uuid not null references participants(id),
  plan_id uuid references ndis_plans(id),
  invoice_date date not null default current_date,
  due_date date,
  subtotal decimal(12,2) not null default 0,
  gst decimal(12,2) not null default 0,
  total decimal(12,2) not null default 0,
  status public.invoice_status default 'draft',
  payment_reference text,
  notes text,
  organization_id uuid not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  shift_id uuid references shifts(id),
  ndis_item_number text not null,
  description text not null,
  service_date date not null,
  quantity decimal(10,2) not null,
  unit_price decimal(10,2) not null,
  line_total decimal(12,2) not null,
  created_at timestamptz default now()
);

create index idx_invoices_participant on invoices(participant_id);
create index idx_invoices_status on invoices(status);
create index idx_invoices_org on invoices(organization_id);
create index idx_invoice_line_items_invoice on invoice_line_items(invoice_id);

-- Auto-generate invoice number
create or replace function generate_invoice_number()
returns trigger as $$
declare
  year_month text;
  sequence_num integer;
begin
  year_month := to_char(new.invoice_date, 'YYYYMM');
  select coalesce(max(
    cast(split_part(invoice_number, '-', 3) as integer)
  ), 0) + 1
  into sequence_num
  from invoices
  where invoice_number like 'INV-' || year_month || '-%';

  new.invoice_number := 'INV-' || year_month || '-' || lpad(sequence_num::text, 4, '0');
  return new;
end;
$$ language plpgsql;

create trigger trg_generate_invoice_number
  before insert on invoices
  for each row
  when (new.invoice_number is null)
  execute function generate_invoice_number();

create trigger handle_updated_at
  before update on public.invoices
  for each row execute procedure moddatetime(updated_at);

create trigger audit_invoices
  after insert or update or delete on public.invoices
  for each row execute function audit.audit_trigger_func();
