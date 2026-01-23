-- Custom enum types
create type public.app_role as enum ('admin', 'coordinator', 'worker', 'participant');
create type public.shift_status as enum ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
create type public.invoice_status as enum ('draft', 'pending', 'submitted', 'paid', 'overdue', 'cancelled');
create type public.service_agreement_status as enum ('draft', 'active', 'expired', 'cancelled');
create type public.notification_type as enum ('shift_assigned', 'shift_cancelled', 'shift_reminder', 'invoice_finalised', 'case_note_added', 'plan_expiring');
