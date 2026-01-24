import { isPast, isBefore, addDays } from 'date-fns'

// ─── Support Types ──────────────────────────────────────────────────────────

/** Common NDIS support categories for worker services */
export const SUPPORT_TYPES = [
  'Personal Care',
  'Community Access',
  'Domestic Assistance',
  'Transport',
  'Social & Recreational',
  'Respite Care',
  'Skill Building',
  'Behaviour Support',
] as const

export type SupportType = (typeof SUPPORT_TYPES)[number]

// ─── Compliance Status ──────────────────────────────────────────────────────

export type ComplianceStatus = 'valid' | 'expiring' | 'expired' | 'not_set'

/** Days before expiry to start showing 'expiring' warning */
const EXPIRING_THRESHOLD_DAYS = 90

/**
 * Determine compliance status from an expiry date.
 * - null/undefined -> 'not_set'
 * - Past date -> 'expired'
 * - Within 90 days of expiry -> 'expiring'
 * - More than 90 days -> 'valid'
 */
export function getComplianceStatus(expiryDate: string | null | undefined): ComplianceStatus {
  if (!expiryDate) return 'not_set'

  const expiry = new Date(expiryDate)
  if (isNaN(expiry.getTime())) return 'not_set'

  if (isPast(expiry)) return 'expired'
  if (isBefore(expiry, addDays(new Date(), EXPIRING_THRESHOLD_DAYS))) return 'expiring'

  return 'valid'
}

/** Priority order for compliance status (higher = worse) */
const STATUS_PRIORITY: Record<ComplianceStatus, number> = {
  valid: 0,
  not_set: 1,
  expiring: 2,
  expired: 3,
}

/**
 * Determine overall compliance status from NDIS and WWCC expiry dates.
 * Returns the worst (highest priority) status.
 */
export function getOverallComplianceStatus(
  ndisExpiry: string | null | undefined,
  wwccExpiry: string | null | undefined
): ComplianceStatus {
  const ndisStatus = getComplianceStatus(ndisExpiry)
  const wwccStatus = getComplianceStatus(wwccExpiry)

  return STATUS_PRIORITY[ndisStatus] >= STATUS_PRIORITY[wwccStatus]
    ? ndisStatus
    : wwccStatus
}

/** Tailwind background color classes for compliance status badges */
export const COMPLIANCE_COLORS: Record<ComplianceStatus, string> = {
  valid: 'bg-green-500',
  expiring: 'bg-amber-500',
  expired: 'bg-red-500',
  not_set: 'bg-gray-300',
}
