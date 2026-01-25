'use client'

import { format, parseISO } from 'date-fns'
import { Download, X } from 'lucide-react'
import { useParticipantInvoice } from '@/hooks/use-participant-invoices'

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvoicePreviewModalProps {
  invoiceId: string | null
  onClose: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAUD(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(amount)
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Invoice preview modal showing line items and download button.
 * Displays invoice date, period, line items table, and totals.
 */
export function InvoicePreviewModal({ invoiceId, onClose }: InvoicePreviewModalProps) {
  const { data: invoice, isLoading, error } = useParticipantInvoice(invoiceId)

  // Don't render if no invoice selected
  if (!invoiceId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-auto rounded-xl bg-card p-6 shadow-lg m-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="font-heading text-xl font-bold">
            {isLoading ? 'Loading...' : invoice?.invoice_number || 'Invoice'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="animate-pulse">Loading invoice details...</div>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-destructive">
            Unable to load invoice details
          </div>
        ) : invoice ? (
          <div className="mt-4 space-y-6">
            {/* Invoice meta */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Invoice Date</p>
                <p className="font-medium">
                  {format(parseISO(invoice.invoice_date), 'd MMMM yyyy')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Period</p>
                <p className="font-medium">
                  {format(parseISO(invoice.period_start), 'd MMM')} —{' '}
                  {format(parseISO(invoice.period_end), 'd MMM yyyy')}
                </p>
              </div>
            </div>

            {/* Line items table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Service
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                      Hours
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                      Rate
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoice.line_items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">
                        No line items
                      </td>
                    </tr>
                  ) : (
                    invoice.line_items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">
                          {format(parseISO(item.service_date), 'd MMM')}
                        </td>
                        <td className="px-3 py-2">{item.support_type}</td>
                        <td className="px-3 py-2 text-right">
                          {item.quantity_hours.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right">{formatAUD(item.unit_price)}</td>
                        <td className="px-3 py-2 text-right">{formatAUD(item.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-48 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatAUD(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST (10%)</span>
                  <span>{formatAUD(invoice.gst)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-bold">
                  <span>Total</span>
                  <span>{formatAUD(invoice.total)}</span>
                </div>
              </div>
            </div>

            {/* Download button */}
            <div className="flex justify-end border-t pt-4">
              <a
                href={`/api/invoices/${invoice.id}/pdf`}
                download
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
