-- Migration: Add shift scheduling enhancements
-- Phase 4 Plan 01: Shift Scheduling data layer
-- Adds support_type column, pending/proposed enum values, and overlap detection index

-- 1. Add new enum values for shift status (backward compatible - does NOT remove existing values)
ALTER TYPE public.shift_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE public.shift_status ADD VALUE IF NOT EXISTS 'proposed';

-- 2. Add support_type column for matching worker capabilities to shift requirements
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS support_type text;

-- 3. Change default status for new shifts from 'scheduled' to 'pending'
ALTER TABLE public.shifts ALTER COLUMN status SET DEFAULT 'pending';

-- 4. Create composite index for efficient overlap detection queries
-- Only indexes non-cancelled shifts (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_shifts_worker_timerange
ON public.shifts(worker_id, scheduled_start, scheduled_end)
WHERE status NOT IN ('cancelled');
