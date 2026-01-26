import { format } from 'date-fns'

export interface ShiftReminderParams {
  workerName: string
  participantName: string
  date: Date
  startTime: string // e.g., "9:00 AM"
  organizationName: string
}

/**
 * 24-hour shift reminder for workers
 */
export function shiftReminder24h(params: ShiftReminderParams): string {
  const dateStr = format(params.date, 'EEE d MMM')
  return `Hi ${params.workerName}, reminder: You have a shift with ${params.participantName} tomorrow (${dateStr}) at ${params.startTime}. - ${params.organizationName}`
}

/**
 * 2-hour shift reminder for workers
 */
export function shiftReminder2h(params: ShiftReminderParams): string {
  return `Hi ${params.workerName}, your shift with ${params.participantName} starts in 2 hours at ${params.startTime}. - ${params.organizationName}`
}

export interface ParticipantReminderParams {
  participantName: string
  workerName: string
  date: Date
  startTime: string
  organizationName: string
}

/**
 * 24-hour shift reminder for participants
 */
export function participantReminder24h(params: ParticipantReminderParams): string {
  const dateStr = format(params.date, 'EEE d MMM')
  return `Hi ${params.participantName}, reminder: ${params.workerName} will visit you tomorrow (${dateStr}) at ${params.startTime}. - ${params.organizationName}`
}

export interface InvoiceSmsParams {
  participantName: string
  invoiceNumber: string
  amount: string
  organizationName: string
}

/**
 * Invoice finalized notification for participants
 */
export function invoiceFinalizedSms(params: InvoiceSmsParams): string {
  return `Hi ${params.participantName}, invoice ${params.invoiceNumber} for ${params.amount} is ready. Log in to view details. - ${params.organizationName}`
}

export interface ShiftCancelledSmsParams {
  workerName: string
  participantName: string
  date: Date
  startTime: string
  reason?: string
  organizationName: string
}

/**
 * Shift cancellation notification for workers
 */
export function shiftCancelledWorkerSms(params: ShiftCancelledSmsParams): string {
  const dateStr = format(params.date, 'EEE d MMM')
  let message = `Hi ${params.workerName}, your shift with ${params.participantName} on ${dateStr} at ${params.startTime} has been cancelled.`
  if (params.reason) {
    message += ` Reason: ${params.reason}`
  }
  message += ` - ${params.organizationName}`
  return message
}

/**
 * Test SMS template
 */
export function testSms(organizationName: string): string {
  return `Test SMS from ${organizationName}. If you received this, your Twilio integration is working correctly!`
}
