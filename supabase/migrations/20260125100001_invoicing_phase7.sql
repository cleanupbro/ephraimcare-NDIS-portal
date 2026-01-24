-- Phase 7: Invoicing Enhancement
-- Adds support_type_rates, public_holidays, invoice_number_counter tables,
-- adds columns to invoices and invoice_line_items, replaces invoice numbering
-- with gapless counter, adds finalization protection trigger, RLS policies.

-- ============================================
-- 1. ALTER INVOICES TABLE
-- ============================================
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS period_start date;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS period_end date;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS finalized_at timestamptz;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS finalized_by uuid REFERENCES profiles(id);

-- ============================================
-- 2. ALTER INVOICE_LINE_ITEMS TABLE
-- ============================================
ALTER TABLE public.invoice_line_items ADD COLUMN IF NOT EXISTS support_type text;
ALTER TABLE public.invoice_line_items ADD COLUMN IF NOT EXISTS day_type text;
ALTER TABLE public.invoice_line_items ADD COLUMN IF NOT EXISTS scheduled_minutes integer;
ALTER TABLE public.invoice_line_items ADD COLUMN IF NOT EXISTS actual_minutes integer;
ALTER TABLE public.invoice_line_items ADD COLUMN IF NOT EXISTS billable_minutes integer;

-- Add check constraint on day_type (only if column was just added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'invoice_line_items_day_type_check'
  ) THEN
    ALTER TABLE public.invoice_line_items
      ADD CONSTRAINT invoice_line_items_day_type_check
      CHECK (day_type IN ('weekday', 'saturday', 'sunday', 'public_holiday'));
  END IF;
END;
$$;

-- ============================================
-- 3. CREATE SUPPORT_TYPE_RATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.support_type_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  support_type text NOT NULL,
  ndis_item_number text,
  weekday_rate decimal(10,2) NOT NULL,
  saturday_rate decimal(10,2) NOT NULL,
  sunday_rate decimal(10,2) NOT NULL,
  public_holiday_rate decimal(10,2) NOT NULL,
  effective_from date NOT NULL DEFAULT current_date,
  is_active boolean DEFAULT true,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT support_type_rates_unique UNIQUE (support_type, organization_id, effective_from)
);

CREATE INDEX IF NOT EXISTS idx_support_type_rates_org ON public.support_type_rates(organization_id);
CREATE INDEX IF NOT EXISTS idx_support_type_rates_type ON public.support_type_rates(support_type);

-- ============================================
-- 4. CREATE PUBLIC_HOLIDAYS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.public_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_date date NOT NULL,
  name text NOT NULL,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT public_holidays_unique UNIQUE (holiday_date, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_public_holidays_org ON public.public_holidays(organization_id);
CREATE INDEX IF NOT EXISTS idx_public_holidays_date ON public.public_holidays(holiday_date);

-- ============================================
-- 5. CREATE INVOICE_NUMBER_COUNTER TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.invoice_number_counter (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  current_sequence integer NOT NULL DEFAULT 0,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  CONSTRAINT invoice_number_counter_unique UNIQUE (year, organization_id)
);

-- ============================================
-- 6. DROP OLD INVOICE NUMBER TRIGGER AND FUNCTION
-- ============================================
DROP TRIGGER IF EXISTS trg_generate_invoice_number ON invoices;
DROP FUNCTION IF EXISTS generate_invoice_number();

-- ============================================
-- 7. CREATE next_invoice_number() FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.next_invoice_number(p_organization_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year integer;
  v_sequence integer;
BEGIN
  v_year := extract(year FROM current_date)::integer;

  -- Atomically increment (or insert) the counter for this org+year
  INSERT INTO public.invoice_number_counter (year, current_sequence, organization_id)
  VALUES (v_year, 1, p_organization_id)
  ON CONFLICT (year, organization_id)
  DO UPDATE SET current_sequence = invoice_number_counter.current_sequence + 1
  RETURNING current_sequence INTO v_sequence;

  RETURN 'INV-' || v_year::text || '-' || lpad(v_sequence::text, 3, '0');
END;
$$;

-- ============================================
-- 8. CREATE prevent_finalized_invoice_edit() TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.prevent_finalized_invoice_edit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IN ('submitted', 'paid') THEN
    RAISE EXCEPTION 'Cannot modify a finalized invoice';
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================
-- 9. CREATE TRIGGER trg_prevent_finalized_edit
-- ============================================
CREATE TRIGGER trg_prevent_finalized_edit
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_finalized_invoice_edit();

-- ============================================
-- 10. ENABLE RLS ON NEW TABLES
-- ============================================
ALTER TABLE public.support_type_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_number_counter ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 11. RLS POLICIES FOR SUPPORT_TYPE_RATES
-- ============================================
CREATE POLICY "Admin can manage rates"
  ON public.support_type_rates FOR ALL
  TO authenticated
  USING (
    is_admin_or_coordinator()
    AND organization_id = get_user_organization_id()
  )
  WITH CHECK (
    is_admin_or_coordinator()
    AND organization_id = get_user_organization_id()
  );

CREATE POLICY "All authenticated can view rates"
  ON public.support_type_rates FOR SELECT
  TO authenticated
  USING (
    organization_id = get_user_organization_id()
  );

-- ============================================
-- 12. RLS POLICIES FOR PUBLIC_HOLIDAYS
-- ============================================
CREATE POLICY "Admin can manage holidays"
  ON public.public_holidays FOR ALL
  TO authenticated
  USING (
    get_user_role() = 'admin'
    AND organization_id = get_user_organization_id()
  )
  WITH CHECK (
    get_user_role() = 'admin'
    AND organization_id = get_user_organization_id()
  );

CREATE POLICY "All authenticated can view holidays"
  ON public.public_holidays FOR SELECT
  TO authenticated
  USING (
    organization_id = get_user_organization_id()
  );

-- ============================================
-- 13. RLS POLICIES FOR INVOICE_NUMBER_COUNTER
-- ============================================
CREATE POLICY "Admin can use counter"
  ON public.invoice_number_counter FOR ALL
  TO authenticated
  USING (
    is_admin_or_coordinator()
    AND organization_id = get_user_organization_id()
  )
  WITH CHECK (
    is_admin_or_coordinator()
    AND organization_id = get_user_organization_id()
  );

-- ============================================
-- 14. UPDATED_AT TRIGGER FOR SUPPORT_TYPE_RATES
-- ============================================
CREATE TRIGGER handle_support_type_rates_updated_at
  BEFORE UPDATE ON public.support_type_rates
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- ============================================
-- 15. AUDIT TRIGGERS (if audit schema exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'audit_trigger_func'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'audit')
  ) THEN
    EXECUTE 'CREATE TRIGGER audit_support_type_rates AFTER INSERT OR UPDATE OR DELETE ON public.support_type_rates FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_func()';
    EXECUTE 'CREATE TRIGGER audit_public_holidays AFTER INSERT OR UPDATE OR DELETE ON public.public_holidays FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_func()';
  END IF;
END;
$$;
