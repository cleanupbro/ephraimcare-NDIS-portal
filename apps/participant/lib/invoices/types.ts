// Phase 8: Invoice types for participant portal
// Subset of admin invoice types needed for PDF rendering

// ─── Day Type ───────────────────────────────────────────────────────────────────

export type DayType = 'weekday' | 'saturday' | 'sunday' | 'public_holiday'

// ─── Invoice Line Item ──────────────────────────────────────────────────────────

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

// ─── Invoice with Line Items ────────────────────────────────────────────────────

export interface InvoiceWithLineItems {
  id: string
  invoice_number: string
  invoice_date: string
  period_start: string
  period_end: string
  due_date: string | null
  subtotal: number
  gst: number
  total: number
  status: string
  notes: string | null
  line_items: InvoiceLineItem[]
}
