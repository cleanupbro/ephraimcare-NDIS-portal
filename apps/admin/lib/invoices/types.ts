// Phase 7: Invoice domain types
// Pure type definitions -- no runtime code

// ─── Day & Status Types ─────────────────────────────────────────────────────

export type DayType = 'weekday' | 'saturday' | 'sunday' | 'public_holiday'

export type InvoiceStatus =
  | 'draft'
  | 'pending'
  | 'submitted'
  | 'paid'
  | 'overdue'
  | 'cancelled'

// ─── Support Type Rates ─────────────────────────────────────────────────────

export interface SupportTypeRate {
  id: string
  support_type: string
  ndis_item_number: string | null
  weekday_rate: number
  saturday_rate: number
  sunday_rate: number
  public_holiday_rate: number
  effective_from: string
  is_active: boolean
  organization_id: string
  created_at: string
  updated_at: string
}

// ─── Public Holidays ────────────────────────────────────────────────────────

export interface PublicHoliday {
  id: string
  holiday_date: string
  name: string
  organization_id: string
  created_by: string | null
  created_at: string
}

// ─── Invoice ────────────────────────────────────────────────────────────────

export interface Invoice {
  id: string
  invoice_number: string
  participant_id: string
  plan_id: string | null
  invoice_date: string
  due_date: string | null
  period_start: string
  period_end: string
  subtotal: number
  gst: number
  total: number
  status: InvoiceStatus
  payment_reference: string | null
  notes: string | null
  finalized_at: string | null
  finalized_by: string | null
  organization_id: string
  created_by: string | null
  created_at: string
  updated_at: string
}

// ─── Invoice Line Item ──────────────────────────────────────────────────────

export interface InvoiceLineItem {
  id: string
  invoice_id: string
  shift_id: string | null
  ndis_item_number: string
  description: string
  service_date: string
  support_type: string
  day_type: DayType
  scheduled_minutes: number
  actual_minutes: number
  billable_minutes: number
  quantity: number
  unit_price: number
  line_total: number
  created_at: string
}

// ─── Composite Types ────────────────────────────────────────────────────────

export type InvoiceWithLineItems = Invoice & {
  line_items: InvoiceLineItem[]
}

export type InvoiceWithParticipant = Invoice & {
  participants: {
    first_name: string
    last_name: string
    ndis_number: string
  } | null
}

// ─── Generation Payloads ────────────────────────────────────────────────────

export interface GenerateInvoicePayload {
  participant_id: string
  period_start: string
  period_end: string
}

export interface InvoiceGenerationResult {
  invoice: Invoice
  line_items: InvoiceLineItem[]
}
