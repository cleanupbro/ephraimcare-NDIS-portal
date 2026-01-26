-- ============================================
-- ORGANIZATION CREDENTIALS MIGRATION
-- Phase 13: Scale Features - Integration Settings
-- ============================================

-- ============================================
-- STEP 1: Add integration credential columns to organizations
-- Stored separately from settings for future column-level encryption
-- ============================================

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS twilio_account_sid text,
ADD COLUMN IF NOT EXISTS twilio_auth_token text,
ADD COLUMN IF NOT EXISTS twilio_phone_number text,
ADD COLUMN IF NOT EXISTS xero_client_id text,
ADD COLUMN IF NOT EXISTS xero_client_secret text,
ADD COLUMN IF NOT EXISTS xero_tenant_id text,
ADD COLUMN IF NOT EXISTS xero_token_set jsonb;

-- ============================================
-- STEP 2: Add SMS notification preferences to profiles
-- ============================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS sms_notifications_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS phone text;

-- ============================================
-- STEP 3: Create SMS audit log table
-- ============================================

CREATE TABLE IF NOT EXISTS sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  to_phone text NOT NULL,
  message_body text NOT NULL,
  twilio_sid text,
  status text DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
  error_message text,
  related_shift_id uuid REFERENCES shifts(id),
  related_worker_id uuid REFERENCES workers(id),
  related_participant_id uuid REFERENCES participants(id),
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- STEP 4: Enable RLS on sms_logs
-- ============================================

ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Org members can view SMS logs for their organization
CREATE POLICY "org_members_view_sms_logs"
  ON sms_logs FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id() OR is_platform_admin());

-- System can insert SMS logs
CREATE POLICY "system_insert_sms_logs"
  ON sms_logs FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

-- ============================================
-- STEP 5: Add policy for organization admin to update credentials
-- ============================================

-- Drop existing restrictive policy and create one that allows admin to update
DROP POLICY IF EXISTS "Admin can update own organization" ON organizations;
CREATE POLICY "Admin can update own organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (id = get_user_organization_id() AND is_admin_or_coordinator())
  WITH CHECK (id = get_user_organization_id() AND is_admin_or_coordinator());

-- ============================================
-- STEP 6: Indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sms_logs_org_created
  ON sms_logs (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_logs_status
  ON sms_logs (status)
  WHERE status IN ('queued', 'sent');

-- ============================================
-- STEP 7: Audit trail for sms_logs
-- ============================================

CREATE TRIGGER audit_sms_logs
  AFTER INSERT OR UPDATE OR DELETE ON public.sms_logs
  FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_func();

-- ============================================
-- STEP 8: Grant permissions
-- ============================================

GRANT SELECT ON public.sms_logs TO authenticated;
GRANT INSERT ON public.sms_logs TO authenticated;
GRANT ALL ON public.sms_logs TO service_role;
