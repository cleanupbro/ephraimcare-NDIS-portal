-- ============================================
-- SEED DATA: Ephraim Care Development
-- Run with service_role (bypasses RLS)
-- ============================================

-- Organization ID (consistent across all seed data)
-- In production, this would come from an organizations table
do $$
declare
  org_id uuid := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  admin_id uuid := '11111111-1111-1111-1111-111111111111';
  coord_id uuid := '22222222-2222-2222-2222-222222222222';
  worker1_id uuid := '33333333-3333-3333-3333-333333333333';
  worker2_id uuid := '44444444-4444-4444-4444-444444444444';
  worker3_id uuid := '55555555-5555-5555-5555-555555555555';
  worker4_id uuid := '66666666-6666-6666-6666-666666666666';
  worker5_id uuid := '77777777-7777-7777-7777-777777777777';
  part1_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  part2_id uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  part3_id uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  part4_id uuid := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  part5_id uuid := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  w1_ref uuid;
  w2_ref uuid;
  w3_ref uuid;
  w4_ref uuid;
  w5_ref uuid;
  plan1_id uuid;
  plan2_id uuid;
begin

-- ============================================
-- PROFILES (7 users: 1 admin, 1 coordinator, 5 workers)
-- Note: auth.users must be created separately via Supabase Auth API
-- These profiles reference those auth users
-- ============================================
insert into public.profiles (id, role, first_name, last_name, email, organization_id) values
  (admin_id, 'admin', 'Ephraim', 'Admin', 'admin@ephraimcare.com.au', org_id),
  (coord_id, 'coordinator', 'Sarah', 'Coordinator', 'sarah@ephraimcare.com.au', org_id),
  (worker1_id, 'worker', 'James', 'Wilson', 'james@ephraimcare.com.au', org_id),
  (worker2_id, 'worker', 'Maria', 'Garcia', 'maria@ephraimcare.com.au', org_id),
  (worker3_id, 'worker', 'David', 'Chen', 'david@ephraimcare.com.au', org_id),
  (worker4_id, 'worker', 'Emma', 'Thompson', 'emma@ephraimcare.com.au', org_id),
  (worker5_id, 'worker', 'Liam', 'Patel', 'liam@ephraimcare.com.au', org_id);

-- ============================================
-- PARTICIPANTS (5)
-- ============================================
insert into public.participants (id, ndis_number, first_name, last_name, date_of_birth, phone, email, address_line_1, suburb, state, postcode, latitude, longitude, organization_id) values
  (part1_id, '431000001', 'Alice', 'Johnson', '1985-03-15', '0412345001', 'alice.j@email.com', '15 George St', 'Liverpool', 'NSW', '2170', -33.9200, 150.9230, org_id),
  (part2_id, '431000002', 'Bob', 'Smith', '1990-07-22', '0412345002', 'bob.s@email.com', '42 Moore St', 'Liverpool', 'NSW', '2170', -33.9180, 150.9250, org_id),
  (part3_id, '431000003', 'Carol', 'Williams', '1978-11-30', '0412345003', 'carol.w@email.com', '8 Hoxton Park Rd', 'Hoxton Park', 'NSW', '2171', -33.9400, 150.8540, org_id),
  (part4_id, '431000004', 'Daniel', 'Brown', '1995-01-08', '0412345004', 'daniel.b@email.com', '23 Cabramatta Rd', 'Cabramatta', 'NSW', '2166', -33.8950, 150.9350, org_id),
  (part5_id, '431000005', 'Eve', 'Davis', '1982-09-14', '0412345005', 'eve.d@email.com', '67 Fairfield St', 'Fairfield', 'NSW', '2165', -33.8720, 150.9560, org_id);

-- ============================================
-- WORKERS (5)
-- ============================================
insert into public.workers (id, profile_id, employee_id, qualification, services_provided, hourly_rate, organization_id) values
  (gen_random_uuid(), worker1_id, 'EMP-001', array['Cert III Individual Support', 'First Aid'], array['Personal Care', 'Community Access'], 42.50, org_id),
  (gen_random_uuid(), worker2_id, 'EMP-002', array['Cert IV Disability', 'Manual Handling'], array['Personal Care', 'Domestic Assistance'], 45.00, org_id),
  (gen_random_uuid(), worker3_id, 'EMP-003', array['Cert III Individual Support'], array['Community Access', 'Transport'], 42.50, org_id),
  (gen_random_uuid(), worker4_id, 'EMP-004', array['Cert IV Disability', 'Behaviour Support'], array['Personal Care', 'Capacity Building'], 48.00, org_id),
  (gen_random_uuid(), worker5_id, 'EMP-005', array['Cert III Individual Support', 'First Aid'], array['Domestic Assistance', 'Community Access'], 42.50, org_id);

