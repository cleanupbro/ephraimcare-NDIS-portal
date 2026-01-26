// ─── Accounting Export Formatters ───────────────────────────────────────────
// Xero and MYOB-compatible CSV formatters for invoice data
// Australian date format (DD/MM/YYYY) used throughout

// ─── Types ──────────────────────────────────────────────────────────────────

/** Invoice data shape for accounting export */
export interface AccountingInvoice {
  invoiceNumber: string
  invoiceDate: string // ISO date string
  dueDate: string | null // ISO date string
  contactName: string
  description: string
  quantity: number
  unitAmount: number
  accountCode?: string
  taxType?: string
  // MYOB-specific fields
  firstName?: string
  lastName?: string
  itemNumber?: string
  taxCode?: string
}

/** Raw invoice data from database for transformation */
export interface InvoiceExportData {
  invoice_number: string
  invoice_date: string
  due_date: string | null
  participants: {
    first_name: string
    last_name: string
    ndis_number: string
  } | null
  invoice_line_items: Array<{
    description: string
    quantity: number
    unit_price: number
    ndis_item_number: string
    service_date: string
  }>
}

// ─── Date Formatting ────────────────────────────────────────────────────────

/**
 * Format ISO date string to Australian DD/MM/YYYY format
 */
function formatAustralianDate(isoDate: string | null): string {
  if (!isoDate) return ''
  const date = new Date(isoDate)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Escape a field value for CSV format
 */
function escapeField(value: string | number): string {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// ─── Xero CSV Format ────────────────────────────────────────────────────────

/**
 * Xero invoice import column headers
 * See: https://central.xero.com/s/article/Import-sales-invoices-and-bills
 */
const XERO_HEADERS = [
  'ContactName',
  'InvoiceNumber',
  'InvoiceDate',
  'DueDate',
  'Description',
  'Quantity',
  'UnitAmount',
  'AccountCode',
  'TaxType',
]

/**
 * Generate Xero-compatible invoice CSV
 *
 * @param invoices - Array of invoice data from database
 * @returns CSV string for Xero import
 *
 * @example
 * ```ts
 * const csv = generateXeroInvoiceCsv(invoices)
 * // Returns:
 * // ContactName,InvoiceNumber,InvoiceDate,DueDate,Description,Quantity,UnitAmount,AccountCode,TaxType
 * // John Smith,INV-2026-001,27/01/2026,10/02/2026,Personal Care - Weekday,2.5,55.47,200,GST Free Income
 * ```
 */
export function generateXeroInvoiceCsv(invoices: InvoiceExportData[]): string {
  const rows: string[] = [XERO_HEADERS.join(',')]

  for (const invoice of invoices) {
    const contactName = invoice.participants
      ? `${invoice.participants.first_name} ${invoice.participants.last_name}`
      : 'Unknown Participant'
    const invoiceDate = formatAustralianDate(invoice.invoice_date)
    const dueDate = formatAustralianDate(invoice.due_date)

    // Each line item becomes a row
    for (const item of invoice.invoice_line_items) {
      const row = [
        escapeField(contactName),
        escapeField(invoice.invoice_number),
        escapeField(invoiceDate),
        escapeField(dueDate),
        escapeField(item.description),
        escapeField(item.quantity),
        escapeField(item.unit_price.toFixed(2)),
        escapeField('200'), // Default revenue account code
        escapeField('GST Free Income'), // NDIS services are typically GST-free
      ]
      rows.push(row.join(','))
    }
  }

  return rows.join('\n')
}

// ─── MYOB CSV Format ────────────────────────────────────────────────────────

/**
 * MYOB invoice import column headers
 * See: https://help.myob.com/wiki/display/ar/Import+sales
 */
const MYOB_HEADERS = [
  'Co./Last Name',
  'First Name',
  'Inv#',
  'Date',
  'Terms',
  'Due Date',
  'Item Number',
  'Description',
  'Quantity',
  'Unit Price',
  'Tax Code',
]

/**
 * Generate MYOB-compatible invoice CSV
 *
 * @param invoices - Array of invoice data from database
 * @param paymentTermsDays - Default payment terms in days (default: 14)
 * @returns CSV string for MYOB import
 *
 * @example
 * ```ts
 * const csv = generateMyobInvoiceCsv(invoices)
 * // Returns:
 * // Co./Last Name,First Name,Inv#,Date,Terms,Due Date,Item Number,Description,Quantity,Unit Price,Tax Code
 * // Smith,John,INV-2026-001,27/01/2026,Net 14,10/02/2026,01_011_0107_1_1,Personal Care - Weekday,2.5,55.47,FRE
 * ```
 */
export function generateMyobInvoiceCsv(
  invoices: InvoiceExportData[],
  paymentTermsDays: number = 14
): string {
  const rows: string[] = [MYOB_HEADERS.join(',')]
  const terms = `Net ${paymentTermsDays}`

  for (const invoice of invoices) {
    const lastName = invoice.participants?.last_name ?? 'Unknown'
    const firstName = invoice.participants?.first_name ?? ''
    const invoiceDate = formatAustralianDate(invoice.invoice_date)
    const dueDate = formatAustralianDate(invoice.due_date)

    // Each line item becomes a row
    for (const item of invoice.invoice_line_items) {
      const row = [
        escapeField(lastName),
        escapeField(firstName),
        escapeField(invoice.invoice_number),
        escapeField(invoiceDate),
        escapeField(terms),
        escapeField(dueDate),
        escapeField(item.ndis_item_number), // NDIS item number as Item Number
        escapeField(item.description),
        escapeField(item.quantity),
        escapeField(item.unit_price.toFixed(2)),
        escapeField('FRE'), // GST Free tax code
      ]
      rows.push(row.join(','))
    }
  }

  return rows.join('\n')
}

// ─── Participant Export Format ──────────────────────────────────────────────

/** Participant data for CSV export */
export interface ParticipantExportData {
  ndis_number: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null
  address_line_1: string | null
  address_line_2: string | null
  suburb: string | null
  state: string
  postcode: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  is_active: boolean
}

const PARTICIPANT_HEADERS = [
  'NDIS Number',
  'First Name',
  'Last Name',
  'Email',
  'Phone',
  'Date of Birth',
  'Address Line 1',
  'Address Line 2',
  'Suburb',
  'State',
  'Postcode',
  'Emergency Contact',
  'Emergency Phone',
  'Status',
]

/**
 * Generate participant list CSV
 *
 * @param participants - Array of participant data
 * @returns CSV string
 */
export function generateParticipantsCsv(participants: ParticipantExportData[]): string {
  const rows: string[] = [PARTICIPANT_HEADERS.join(',')]

  for (const p of participants) {
    const row = [
      escapeField(p.ndis_number),
      escapeField(p.first_name),
      escapeField(p.last_name),
      escapeField(p.email ?? ''),
      escapeField(p.phone ?? ''),
      escapeField(formatAustralianDate(p.date_of_birth)),
      escapeField(p.address_line_1 ?? ''),
      escapeField(p.address_line_2 ?? ''),
      escapeField(p.suburb ?? ''),
      escapeField(p.state),
      escapeField(p.postcode ?? ''),
      escapeField(p.emergency_contact_name ?? ''),
      escapeField(p.emergency_contact_phone ?? ''),
      escapeField(p.is_active ? 'Active' : 'Inactive'),
    ]
    rows.push(row.join(','))
  }

  return rows.join('\n')
}

// ─── Worker Hours Export Format ─────────────────────────────────────────────

/** Worker hours data for payroll CSV export */
export interface WorkerHoursExportData {
  employee_id: string | null
  first_name: string
  last_name: string
  shift_date: string
  participant_name: string
  hours_worked: number
  support_type: string | null
}

const WORKER_HOURS_HEADERS = [
  'Employee ID',
  'First Name',
  'Last Name',
  'Shift Date',
  'Participant',
  'Hours Worked',
  'Support Type',
]

/**
 * Generate worker hours CSV for payroll integration
 *
 * @param shifts - Array of worker hours data
 * @returns CSV string
 */
export function generateWorkerHoursCsv(shifts: WorkerHoursExportData[]): string {
  const rows: string[] = [WORKER_HOURS_HEADERS.join(',')]

  for (const s of shifts) {
    const row = [
      escapeField(s.employee_id ?? ''),
      escapeField(s.first_name),
      escapeField(s.last_name),
      escapeField(formatAustralianDate(s.shift_date)),
      escapeField(s.participant_name),
      escapeField(s.hours_worked.toFixed(2)),
      escapeField(s.support_type ?? ''),
    ]
    rows.push(row.join(','))
  }

  return rows.join('\n')
}
