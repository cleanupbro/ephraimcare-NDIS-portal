-- Participant Goals Schema
-- For care planning and progress monitoring

-- Goal categories aligned with NDIS domains
CREATE TYPE goal_category AS ENUM (
  'daily_living',
  'community',
  'employment',
  'relationships',
  'health',
  'learning',
  'other'
);

CREATE TYPE goal_status AS ENUM (
  'active',
  'achieved',
  'discontinued'
);

-- Participant goals table
CREATE TABLE IF NOT EXISTS participant_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  title text NOT NULL,
  description text,
  target_date date,
  status goal_status DEFAULT 'active',
  category goal_category DEFAULT 'other',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  achieved_at timestamptz,
  discontinued_at timestamptz,
  discontinued_reason text
);

-- Goal progress notes table
CREATE TABLE IF NOT EXISTS goal_progress_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES participant_goals(id) ON DELETE CASCADE NOT NULL,
  shift_id uuid REFERENCES shifts(id),
  worker_id uuid REFERENCES workers(id),
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  note text NOT NULL,
  progress_rating integer CHECK (progress_rating BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- RLS policies
ALTER TABLE participant_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_progress_notes ENABLE ROW LEVEL SECURITY;

-- Goals: Org members can view, admin/coordinator can manage
CREATE POLICY "org_members_view_goals" ON participant_goals
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id() OR is_platform_admin());

CREATE POLICY "admin_coordinator_insert_goals" ON participant_goals
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND is_admin_or_coordinator()
  );

CREATE POLICY "admin_coordinator_update_goals" ON participant_goals
  FOR UPDATE TO authenticated
  USING (
    organization_id = get_user_organization_id()
    AND is_admin_or_coordinator()
  );

CREATE POLICY "admin_coordinator_delete_goals" ON participant_goals
  FOR DELETE TO authenticated
  USING (
    organization_id = get_user_organization_id()
    AND is_admin_or_coordinator()
  );

-- Progress notes: Org members can view, workers can add their own
CREATE POLICY "org_members_view_progress" ON goal_progress_notes
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id() OR is_platform_admin());

CREATE POLICY "workers_add_progress" ON goal_progress_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND (
      -- Worker adding their own note
      worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid())
      -- Or admin/coordinator adding note
      OR is_admin_or_coordinator()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_goals_participant ON participant_goals(participant_id);
CREATE INDEX IF NOT EXISTS idx_goals_org_status ON participant_goals(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_progress_goal ON goal_progress_notes(goal_id);
CREATE INDEX IF NOT EXISTS idx_progress_shift ON goal_progress_notes(shift_id);

-- Trigger for updated_at
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON participant_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE participant_goals IS 'Care goals for NDIS participants';
COMMENT ON TABLE goal_progress_notes IS 'Progress notes linked to goals and shifts';
COMMENT ON COLUMN goal_progress_notes.progress_rating IS '1=No progress, 5=Excellent progress';
