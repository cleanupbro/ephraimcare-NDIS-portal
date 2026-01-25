'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Invoice list item (no line items needed for list view)
 */
export interface InvoiceListItem {
  id: string
  invoice_number: string
  invoice_date: string
  total: number
  status: string
}

/**
 * Full invoice with line items for preview modal
 */
export interface InvoiceWithLineItems {
  id: string
  invoice_number: string
  invoice_date: string
  period_start: string
  period_end: string
  subtotal: number
  gst: number
  total: number
  status: string
  line_items: Array<{
    id: string
    service_date: string
    description: string
    support_type: string
    quantity_hours: number
    unit_price: number
    total: number
  }>
}

// ─── Fetch Invoice List ───────────────────────────────────────────────────────

/**
 * Fetch all finalized invoices for the authenticated participant.
 * RLS enforces that only invoices where participant_id matches the
 * current user's linked participant record are returned.
 *
 * Excludes draft invoices - participants only see finalized invoices.
 */
export function useParticipantInvoices() {
  return useQuery<InvoiceListItem[]>({
    queryKey: ['participant-invoices'],
    queryFn: async () => {
      const supabase = createClient()

      // RLS filters to only this participant's invoices
      // Only show non-draft invoices (submitted, paid, overdue)
      const { data, error } = await (supabase
        .from('invoices')
        .select('id, invoice_number, invoice_date, total, status')
        .neq('status', 'draft')
        .order('invoice_date', { ascending: false }) as any)

      if (error) throw error
      return data ?? []
    },
    staleTime: 60 * 1000, // 1 minute
  })
}

// ─── Fetch Single Invoice with Line Items ─────────────────────────────────────

/**
 * Fetch single invoice with line items for preview modal.
 * RLS enforces participant scope - only their own invoices.
 */
export function useParticipantInvoice(invoiceId: string | null) {
  return useQuery<InvoiceWithLineItems>({
    queryKey: ['participant-invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) throw new Error('No invoice ID')

      const supabase = createClient()

      // Fetch invoice (RLS enforces participant scope)
      const { data: invoice, error: invoiceError } = await (supabase
        .from('invoices')
        .select('id, invoice_number, invoice_date, period_start, period_end, subtotal, gst, total, status')
        .eq('id', invoiceId)
        .neq('status', 'draft')
        .single() as any)

      if (invoiceError) throw invoiceError

      // Fetch line items
      const { data: lineItems, error: lineItemsError } = await (supabase
        .from('invoice_line_items')
        .select('id, service_date, description, support_type, billable_minutes, unit_price, line_total')
        .eq('invoice_id', invoiceId)
        .order('service_date', { ascending: true }) as any)

      if (lineItemsError) throw lineItemsError

      // Transform line items to match component interface (hours instead of minutes)
      const transformedLineItems = (lineItems ?? []).map((item: any) => ({
        id: item.id,
        service_date: item.service_date,
        description: item.description,
        support_type: item.support_type,
        quantity_hours: item.billable_minutes / 60,
        unit_price: item.unit_price,
        total: item.line_total,
      }))

      return {
        ...invoice,
        line_items: transformedLineItems,
      }
    },
    enabled: !!invoiceId,
    staleTime: 5 * 60 * 1000, // 5 minutes - invoice data doesn't change
  })
}
