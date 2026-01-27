-- Shift Photos Schema
-- For storing evidence photos taken during shifts

CREATE TABLE IF NOT EXISTS shift_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id) ON DELETE CASCADE NOT NULL,
  worker_id uuid REFERENCES workers(id) NOT NULL,
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  storage_path text NOT NULL,
  storage_url text,
  caption text,
  taken_at timestamptz NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  file_size_bytes integer,
  mime_type text DEFAULT 'image/jpeg',
  latitude numeric(10, 8),
  longitude numeric(11, 8)
);

-- RLS policies
ALTER TABLE shift_photos ENABLE ROW LEVEL SECURITY;

-- Org members can view shift photos
CREATE POLICY "org_members_view_shift_photos"
  ON shift_photos FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id() OR is_platform_admin());

-- Workers can insert their own photos
CREATE POLICY "workers_insert_shift_photos"
  ON shift_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid())
  );

-- Workers can delete their own photos (before shift finalized)
CREATE POLICY "workers_delete_own_photos"
  ON shift_photos FOR DELETE
  TO authenticated
  USING (
    worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM shifts
      WHERE shifts.id = shift_photos.shift_id
      AND shifts.status NOT IN ('completed', 'invoiced')
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shift_photos_shift ON shift_photos(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_photos_worker ON shift_photos(worker_id);

-- Storage bucket policy (run in Supabase dashboard or via SQL)
-- Create bucket: shift-photos
-- Policy: Authenticated users can upload to their org folder

COMMENT ON TABLE shift_photos IS 'Photos captured during shifts for documentation';
COMMENT ON COLUMN shift_photos.storage_path IS 'Path in Supabase Storage bucket';
