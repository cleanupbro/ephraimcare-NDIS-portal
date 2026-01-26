/**
 * Notification email type definitions
 * Base interfaces and domain-specific parameter types for all notification emails
 */

/**
 * Base interface for sendNotificationEmail()
 * Contains all fields needed for the Resend API call
 */
export interface NotificationEmailParams {
  to: string | string[]
  cc?: string | string[]
  subject: string
  html: string
}

/**
 * Parameters for shift assignment notification
 * Sent to worker when a new shift is scheduled for them
 */
export interface ShiftAssignmentEmailParams {
  workerEmail: string
  workerName: string
  scheduledStart: string // ISO datetime
  scheduledEnd: string // ISO datetime
  participantName: string
  shiftId: string
}

/**
 * Parameters for shift cancellation notification
 * Sent to worker and optionally participant when a shift is cancelled
 */
export interface ShiftCancellationEmailParams {
  workerEmail: string
  workerName: string
  participantEmail: string | null
  participantName: string
  scheduledStart: string // ISO datetime
  cancellationReason: string
}

/**
 * Parameters for invoice finalized notification
 * Sent to participant (and emergency contact if on file) when invoice is ready
 */
export interface InvoiceFinalizedEmailParams {
  participantEmail: string
  participantName: string
  emergencyContactEmail: string | null
  invoiceNumber: string
  invoiceId: string
  total: number
}
