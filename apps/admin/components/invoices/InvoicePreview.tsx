'use client'

import { format } from 'date-fns'
import { Lock } from 'lucide-react'
import { Badge, Card, Separator } from '@ephraimcare/ui'
import { EPHRAIM_CARE_DETAILS, INVOICE_STATUS_COLORS, type InvoiceStatusKey } from '@/lib/invoices/constants'
import { formatCurrency } from '@/lib/invoices/calculations'
import { LineItemsTable } from './LineItemsTable'
import type { InvoiceWithLineItems } from '@/lib/invoices/types'

interface InvoicePreviewProps {
  invoice: InvoiceWithLineItems & {
    participants: {
      first_name: string
      last_name: string
      ndis_number: string
    } | null
  }
}

// Safely format a date string from Postgres (YYYY-MM-DD or ISO) without UTC shift issues
function safeFormatDate(dateStr: string | null | undefined, fmt: string): string {
  if (!dateStr) return '—'
  try {
    // Use T00:00:00 to parse as local midnight, not UTC midnight
    const dateOnly = dateStr.split('T')[0].split(' ')[0]
    const date = new Date(dateOnly + 'T00:00:00')
    if (isNaN(date.getTime())) return '—'
    return format(date, fmt)
  } catch {
    return '—'
  }
}

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const isDraft = invoice.status === 'draft'
  const isFinalized = invoice.status === 'submitted' || invoice.status === 'paid'
  const statusConfig = INVOICE_STATUS_COLORS[invoice.status as InvoiceStatusKey] ?? INVOICE_STATUS_COLORS.draft

  return (
    <Card className="relative overflow-hidden bg-white shadow-lg">
      {/* Draft watermark */}
      {isDraft && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="select-none text-[120px] font-bold text-gray-100/40 rotate-[-30deg]">
            DRAFT
          </span>
        </div>
      )}

      <div className="relative p-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">INVOICE</h1>
            <div className="mt-2 flex items-center gap-3">
              <Badge className={statusConfig.badge}>
                {isFinalized && <Lock className="mr-1 h-3 w-3" />}
                {statusConfig.text}
              </Badge>
              {isFinalized && invoice.finalized_at && (
                <span className="text-xs text-muted-foreground">
                  Finalized {safeFormatDate(invoice.finalized_at, 'dd/MM/yyyy')}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-2xl font-bold text-gray-800">
              {invoice.invoice_number}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Date: {safeFormatDate(invoice.invoice_date, 'dd MMMM yyyy')}
            </p>
            <p className="text-sm text-muted-foreground">
              Period: {safeFormatDate(invoice.period_start, 'dd/MM/yyyy')} - {safeFormatDate(invoice.period_end, 'dd/MM/yyyy')}
            </p>
          </div>
        </div>

        <Separator className="my-6" />

        {/* From / Bill To */}
        <div className="grid grid-cols-2 gap-8">
          {/* From */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              From
            </h3>
            <div className="mt-2 space-y-1 text-sm">
              <p className="font-semibold">{EPHRAIM_CARE_DETAILS.name}</p>
              <p className="text-muted-foreground">ABN: {EPHRAIM_CARE_DETAILS.abn}</p>
              <p className="text-muted-foreground">{EPHRAIM_CARE_DETAILS.phone}</p>
              <p className="text-muted-foreground">{EPHRAIM_CARE_DETAILS.email}</p>
              <p className="text-muted-foreground">{EPHRAIM_CARE_DETAILS.address}</p>
            </div>
          </div>

          {/* Bill To */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bill To
            </h3>
            <div className="mt-2 space-y-1 text-sm">
              {invoice.participants ? (
                <>
                  <p className="font-semibold">
                    {invoice.participants.first_name} {invoice.participants.last_name}
                  </p>
                  <p className="text-muted-foreground">
                    NDIS Number: {invoice.participants.ndis_number}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">Participant details unavailable</p>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Line Items */}
        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Services Provided
          </h3>
          <div className="rounded-lg border">
            <LineItemsTable lineItems={invoice.line_items} />
          </div>
        </div>

        <Separator className="my-6" />

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST (10%)</span>
              <span className="font-mono">{formatCurrency(invoice.gst)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t pt-6 text-center">
          <p className="text-xs text-muted-foreground/75">
            Powered by OpBros
          </p>
        </div>
      </div>
    </Card>
  )
}
