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

// ─── Day Type Labels ──────────────────────────────────────────────────────────

/** Human-readable labels for day types */
export const DAY_TYPE_LABELS = {
  weekday: 'Weekday',
  saturday: 'Saturday',
  sunday: 'Sunday',
  public_holiday: 'Public Holiday',
} as const
