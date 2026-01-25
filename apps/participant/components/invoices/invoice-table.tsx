'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Download, FileText } from 'lucide-react'
import { InvoicePreviewModal } from './invoice-preview-modal'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Invoice {
  id: string
  invoice_number: string
  invoice_date: string
  total: number
  status: string
}

interface InvoiceTableProps {
  invoices: Invoice[]
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
 * Invoice list table with clickable invoice numbers and download buttons.
 * Shows empty state when no invoices exist.
 */
export function InvoiceTable({ invoices }: InvoiceTableProps) {
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null)

  // Empty state
  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 font-medium">No invoices yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your invoices will appear here once they have been finalized by your coordinator.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Invoice #
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                Total
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <button
                    onClick={() => setPreviewInvoiceId(invoice.id)}
                    className="font-medium text-primary hover:underline"
                  >
                    {invoice.invoice_number}
                  </button>
                </td>
                <td className="px-4 py-3 text-sm">
                  {format(parseISO(invoice.invoice_date), 'd MMM yyyy')}
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium">
                  {formatAUD(invoice.total)}
                </td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={`/api/invoices/${invoice.id}/pdf`}
                    download
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Download PDF"
                  >
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download</span>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InvoicePreviewModal
        invoiceId={previewInvoiceId}
        onClose={() => setPreviewInvoiceId(null)}
      />
    </>
  )
}
