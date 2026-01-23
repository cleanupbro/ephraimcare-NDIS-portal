-- Enable RLS on all tables
alter table profiles enable row level security;
alter table participants enable row level security;
alter table workers enable row level security;
alter table ndis_plans enable row level security;
alter table plan_budgets enable row level security;
alter table service_agreements enable row level security;
alter table service_agreement_items enable row level security;
alter table shifts enable row level security;
alter table case_notes enable row level security;
alter table invoices enable row level security;
alter table invoice_line_items enable row level security;
alter table notifications enable row level security;
alter table error_log enable row level security;
alter table ndis_price_guide enable row level security;

-- ============================================
-- PROFILES POLICIES
-- ============================================
create policy "Users can view own profile"
  on profiles for select
  to authenticated
  using (id = auth.uid());

create policy "Admin/coordinator can view org profiles"
  on profiles for select
  to authenticated
  using (
    is_admin_or_coordinator()
    and organization_id = get_user_organization_id()
  );

create policy "Admin can update org profiles"
  on profiles for update
  to authenticated
  using (
    is_admin_or_coordinator()
    and organization_id = get_user_organization_id()
  );

create policy "Users can update own profile (not role)"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admin can insert profiles"
  on profiles for insert
  to authenticated
  with check (
    is_admin_or_coordinator()
    and organization_id = get_user_organization_id()
  );

-- ============================================
-- PARTICIPANTS POLICIES
-- ============================================
create policy "Org members can view participants"
  on participants for select
  to authenticated
  using (organization_id = get_user_organization_id());

create policy "Admin/coordinator can manage participants"
  on participants for all
  to authenticated
  using (
    is_admin_or_coordinator()
    and organization_id = get_user_organization_id()
  );

-- ============================================
-- WORKERS POLICIES
-- ============================================
create policy "Org members can view workers"
  on workers for select
  to authenticated
  using (organization_id = get_user_organization_id());

create policy "Admin/coordinator can manage workers"
  on workers for all
  to authenticated
  using (
    is_admin_or_coordinator()
    and organization_id = get_user_organization_id()
  );

-- ============================================
-- SHIFTS POLICIES
-- ============================================
create policy "Admin/coordinator can manage shifts"
  on shifts for all
  to authenticated
  using (
    is_admin_or_coordinator()
    and organization_id = get_user_organization_id()
  );

create policy "Workers can view their own shifts"
  on shifts for select
  to authenticated
  using (
    worker_id in (select id from workers where profile_id = auth.uid())
    and organization_id = get_user_organization_id()
  );

create policy "Workers can update their own shifts (check-in/out)"
  on shifts for update
  to authenticated
  using (
    worker_id in (select id from workers where profile_id = auth.uid())
    and organization_id = get_user_organization_id()
  );

create policy "Participants can view their own shifts"
  on shifts for select
  to authenticated
  using (
    participant_id in (select id from participants where profile_id = auth.uid())
    and organization_id = get_user_organization_id()
  );

-- ============================================
-- CASE NOTES POLICIES
-- ============================================
create policy "Admin/coordinator can manage case notes"
  on case_notes for all
  to authenticated
  using (
    is_admin_or_coordinator()
    and organization_id = get_user_organization_id()
  );

create policy "Workers can view their own case notes"
  on case_notes for select
  to authenticated
  using (
    worker_id in (select id from workers where profile_id = auth.uid())
    and organization_id = get_user_organization_id()
  );

create policy "Workers can insert case notes"
  on case_notes for insert
  to authenticated
  with check (
    worker_id in (select id from workers where profile_id = auth.uid())
    and organization_id = get_user_organization_id()
  );

create policy "Workers can update their own drafts"
  on case_notes for update
  to authenticated
  using (
    worker_id in (select id from workers where profile_id = auth.uid())
    and is_draft = true
    and organization_id = get_user_organization_id()
  );

create policy "Participants can view their own case notes (not drafts)"
  on case_notes for select
  to authenticated
  using (
    participant_id in (select id from participants where profile_id = auth.uid())
    and is_draft = false
    and organization_id = get_user_organization_id()
  );

-- ============================================
-- INVOICES POLICIES
-- ============================================
create policy "Admin/coordinator can manage invoices"
  on invoices for all
  to authenticated
  using (
    is_admin_or_coordinator()
    and organization_id = get_user_organization_id()
  );

create policy "Participants can view their non-draft invoices"
  on invoices for select
  to authenticated
  using (
    participant_id in (select id from participants where profile_id = auth.uid())
    and status != 'draft'
    and organization_id = get_user_organization_id()
  );

-- ============================================
-- INVOICE LINE ITEMS POLICIES
-- ============================================
create policy "Admin/coordinator can manage line items"
  on invoice_line_items for all
  to authenticated
  using (
    invoice_id in (
      select id from invoices
      where organization_id = get_user_organization_id()
      and is_admin_or_coordinator()
    )
  );

create policy "Participants can view their line items"
  on invoice_line_items for select
  to authenticated
  using (
    invoice_id in (
      select id from invoices
      where participant_id in (select id from participants where profile_id = auth.uid())
      and status != 'draft'
    )
  );

-- ============================================
-- NDIS PLANS POLICIES
-- ============================================
create policy "Org members can view plans"
  on ndis_plans for select
  to authenticated
  using (organization_id = get_user_organization_id());

create policy "Admin/coordinator can manage plans"
  on ndis_plans for all
  to authenticated
  using (
    is_admin_or_coordinator()
    and organization_id = get_user_organization_id()
  );

-- ============================================
-- PLAN BUDGETS POLICIES
-- ============================================
create policy "Org members can view budgets"
  on plan_budgets for select
  to authenticated
  using (
    plan_id in (select id from ndis_plans where organization_id = get_user_organization_id())
  );

create policy "Admin/coordinator can manage budgets"
  on plan_budgets for all
  to authenticated
  using (
    plan_id in (
      select id from ndis_plans
      where organization_id = get_user_organization_id()
      and is_admin_or_coordinator()
    )
  );

-- ============================================
-- SERVICE AGREEMENTS POLICIES
-- ============================================
create policy "Org members can view agreements"
  on service_agreements for select
  to authenticated
  using (organization_id = get_user_organization_id());

create policy "Admin/coordinator can manage agreements"
  on service_agreements for all
  to authenticated
  using (
    is_admin_or_coordinator()
    and organization_id = get_user_organization_id()
  );

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================
create policy "Users can view own notifications"
  on notifications for select
  to authenticated
  using (recipient_id = auth.uid());

create policy "Users can update own notifications"
  on notifications for update
  to authenticated
  using (recipient_id = auth.uid());

-- ============================================
-- ERROR LOG POLICIES
-- ============================================
create policy "Admin can view error log"
  on error_log for select
  to authenticated
  using (is_admin_or_coordinator());

create policy "Authenticated users can insert errors"
  on error_log for insert
  to authenticated
  with check (true);

-- ============================================
-- NDIS PRICE GUIDE POLICIES (read-only for all authenticated)
-- ============================================
create policy "All authenticated can view price guide"
  on ndis_price_guide for select
  to authenticated
  using (true);

create policy "Admin can manage price guide"
  on ndis_price_guide for all
  to authenticated
  using (is_admin_or_coordinator());
