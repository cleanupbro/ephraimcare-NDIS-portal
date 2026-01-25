import { Document, Page, View, Text } from '@react-pdf/renderer'

import { styles, registerFonts } from './pdf-styles'
import { EPHRAIM_CARE_DETAILS, DAY_TYPE_LABELS } from '@/lib/invoices/constants'
import { formatHours } from '@/lib/invoices/calculations'
import type { InvoiceWithLineItems, DayType } from '@/lib/invoices/types'

// Register fonts on module load
registerFonts()

// ─── Types ──────────────────────────────────────────────────────────────────────

interface InvoicePDFProps {
  invoice: InvoiceWithLineItems & {
    participants: {
      first_name: string
      last_name: string
      ndis_number: string
    } | null
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getDayTypeLabel(dayType: DayType): string {
  return DAY_TYPE_LABELS[dayType] || dayType
}

// ─── Component ──────────────────────────────────────────────────────────────────

/**
 * React PDF document component for invoice rendering.
 * Generates a branded PDF with Ephraim Care details, participant info,
 * line items table, and totals with GST.
 *
 * Note: Participant portal never shows drafts, so watermark is hidden
 * but kept for consistency with admin PDF component.
 */
export function InvoicePDF({ invoice }: InvoicePDFProps) {
  const participant = invoice.participants
  const isDraft = invoice.status === 'draft'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Draft Watermark - never shown for participants */}
        {isDraft && <Text style={styles.draftWatermark}>DRAFT</Text>}

        {/* Header: Company Name + Invoice Title */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{EPHRAIM_CARE_DETAILS.name}</Text>
            <Text style={styles.text}>ABN: {EPHRAIM_CARE_DETAILS.abn}</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            <Text style={styles.periodText}>
              Date: {formatDate(invoice.invoice_date)}
            </Text>
            <Text style={styles.periodText}>
              Period: {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
            </Text>
            {invoice.due_date && (
              <Text style={styles.periodText}>
                Due: {formatDate(invoice.due_date)}
              </Text>
            )}
          </View>
        </View>

        {/* From / Bill To Section */}
        <View style={styles.fromTo}>
          {/* From: Ephraim Care */}
          <View style={styles.fromBlock}>
            <Text style={styles.sectionTitle}>From</Text>
            <Text style={styles.textBold}>{EPHRAIM_CARE_DETAILS.name}</Text>
            <Text style={styles.text}>{EPHRAIM_CARE_DETAILS.address}</Text>
            <Text style={styles.text}>Phone: {EPHRAIM_CARE_DETAILS.phone}</Text>
            <Text style={styles.text}>Email: {EPHRAIM_CARE_DETAILS.email}</Text>
          </View>

          {/* Bill To: Participant */}
          <View style={styles.toBlock}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.textBold}>
              {participant
                ? `${participant.first_name} ${participant.last_name}`
                : 'Unknown Participant'}
            </Text>
            <Text style={styles.text}>
              NDIS Number: {participant?.ndis_number || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.section}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.colDate]}>Date</Text>
            <Text style={[styles.headerText, styles.colService]}>Service</Text>
            <Text style={[styles.headerText, styles.colDayType]}>Day Type</Text>
            <Text style={[styles.headerText, styles.colHours]}>Hours</Text>
            <Text style={[styles.headerText, styles.colRate]}>Rate</Text>
            <Text style={[styles.headerText, styles.colTotal]}>Total</Text>
          </View>

          {/* Table Rows */}
          {invoice.line_items.map((item, index) => (
            <View
              key={item.id || index}
              style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
            >
              <Text style={[styles.cellText, styles.colDate]}>
                {formatDate(item.service_date)}
              </Text>
              <Text style={[styles.cellText, styles.colService]}>
                {item.support_type}
              </Text>
              <Text style={[styles.cellText, styles.colDayType]}>
                {getDayTypeLabel(item.day_type)}
              </Text>
              <Text style={[styles.cellRight, styles.colHours]}>
                {formatHours(item.billable_minutes)}
              </Text>
              <Text style={[styles.cellRight, styles.colRate]}>
                ${item.unit_price.toFixed(2)}/hr
              </Text>
              <Text style={[styles.cellRight, styles.colTotal]}>
                ${item.line_total.toFixed(2)}
              </Text>
            </View>
          ))}

          {/* Empty state */}
          {invoice.line_items.length === 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.cellText, { width: '100%', textAlign: 'center' }]}>
                No line items
              </Text>
            </View>
          )}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${invoice.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>GST (10%)</Text>
            <Text style={styles.totalValue}>${invoice.gst.toFixed(2)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Total Due</Text>
            <Text style={styles.grandTotalValue}>${invoice.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Notes (if any) */}
        {invoice.notes && (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>Notes</Text>
            <Text style={styles.paymentText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Powered by OpBros | {EPHRAIM_CARE_DETAILS.email} | {EPHRAIM_CARE_DETAILS.phone}
        </Text>
      </Page>
    </Document>
  )
}
