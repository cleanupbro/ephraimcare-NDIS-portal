-- ============================================================================
-- Phase 11: Incidents and Compliance
-- ============================================================================

-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  reported_by UUID NOT NULL REFERENCES profiles(id),

  -- Core fields
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  actions_taken TEXT,
  location TEXT,

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'closed')),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES profiles(id),

  -- NDIA reporting
  requires_ndia_report BOOLEAN DEFAULT FALSE,
  ndia_reported_at TIMESTAMPTZ,
  ndia_reference_number TEXT,
  ndia_reported_by UUID REFERENCES profiles(id),

  -- Timestamps
  incident_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shift cancellation requests
CREATE TABLE IF NOT EXISTS shift_cancellation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_incidents_organization ON incidents(organization_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_requires_ndia ON incidents(requires_ndia_report) WHERE requires_ndia_report = TRUE AND ndia_reported_at IS NULL;
CREATE INDEX idx_cancellation_requests_status ON shift_cancellation_requests(status);
CREATE INDEX idx_cancellation_requests_shift ON shift_cancellation_requests(shift_id);

-- RLS policies
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_cancellation_requests ENABLE ROW LEVEL SECURITY;

-- Incidents: org isolation for admin/coordinator
CREATE POLICY "incidents_org_isolation" ON incidents
  FOR ALL USING (organization_id = get_user_organization_id());

-- Cancellation requests: org isolation for admin
CREATE POLICY "cancellation_requests_org_isolation" ON shift_cancellation_requests
  FOR ALL USING (organization_id = get_user_organization_id());

-- Updated_at trigger for incidents
CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
