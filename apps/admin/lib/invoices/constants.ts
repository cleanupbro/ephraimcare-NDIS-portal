// ─── GST Rate ─────────────────────────────────────────────────────────────────

/** Australian GST rate (10%) */
export const GST_RATE = 0.10

// ─── Business Details ─────────────────────────────────────────────────────────

/** ABN without spaces (for PACE CSV export) */
export const EPHRAIM_CARE_ABN = '76685693565'

/** ABN with spaces (for PDF/display) */
export const EPHRAIM_CARE_ABN_DISPLAY = '76 685 693 565'

/** Full business details for invoice rendering */
export const EPHRAIM_CARE_DETAILS = {
  name: 'Ephraim Care Pty Ltd',
  abn: '76 685 693 565',
  phone: '0451 918 884',
  email: 'info@ephraimcare.com.au',
  address: 'Factory 1A, 9 Lyn Parade, Prestons NSW 2170',
} as const

// ─── Invoice Status Colors ────────────────────────────────────────────────────

/** Visual styling for each invoice status: border (card left edge), badge (pill), text (label) */
export const INVOICE_STATUS_COLORS = {
  draft: {
    border: 'border-l-gray-400',
    badge: 'bg-gray-100 text-gray-700',
    text: 'Draft',
  },
  pending: {
    border: 'border-l-yellow-400',
    badge: 'bg-yellow-50 text-yellow-700',
    text: 'Pending',
  },
  submitted: {
    border: 'border-l-blue-500',
    badge: 'bg-blue-50 text-blue-700',
    text: 'Submitted',
  },
  paid: {
    border: 'border-l-green-500',
    badge: 'bg-green-50 text-green-700',
    text: 'Paid',
  },
  overdue: {
    border: 'border-l-red-500',
    badge: 'bg-red-50 text-red-700',
    text: 'Overdue',
  },
  cancelled: {
    border: 'border-l-red-300',
    badge: 'bg-red-50 text-red-500',
    text: 'Cancelled',
  },
} as const

export type InvoiceStatusKey = keyof typeof INVOICE_STATUS_COLORS

// ─── Day Type Labels ──────────────────────────────────────────────────────────

/** Human-readable labels for day types */
export const DAY_TYPE_LABELS = {
  weekday: 'Weekday',
  saturday: 'Saturday',
  sunday: 'Sunday',
  public_holiday: 'Public Holiday',
} as const

// ─── PACE CSV Constants ───────────────────────────────────────────────────────

/** GST code for PACE CSV export (P1 = taxable) */
export const PACE_GST_CODE = 'P1'
