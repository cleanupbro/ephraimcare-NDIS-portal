// Domain types derived from database schema

export type AppRole = 'admin' | 'coordinator' | 'worker' | 'participant'

export type ShiftStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type InvoiceStatus =
  | 'draft'
  | 'pending'
  | 'submitted'
  | 'paid'
  | 'overdue'
  | 'cancelled'

export type ServiceAgreementStatus = 'draft' | 'active' | 'expired' | 'cancelled'

export type NotificationType =
  | 'shift_assigned'
  | 'shift_cancelled'
  | 'shift_reminder'
  | 'invoice_finalised'
  | 'case_note_added'
  | 'plan_expiring'

export interface Profile {
  id: string
  role: AppRole
  first_name: string
  last_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  organization_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Participant {
  id: string
  profile_id: string | null
  ndis_number: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  phone: string | null
  email: string | null
  address_line_1: string | null
  address_line_2: string | null
  suburb: string | null
  state: string
  postcode: string | null
  latitude: number | null
  longitude: number | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  notes: string | null
  organization_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Worker {
  id: string
  profile_id: string
  employee_id: string | null
  qualification: string[]
  services_provided: string[]
  hourly_rate: number | null
  max_hours_per_week: number
  organization_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Shift {
  id: string
  participant_id: string
  worker_id: string
  service_agreement_item_id: string | null
  scheduled_start: string
  scheduled_end: string
  actual_start: string | null
  actual_end: string | null
  status: ShiftStatus
  check_in_latitude: number | null
  check_in_longitude: number | null
  check_out_latitude: number | null
  check_out_longitude: number | null
  cancellation_reason: string | null
  notes: string | null
  organization_id: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CaseNote {
  id: string
  shift_id: string | null
  participant_id: string
  worker_id: string
  note_date: string
  content: string
  goals_addressed: string[]
  participant_response: string | null
  follow_up_required: boolean
  follow_up_notes: string | null
  is_draft: boolean
  attachments: string[]
  organization_id: string
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  invoice_number: string
  participant_id: string
  plan_id: string | null
  invoice_date: string
  due_date: string | null
  subtotal: number
  gst: number
  total: number
  status: InvoiceStatus
  payment_reference: string | null
  notes: string | null
  organization_id: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface InvoiceLineItem {
  id: string
  invoice_id: string
  shift_id: string | null
  ndis_item_number: string
  description: string
  service_date: string
  quantity: number
  unit_price: number
  line_total: number
  created_at: string
}

export interface NdisPlan {
  id: string
  participant_id: string
  plan_number: string | null
  start_date: string
  end_date: string
  total_budget: number
  is_current: boolean
  organization_id: string
  created_at: string
  updated_at: string
}

export interface PlanBudget {
  id: string
  plan_id: string
  category: string
  subcategory: string | null
  allocated_amount: number
  used_amount: number
  created_at: string
  updated_at: string
}

export interface ServiceAgreement {
  id: string
  participant_id: string
  plan_id: string
  start_date: string
  end_date: string
  status: ServiceAgreementStatus
  document_url: string | null
  notes: string | null
  organization_id: string
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  recipient_id: string
  type: NotificationType
  title: string
  body: string | null
  data: Record<string, unknown> | null
  is_read: boolean
  sent_at: string
  read_at: string | null
}
