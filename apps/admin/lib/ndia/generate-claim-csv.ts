import { format } from 'date-fns'

/**
 * PACE Bulk Claim CSV Format
 * Reference: https://www.ndis.gov.au/providers/working-provider/getting-paid/bulk-payments
 */

export interface PaceClaimRow {
  registrationNumber: string // Provider registration number
  ndisNumber: string // Participant NDIS number
  supportItemNumber: string // NDIS support item code
  claimReference: string // Unique claim reference (invoice number)
  dateOfSupport: string // DD/MM/YYYY format
  quantity: number // Hours or units
  hoursOfSupport?: number // Hours if applicable
  unitPrice: number // Price per unit
  totalPrice: number // quantity * unitPrice
  gst: 'Y' | 'N' // GST included (usually N for NDIS)
  claimType: 'STANDARD' | 'CANCELLATION' | 'TRAVEL' // Claim type
  cancellationReason?: string // Required if claim type is CANCELLATION
  serviceBookingId?: string // If applicable
  abn?: string // Provider ABN
}

export interface InvoiceForExport {
  id: string
  invoice_number: string
  invoice_date: string
  participant: {
    ndis_number: string
    first_name: string
    last_name: string
  }
  line_items: {
    id: string
    ndis_item_number: string // Matches DB column name
    description: string
    quantity: number
    unit_price: number
    line_total: number // Matches DB column name
    service_date: string
  }[]
}

export interface OrganizationDetails {
  registrationNumber: string
  abn: string
  name: string
}

/**
 * Validate PACE data before generating CSV
 */
export function validatePaceData(
  invoices: InvoiceForExport[],
  organization: OrganizationDetails
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!organization.registrationNumber) {
    errors.push('Organization NDIS registration number is required')
  }

  if (!organization.abn) {
    errors.push('Organization ABN is required')
  }

  for (const invoice of invoices) {
    if (!invoice.participant?.ndis_number) {
      errors.push(`Invoice ${invoice.invoice_number}: Participant NDIS number is missing`)
    }

    for (const item of invoice.line_items) {
      if (!item.ndis_item_number) {
        errors.push(`Invoice ${invoice.invoice_number}: Support item number missing for "${item.description}"`)
      }

      if (!item.service_date) {
        errors.push(`Invoice ${invoice.invoice_number}: Service date missing for "${item.description}"`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Convert invoices to PACE claim rows
 */
export function invoicesToPaceRows(
  invoices: InvoiceForExport[],
  organization: OrganizationDetails
): PaceClaimRow[] {
  const rows: PaceClaimRow[] = []

  for (const invoice of invoices) {
    for (const item of invoice.line_items) {
      // Skip items without NDIS item numbers (not NDIS claimable)
      if (!item.ndis_item_number) continue

      rows.push({
        registrationNumber: organization.registrationNumber,
        ndisNumber: invoice.participant.ndis_number,
        supportItemNumber: item.ndis_item_number,
        claimReference: `${invoice.invoice_number}-${item.id.slice(0, 8)}`,
        dateOfSupport: item.service_date
          ? format(new Date(item.service_date), 'dd/MM/yyyy')
          : format(new Date(invoice.invoice_date), 'dd/MM/yyyy'),
        quantity: item.quantity,
        hoursOfSupport: item.quantity, // Assuming quantity is hours
        unitPrice: item.unit_price,
        totalPrice: item.line_total,
        gst: 'N', // NDIS services are GST-free
        claimType: 'STANDARD',
        abn: organization.abn,
      })
    }
  }

  return rows
}

/**
 * Generate PACE CSV content
 */
export function generatePaceCsv(rows: PaceClaimRow[]): string {
  // PACE header columns
  const headers = [
    'RegistrationNumber',
    'NDISNumber',
    'SupportItemNumber',
    'ClaimReference',
    'DateOfSupport',
    'Quantity',
    'Hours',
    'UnitPrice',
    'TotalPrice',
    'GST',
    'ClaimType',
    'CancellationReason',
    'ABN',
  ]

  const csvRows = [headers.join(',')]

  for (const row of rows) {
    const csvRow = [
      row.registrationNumber,
      row.ndisNumber,
      row.supportItemNumber,
      row.claimReference,
      row.dateOfSupport,
      row.quantity.toString(),
      row.hoursOfSupport?.toString() || '',
      row.unitPrice.toFixed(2),
      row.totalPrice.toFixed(2),
      row.gst,
      row.claimType,
      row.cancellationReason || '',
      row.abn || '',
    ]

    // Escape fields that might contain commas
    csvRows.push(csvRow.map((field) => escapeCSVField(field)).join(','))
  }

  return csvRows.join('\n')
}

/**
 * Escape CSV field value
 */
function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

/**
 * Full export function
 */
export async function generateNdiaCsv(
  invoices: InvoiceForExport[],
  organization: OrganizationDetails
): Promise<{ success: boolean; csv?: string; errors?: string[]; rowCount?: number }> {
  // Validate
  const validation = validatePaceData(invoices, organization)
  if (!validation.valid) {
    return { success: false, errors: validation.errors }
  }

  // Convert to PACE rows
  const rows = invoicesToPaceRows(invoices, organization)

  if (rows.length === 0) {
    return {
      success: false,
      errors: ['No claimable line items found. Ensure invoices have support item numbers.'],
    }
  }

  // Generate CSV
  const csv = generatePaceCsv(rows)

  return {
    success: true,
    csv,
    rowCount: rows.length,
  }
}

/**
 * Calculate export statistics
 */
export function calculateExportStats(rows: PaceClaimRow[]): {
  totalClaims: number
  totalValue: number
  participantCount: number
  dateRange: { start: string; end: string }
} {
  const participants = new Set(rows.map((r) => r.ndisNumber))
  const dates = rows.map((r) => r.dateOfSupport).sort()

  return {
    totalClaims: rows.length,
    totalValue: rows.reduce((sum, r) => sum + r.totalPrice, 0),
    participantCount: participants.size,
    dateRange: {
      start: dates[0] || '',
      end: dates[dates.length - 1] || '',
    },
  }
}
