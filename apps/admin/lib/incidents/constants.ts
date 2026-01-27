// ─── Incident Types ──────────────────────────────────────────────────────────

export const INCIDENT_TYPES = [
  'injury',
  'medication_error',
  'property_damage',
  'behavioral',
  'abuse_neglect',
  'fall',
  'missing_person',
  'other',
] as const

export type IncidentType = (typeof INCIDENT_TYPES)[number]

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  injury: 'Injury',
  medication_error: 'Medication Error',
  property_damage: 'Property Damage',
  behavioral: 'Behavioral Incident',
  abuse_neglect: 'Abuse/Neglect',
  fall: 'Fall',
  missing_person: 'Missing Person',
  other: 'Other',
}

// ─── Severity Levels ─────────────────────────────────────────────────────────

export const INCIDENT_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const

export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number]

export const SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

// ─── Incident Status ─────────────────────────────────────────────────────────

export const INCIDENT_STATUSES = ['open', 'in_review', 'closed'] as const

export type IncidentStatus = (typeof INCIDENT_STATUSES)[number]

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  open: 'Open',
  in_review: 'In Review',
  closed: 'Closed',
}

export const STATUS_COLORS: Record<IncidentStatus, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_review: 'bg-amber-100 text-amber-800',
  closed: 'bg-gray-100 text-gray-800',
}

// ─── NDIA Reporting ──────────────────────────────────────────────────────────

/** Incident types that always require NDIA notification */
export const NDIA_MANDATORY_TYPES: IncidentType[] = ['abuse_neglect']

/** Severity levels that require NDIA notification */
export const NDIA_MANDATORY_SEVERITIES: IncidentSeverity[] = ['critical']

/** Hours within which NDIA must be notified for reportable incidents */
export const NDIA_REPORTING_HOURS = 24

export function requiresNdiaReport(type: IncidentType, severity: IncidentSeverity): boolean {
  return NDIA_MANDATORY_TYPES.includes(type) || NDIA_MANDATORY_SEVERITIES.includes(severity)
}

// ─── Cancellation Request Status ─────────────────────────────────────────────

export const CANCELLATION_STATUSES = ['pending', 'approved', 'rejected'] as const

export type CancellationStatus = (typeof CANCELLATION_STATUSES)[number]

export const CANCELLATION_STATUS_LABELS: Record<CancellationStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

export const CANCELLATION_STATUS_COLORS: Record<CancellationStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}
