-- ============================================
-- MULTI-ORG FOUNDATION MIGRATION
-- Phase 13: Scale Features - Platform Admin Support
-- ============================================

-- ============================================
-- STEP 1: Create organizations table (was previously implicit UUID only)
-- ============================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  abn text,
  settings jsonb DEFAULT '{
    "sms_enabled": false,
    "xero_connected": false,
    "ndia_registered": false
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert the existing organization from seed data
INSERT INTO public.organizations (id, name)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Ephraim Care')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Audit trail for organizations
CREATE TRIGGER audit_organizations
  AFTER INSERT OR UPDATE OR DELETE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_func();

-- Auto-update updated_at
CREATE TRIGGER handle_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- ============================================
-- STEP 2: Add is_platform_admin column to profiles
-- ============================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_platform_admin boolean DEFAULT false;

-- ============================================
-- STEP 3: Add reminder tracking columns to shifts (for SMS feature)
-- ============================================
ALTER TABLE shifts
ADD COLUMN IF NOT EXISTS reminder_24h_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_2h_sent boolean DEFAULT false;

-- ============================================
-- STEP 4: Create is_platform_admin() helper function
-- ============================================
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT is_platform_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- ============================================
-- STEP 5: RLS Policies for organizations table
-- ============================================

-- Users can view their own organization
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (id = get_user_organization_id());

-- Platform admin can view all organizations
CREATE POLICY "Platform admin can view all organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (is_platform_admin());

-- Platform admin can manage all organizations
CREATE POLICY "Platform admin can manage organizations"
  ON organizations FOR ALL
  TO authenticated
  USING (is_platform_admin());

-- ============================================
-- STEP 6: Update existing RLS policies to allow platform admin read access
-- Using DROP IF EXISTS + CREATE pattern for safe updates
-- ============================================

-- PARTICIPANTS: Platform admin read access
DROP POLICY IF EXISTS "Org members can view participants" ON participants;
CREATE POLICY "Org members can view participants"
  ON participants FOR SELECT
  TO authenticated
  USING (
    organization_id = get_user_organization_id()
    OR is_platform_admin()
  );

-- WORKERS: Platform admin read access
DROP POLICY IF EXISTS "Org members can view workers" ON workers;
CREATE POLICY "Org members can view workers"
  ON workers FOR SELECT
  TO authenticated
  USING (
    organization_id = get_user_organization_id()
    OR is_platform_admin()
  );

-- SHIFTS: Platform admin read access (update admin/coordinator policy)
DROP POLICY IF EXISTS "Admin/coordinator can manage shifts" ON shifts;
CREATE POLICY "Admin/coordinator can manage shifts"
  ON shifts FOR ALL
  TO authenticated
  USING (
    (is_admin_or_coordinator() AND organization_id = get_user_organization_id())
    OR is_platform_admin()
  );

-- INVOICES: Platform admin read access (update admin/coordinator policy)
DROP POLICY IF EXISTS "Admin/coordinator can manage invoices" ON invoices;
CREATE POLICY "Admin/coordinator can manage invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (
    (is_admin_or_coordinator() AND organization_id = get_user_organization_id())
    OR is_platform_admin()
  );

-- PROFILES: Platform admin read access
DROP POLICY IF EXISTS "Admin/coordinator can view org profiles" ON profiles;
CREATE POLICY "Admin/coordinator can view org profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (is_admin_or_coordinator() AND organization_id = get_user_organization_id())
    OR is_platform_admin()
  );

-- ============================================
-- STEP 7: Index for platform admin queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_platform_admin
  ON profiles(is_platform_admin)
  WHERE is_platform_admin = true;

-- ============================================
-- STEP 8: Grant permissions
-- ============================================
GRANT SELECT ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
