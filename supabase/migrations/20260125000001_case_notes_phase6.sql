-- Phase 6: Case Notes Enhancement
-- Adds concern flag columns, admin comments table, RLS updates, and notification trigger

-- ============================================
-- 1. ADD COLUMNS TO CASE_NOTES
-- ============================================
ALTER TABLE public.case_notes ADD COLUMN IF NOT EXISTS concern_flag boolean DEFAULT false;
ALTER TABLE public.case_notes ADD COLUMN IF NOT EXISTS concern_text text;
ALTER TABLE public.case_notes ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE public.case_notes ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES profiles(id);

-- ============================================
-- 2. UNIQUE CONSTRAINT (one note per shift per worker)
-- ============================================
ALTER TABLE public.case_notes ADD CONSTRAINT case_notes_shift_worker_unique UNIQUE (shift_id, worker_id);

-- ============================================
-- 3. DROP PARTICIPANT VISIBILITY POLICY
-- ============================================
DROP POLICY IF EXISTS "Participants can view their own case notes (not drafts)" ON case_notes;

-- ============================================
-- 4. DROP OLD WORKER UPDATE POLICY
-- ============================================
DROP POLICY IF EXISTS "Workers can update their own drafts" ON case_notes;

-- ============================================
-- 5. CREATE NEW WORKER UPDATE POLICY (24-hour window)
-- ============================================
CREATE POLICY "Workers can update their own notes within 24h"
  ON case_notes FOR UPDATE
  TO authenticated
  USING (
    worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid())
    AND organization_id = get_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM shift_check_ins sci
      WHERE sci.shift_id = case_notes.shift_id
      AND sci.check_out_time > now() - interval '24 hours'
    )
  );

-- ============================================
-- 6. UPDATE WORKER INSERT POLICY (24-hour window)
-- ============================================
DROP POLICY IF EXISTS "Workers can insert case notes" ON case_notes;

CREATE POLICY "Workers can insert case notes within 24h"
  ON case_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid())
    AND organization_id = get_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM shift_check_ins sci
      WHERE sci.shift_id = case_notes.shift_id
      AND sci.check_out_time > now() - interval '24 hours'
    )
  );

-- ============================================
-- 7. ADMIN COMMENTS TABLE (separate for RLS isolation)
-- ============================================
CREATE TABLE public.case_note_admin_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_note_id uuid NOT NULL REFERENCES case_notes(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES profiles(id),
  comment text NOT NULL,
  organization_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_admin_comments_note ON case_note_admin_comments(case_note_id);

ALTER TABLE case_note_admin_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/coordinator can manage admin comments"
  ON case_note_admin_comments FOR ALL
  TO authenticated
  USING (
    is_admin_or_coordinator()
    AND organization_id = get_user_organization_id()
  );

-- ============================================
-- 8. CONCERN NOTIFICATION TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_concern_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.concern_flag = true THEN
    INSERT INTO public.notifications (recipient_id, type, title, body, data, sent_at)
    SELECT p.id, 'case_note_added', 'Concern Flagged',
      'A worker flagged a concern for ' ||
        (SELECT first_name || ' ' || last_name FROM participants WHERE id = NEW.participant_id),
      jsonb_build_object('case_note_id', NEW.id, 'participant_id', NEW.participant_id, 'shift_id', NEW.shift_id),
      now()
    FROM profiles p
    WHERE p.organization_id = NEW.organization_id
      AND p.role = 'admin';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER case_note_concern_notification
  AFTER INSERT ON public.case_notes
  FOR EACH ROW
  WHEN (NEW.concern_flag = true)
  EXECUTE FUNCTION public.notify_concern_flag();
