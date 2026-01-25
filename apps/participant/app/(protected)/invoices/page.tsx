'use client'

import { useParticipantInvoices } from '@/hooks/use-participant-invoices'
import { InvoiceTable } from '@/components/invoices/invoice-table'

/**
 * Invoices page for participant portal.
 * Shows a chronological list of finalized invoices with preview and download.
 */
export default function InvoicesPage() {
  const { data: invoices, isLoading, error } = useParticipantInvoices()

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-heading text-2xl font-bold">Invoices</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and download your finalized invoices
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-12 rounded-lg bg-muted" />
          <div className="h-12 rounded-lg bg-muted" />
          <div className="h-12 rounded-lg bg-muted" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          Unable to load invoices. Please try refreshing the page.
        </div>
      ) : (
        <InvoiceTable invoices={invoices || []} />
      )}

      {/* OpBros footer */}
      <footer className="pt-8 border-t border-border text-center text-xs text-muted-foreground">
        Powered by{' '}
        <a
          href="https://opbros.online"
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary hover:underline"
        >
          OpBros
        </a>
      </footer>
    </div>
  )
}
