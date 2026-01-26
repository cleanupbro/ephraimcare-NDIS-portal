'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, parseISO } from 'date-fns'
import type { DateRangeFilter, RevenueReportRow } from '@/lib/reports/types'

// ─── Support Type Breakdown Types ────────────────────────────────────────────

export interface SupportTypeBreakdown {
  supportType: string
  revenue: number
  percentage: number
  invoiceCount: number
}

export interface RevenueReportData {
  rows: RevenueReportRow[]
  supportTypeBreakdown: SupportTypeBreakdown[]
  totals: {
    totalRevenue: number
    totalSubtotal: number
    totalGst: number
    totalInvoices: number
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useRevenueReport(dateRange: DateRangeFilter) {
  return useQuery<RevenueReportData>({
    queryKey: ['revenue-report', dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      const supabase = createClient()

      // Generate all months in range (for showing $0 months)
      const monthsInRange = eachMonthOfInterval({
        start: startOfMonth(dateRange.from),
        end: endOfMonth(dateRange.to),
      })

      // Fetch all finalized invoices in date range (excluding drafts)
      const { data: invoices, error } = await (supabase
        .from('invoices')
        .select('id, invoice_date, subtotal, gst, total, status')
        .gte('invoice_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('invoice_date', format(dateRange.to, 'yyyy-MM-dd'))
        .neq('status', 'draft')
        .neq('status', 'cancelled')
        .order('invoice_date', { ascending: true }) as any)

      if (error) throw error

      // Fetch line items for support type breakdown
      const invoiceIds = (invoices ?? []).map((inv: { id: string }) => inv.id)

      let lineItems: { invoice_id: string; support_type: string; line_total: number }[] = []
      if (invoiceIds.length > 0) {
        const { data: items, error: itemsError } = await (supabase
          .from('invoice_line_items')
          .select('invoice_id, support_type, line_total')
          .in('invoice_id', invoiceIds) as any)

        if (itemsError) throw itemsError
        lineItems = items ?? []
      }

      // Aggregate invoices by month
      const monthlyMap = new Map<string, {
        invoiceCount: number
        totalRevenue: number
        subtotal: number
        gst: number
      }>()

      // Initialize all months with zeros
      for (const month of monthsInRange) {
        const key = format(month, 'yyyy-MM')
        monthlyMap.set(key, {
          invoiceCount: 0,
          totalRevenue: 0,
          subtotal: 0,
          gst: 0,
        })
      }

      // Accumulate invoice data
      for (const invoice of invoices ?? []) {
        const monthKey = format(parseISO(invoice.invoice_date), 'yyyy-MM')
        const existing = monthlyMap.get(monthKey)
        if (existing) {
          existing.invoiceCount += 1
          existing.totalRevenue += Number(invoice.total) || 0
          existing.subtotal += Number(invoice.subtotal) || 0
          existing.gst += Number(invoice.gst) || 0
        }
      }

      // Build report rows
      const rows: RevenueReportRow[] = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        invoiceCount: data.invoiceCount,
        totalRevenue: data.totalRevenue,
        subtotal: data.subtotal,
        gst: data.gst,
      }))

      // Calculate support type breakdown
      const supportTypeMap = new Map<string, { revenue: number; invoiceIds: Set<string> }>()

      for (const item of lineItems) {
        const supportType = item.support_type || 'Unspecified'
        const existing = supportTypeMap.get(supportType) || { revenue: 0, invoiceIds: new Set<string>() }
        existing.revenue += Number(item.line_total) || 0
        existing.invoiceIds.add(item.invoice_id)
        supportTypeMap.set(supportType, existing)
      }

      // Calculate totals
      const totalRevenue = rows.reduce((sum, r) => sum + r.totalRevenue, 0)
      const totalSubtotal = rows.reduce((sum, r) => sum + r.subtotal, 0)
      const totalGst = rows.reduce((sum, r) => sum + r.gst, 0)
      const totalInvoices = rows.reduce((sum, r) => sum + r.invoiceCount, 0)

      // Build support type breakdown with percentages
      const supportTypeBreakdown: SupportTypeBreakdown[] = Array.from(supportTypeMap.entries())
        .map(([supportType, data]) => ({
          supportType,
          revenue: data.revenue,
          percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
          invoiceCount: data.invoiceIds.size,
        }))
        .sort((a, b) => b.revenue - a.revenue) // Sort by revenue descending

      return {
        rows,
        supportTypeBreakdown,
        totals: {
          totalRevenue,
          totalSubtotal,
          totalGst,
          totalInvoices,
        },
      }
    },
    staleTime: 60 * 1000, // 1 minute
  })
}
