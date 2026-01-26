-- Xero invoice tracking for reconciliation
-- Migration: 20260127000004_xero_invoice_tracking.sql

-- Add Xero tracking columns to invoices
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS xero_invoice_id text,
ADD COLUMN IF NOT EXISTS xero_sync_status text DEFAULT 'pending'
  CHECK (xero_sync_status IN ('pending', 'synced', 'failed', 'not_applicable')),
ADD COLUMN IF NOT EXISTS xero_sync_error text,
ADD COLUMN IF NOT EXISTS xero_synced_at timestamptz;

-- Contact mapping for participants to Xero contacts
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS xero_contact_mapping jsonb DEFAULT '{}'::jsonb;

-- Index for finding unsynced invoices
CREATE INDEX IF NOT EXISTS idx_invoices_xero_sync
  ON invoices (organization_id, xero_sync_status)
  WHERE xero_sync_status = 'pending';

-- Comments for documentation
COMMENT ON COLUMN invoices.xero_invoice_id IS 'Xero invoice ID for reconciliation';
COMMENT ON COLUMN invoices.xero_sync_status IS 'Status of Xero sync: pending, synced, failed, not_applicable';
COMMENT ON COLUMN invoices.xero_sync_error IS 'Error message if Xero sync failed';
COMMENT ON COLUMN invoices.xero_synced_at IS 'Timestamp when invoice was synced to Xero';
COMMENT ON COLUMN organizations.xero_contact_mapping IS 'Cache mapping participant IDs to Xero contact IDs';
