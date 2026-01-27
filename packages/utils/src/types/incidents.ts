// ─── Incident Types ──────────────────────────────────────────────────────────

export interface Incident {
  id: string
  organization_id: string
  participant_id: string | null
  worker_id: string | null
  shift_id: string | null
  reported_by: string
  incident_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  actions_taken: string | null
  location: string | null
  status: 'open' | 'in_review' | 'closed'
  closed_at: string | null
  closed_by: string | null
  requires_ndia_report: boolean
  ndia_reported_at: string | null
  ndia_reference_number: string | null
  ndia_reported_by: string | null
  incident_date: string
  created_at: string
  updated_at: string
}

export interface IncidentWithRelations extends Incident {
  participants?: { first_name: string; last_name: string } | null
  workers?: { profiles: { first_name: string; last_name: string } | null } | null
  reporter?: { first_name: string; last_name: string } | null
}

// ─── Cancellation Request Types ──────────────────────────────────────────────

export interface ShiftCancellationRequest {
  id: string
  organization_id: string
  shift_id: string
  participant_id: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  reviewed_at: string | null
  admin_notes: string | null
  created_at: string
}

export interface CancellationRequestWithRelations extends ShiftCancellationRequest {
  shifts?: {
    scheduled_start: string
    scheduled_end: string
    workers?: { profiles: { first_name: string; last_name: string } | null } | null
  } | null
  participants?: { first_name: string; last_name: string } | null
}
