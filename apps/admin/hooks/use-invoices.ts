'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'
import type {
  Invoice,
  InvoiceLineItem,
  InvoiceWithLineItems,
  InvoiceWithParticipant,
  InvoiceStatus,
} from '@/lib/invoices/types'
import type { GenerateInvoiceInput } from '@/lib/invoices/schemas'

// ─── Fetch All Invoices ──────────────────────────────────────────────────────

interface UseInvoicesOptions {
  status?: InvoiceStatus | 'all'
}

export function useInvoices({ status = 'all' }: UseInvoicesOptions = {}) {
  return useQuery<InvoiceWithParticipant[]>({
    queryKey: ['invoices', { status }],
    queryFn: async () => {
      const supabase = createClient()

      let query = (supabase
        .from('invoices')
        .select('*, participants(first_name, last_name, ndis_number)')
        .order('invoice_date', { ascending: false }) as any)

      // Status filter
      if (status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error
      return (data ?? []) as InvoiceWithParticipant[]
    },
    staleTime: 30 * 1000,
  })
}

// ─── Fetch Single Invoice with Line Items ────────────────────────────────────

export function useInvoice(id: string | undefined) {
  return useQuery<InvoiceWithLineItems & { participants: { first_name: string; last_name: string; ndis_number: string } | null }>({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const supabase = createClient()

      // Fetch invoice with participant
      const { data: invoice, error: invoiceError } = await (supabase
        .from('invoices')
        .select('*, participants(first_name, last_name, ndis_number)')
        .eq('id', id!)
        .single() as any)

      if (invoiceError) throw invoiceError

      // Fetch line items
      const { data: lineItems, error: lineItemsError } = await (supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', id!)
        .order('service_date', { ascending: true }) as any)

      if (lineItemsError) throw lineItemsError

      return {
        ...invoice,
        line_items: lineItems ?? [],
      } as InvoiceWithLineItems & { participants: { first_name: string; last_name: string; ndis_number: string } | null }
    },
    enabled: !!id,
  })
}

// ─── Generate Invoice ────────────────────────────────────────────────────────

export function useGenerateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      data: GenerateInvoiceInput
    ): Promise<{ invoice: Invoice; line_items: InvoiceLineItem[] }> => {
      const response = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate invoice')
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast({
        title: 'Invoice generated',
        description: 'Invoice has been created successfully.',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to generate invoice',
        description: error.message,
        variant: 'error',
      })
    },
  })
}

// ─── Finalize Invoice ────────────────────────────────────────────────────────

export function useFinalizeInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await fetch(`/api/invoices/${invoiceId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to finalize invoice')
      }

      return response.json()
    },
    onSuccess: (_data, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
      toast({
        title: 'Invoice finalized',
        description: 'The invoice has been finalized and is now locked for editing.',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to finalize invoice',
        description: error.message,
        variant: 'error',
      })
    },
  })
}

// ─── Delete Draft Invoice ────────────────────────────────────────────────────

export function useDeleteInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const supabase = createClient()

      // Delete line items first (foreign key constraint)
      const { error: lineItemsError } = await (supabase
        .from('invoice_line_items') as any)
        .delete()
        .eq('invoice_id', invoiceId)

      if (lineItemsError) throw lineItemsError

      // Delete invoice
      const { error: invoiceError } = await (supabase
        .from('invoices') as any)
        .delete()
        .eq('id', invoiceId)
        .eq('status', 'draft') // Only allow deleting drafts

      if (invoiceError) throw invoiceError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast({
        title: 'Invoice deleted',
        description: 'The draft invoice has been deleted.',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete invoice',
        description: error.message,
        variant: 'error',
      })
    },
  })
}
