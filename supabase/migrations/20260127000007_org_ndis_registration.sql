-- Add NDIS registration number to organizations
-- Phase 13-12: NDIA PACE CSV Export

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS ndis_registration_number text;

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_org_ndis_reg ON organizations(ndis_registration_number)
WHERE ndis_registration_number IS NOT NULL;

COMMENT ON COLUMN organizations.ndis_registration_number IS 'NDIS provider registration number for PACE claims';
