import { EPHRAIM_CARE_ABN, PACE_GST_CODE } from './constants'

// ─── PACE CSV Headers ─────────────────────────────────────────────────────────

/** All 16 column headers for NDIS PACE bulk upload CSV format */
export const PACE_CSV_HEADERS = [
  'RegistrationNumber',
  'NDISNumber',
  'SupportsDeliveredFrom',
  'SupportsDeliveredTo',
  'SupportNumber',
  'ClaimReference',
  'Quantity',
  'Hours',
  'UnitPrice',
  'GSTCode',
  'AuthorisedBy',
  'ParticipantApproved',
  'InKindFundingProgram',
  'ClaimType',
  'CancellationReason',
  'ABN of Support Provider',
] as const

// ─── PACE CSV Invoice Type ────────────────────────────────────────────────────

/** Simplified input type for CSV generation (avoids coupling to full Invoice type) */
export interface PaceCsvInvoice {
  invoice_number: string
  participant_ndis_number: string
  line_items: Array<{
    service_date: string
    ndis_item_number: string
    billable_minutes: number
    unit_price: number
  }>
}

// ─── CSV Generation ───────────────────────────────────────────────────────────

/**
 * Generate PACE-format CSV for NDIS bulk claim upload.
 * Produces exactly 16 columns per row matching PACE_CSV_HEADERS.
 *
 * @param invoices - Array of invoices with their line items
 * @param registrationNumber - NDIS provider registration number
 * @returns CSV string (header + data rows, no trailing newline)
 */
export function generatePaceCsv(
  invoices: PaceCsvInvoice[],
  registrationNumber: string
): string {
  const headerRow = PACE_CSV_HEADERS.join(',')

  const dataRows: string[] = []

  for (const invoice of invoices) {
    for (const item of invoice.line_items) {
      const quantity = (item.billable_minutes / 60).toFixed(2)
      const unitPrice = item.unit_price.toFixed(2)

      const row = [
        registrationNumber,                // RegistrationNumber
        invoice.participant_ndis_number,   // NDISNumber
        item.service_date,                 // SupportsDeliveredFrom
        item.service_date,                 // SupportsDeliveredTo (same day)
        item.ndis_item_number,             // SupportNumber
        invoice.invoice_number,            // ClaimReference
        quantity,                          // Quantity (hours as decimal)
        '',                                // Hours (always blank)
        unitPrice,                         // UnitPrice
        PACE_GST_CODE,                     // GSTCode (P1 = taxable)
        '',                                // AuthorisedBy (blank)
        '',                                // ParticipantApproved (blank)
        '',                                // InKindFundingProgram (blank)
        '',                                // ClaimType (blank)
        '',                                // CancellationReason (blank)
        EPHRAIM_CARE_ABN,                  // ABN of Support Provider (no spaces)
      ].join(',')

      dataRows.push(row)
    }
  }

  return headerRow + '\n' + dataRows.join('\n')
}