-- Get worker table IDs for shift references
select id into w1_ref from workers where profile_id = worker1_id;
select id into w2_ref from workers where profile_id = worker2_id;
select id into w3_ref from workers where profile_id = worker3_id;
select id into w4_ref from workers where profile_id = worker4_id;
select id into w5_ref from workers where profile_id = worker5_id;

-- ============================================
-- NDIS PLANS (2 current plans)
-- ============================================
insert into public.ndis_plans (id, participant_id, plan_number, start_date, end_date, total_budget, is_current, organization_id)
values
  (gen_random_uuid(), part1_id, 'PLAN-2026-001', '2025-07-01', '2026-06-30', 85000.00, true, org_id),
  (gen_random_uuid(), part2_id, 'PLAN-2026-002', '2025-07-01', '2026-06-30', 62000.00, true, org_id);

select id into plan1_id from ndis_plans where participant_id = part1_id limit 1;
select id into plan2_id from ndis_plans where participant_id = part2_id limit 1;

-- Plan budgets
insert into public.plan_budgets (plan_id, category, subcategory, allocated_amount) values
  (plan1_id, 'Core', 'Assistance with Daily Life', 45000.00),
  (plan1_id, 'Core', 'Transport', 5000.00),
  (plan1_id, 'Capacity Building', 'Daily Activities', 25000.00),
  (plan1_id, 'Capital', 'Assistive Technology', 10000.00),
  (plan2_id, 'Core', 'Assistance with Daily Life', 35000.00),
  (plan2_id, 'Core', 'Community Access', 12000.00),
  (plan2_id, 'Capacity Building', 'Social Participation', 15000.00);

-- ============================================
-- SHIFTS (20 shifts across multiple workers and participants)
-- ============================================
insert into public.shifts (participant_id, worker_id, scheduled_start, scheduled_end, status, organization_id) values
  -- Past completed shifts
  (part1_id, w1_ref, '2026-01-20 08:00+11', '2026-01-20 12:00+11', 'completed', org_id),
  (part1_id, w1_ref, '2026-01-21 08:00+11', '2026-01-21 12:00+11', 'completed', org_id),
  (part2_id, w2_ref, '2026-01-20 13:00+11', '2026-01-20 17:00+11', 'completed', org_id),
  (part2_id, w2_ref, '2026-01-21 13:00+11', '2026-01-21 17:00+11', 'completed', org_id),
  (part3_id, w3_ref, '2026-01-20 09:00+11', '2026-01-20 13:00+11', 'completed', org_id),
  (part3_id, w3_ref, '2026-01-22 09:00+11', '2026-01-22 13:00+11', 'completed', org_id),
  (part4_id, w4_ref, '2026-01-21 08:00+11', '2026-01-21 14:00+11', 'completed', org_id),
  (part5_id, w5_ref, '2026-01-22 14:00+11', '2026-01-22 18:00+11', 'completed', org_id),
  -- Today's shifts
  (part1_id, w1_ref, '2026-01-24 08:00+11', '2026-01-24 12:00+11', 'scheduled', org_id),
  (part2_id, w2_ref, '2026-01-24 09:00+11', '2026-01-24 13:00+11', 'scheduled', org_id),
  (part3_id, w3_ref, '2026-01-24 13:00+11', '2026-01-24 17:00+11', 'scheduled', org_id),
  (part4_id, w4_ref, '2026-01-24 08:00+11', '2026-01-24 14:00+11', 'scheduled', org_id),
  -- Future shifts
  (part1_id, w2_ref, '2026-01-27 08:00+11', '2026-01-27 12:00+11', 'scheduled', org_id),
  (part2_id, w1_ref, '2026-01-27 13:00+11', '2026-01-27 17:00+11', 'scheduled', org_id),
  (part3_id, w4_ref, '2026-01-28 09:00+11', '2026-01-28 15:00+11', 'scheduled', org_id),
  (part4_id, w5_ref, '2026-01-28 08:00+11', '2026-01-28 12:00+11', 'scheduled', org_id),
  (part5_id, w3_ref, '2026-01-29 13:00+11', '2026-01-29 17:00+11', 'scheduled', org_id),
  (part1_id, w1_ref, '2026-01-30 08:00+11', '2026-01-30 12:00+11', 'scheduled', org_id),
  (part2_id, w2_ref, '2026-01-30 13:00+11', '2026-01-30 17:00+11', 'scheduled', org_id),
  (part5_id, w5_ref, '2026-01-31 08:00+11', '2026-01-31 12:00+11', 'scheduled', org_id);

-- ============================================
-- INVOICES (2 invoices from completed shifts)
-- ============================================
insert into public.invoices (participant_id, plan_id, invoice_date, subtotal, gst, total, status, organization_id, created_by) values
  (part1_id, plan1_id, '2026-01-22', 340.00, 0, 340.00, 'pending', org_id, admin_id),
  (part2_id, plan2_id, '2026-01-22', 360.00, 0, 360.00, 'draft', org_id, admin_id);

end;
$$;
