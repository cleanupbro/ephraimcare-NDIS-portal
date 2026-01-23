export const ROLES = ['admin', 'coordinator', 'worker', 'participant'] as const

export const SHIFT_STATUSES = [
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
] as const

export const INVOICE_STATUSES = [
  'draft',
  'pending',
  'submitted',
  'paid',
  'overdue',
  'cancelled',
] as const

export const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000 // 8 hours
