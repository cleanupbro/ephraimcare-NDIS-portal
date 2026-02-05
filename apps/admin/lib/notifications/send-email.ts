/**
 * Fire-and-forget email sending via Resend API
 * No await - emails are sent asynchronously without blocking the caller
 */

import { formatSydneyDate } from '@ephraimcare/utils'
import type {
  NotificationEmailParams,
  ShiftAssignmentEmailParams,
  ShiftCancellationEmailParams,
  InvoiceFinalizedEmailParams,
} from './types'
import {
  shiftAssignmentTemplate,
  shiftCancellationTemplate,
  invoiceFinalizedTemplate,
} from './templates'

/** Admin email for CC on all notifications */
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ephraimcare252@gmail.com'

/**
 * Send notification email via Resend API
 * Fire-and-forget: does not await response, logs errors without throwing
 */
export function sendNotificationEmail(params: NotificationEmailParams): void {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping email')
    return
  }

  // Fire-and-forget: no await
  fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Ephraim Care <noreply@ephraimcare.com.au>',
      to: Array.isArray(params.to) ? params.to : [params.to],
      cc: params.cc ? (Array.isArray(params.cc) ? params.cc : [params.cc]) : undefined,
      subject: params.subject,
      html: params.html,
    }),
  }).catch((err) => {
    // Log but don't throw - email failure shouldn't block the operation
    console.error('Notification email failed:', err)
  })
}

/**
 * Send shift assignment notification to worker
 * CC'd to admin for visibility
 */
export function sendShiftAssignmentEmail(params: ShiftAssignmentEmailParams): void {
  const dateStr = formatSydneyDate(params.scheduledStart, 'EEEE, d MMMM yyyy')
  const startTime = formatSydneyDate(params.scheduledStart, 'h:mm a')
  const endTime = formatSydneyDate(params.scheduledEnd, 'h:mm a')
  const workerAppUrl = process.env.NEXT_PUBLIC_WORKER_APP_URL || 'https://worker.ephraimcare.com.au'

  sendNotificationEmail({
    to: params.workerEmail,
    cc: ADMIN_EMAIL,
    subject: `New Shift: ${dateStr}`,
    html: shiftAssignmentTemplate({
      workerName: params.workerName,
      date: dateStr,
      time: `${startTime} - ${endTime}`,
      participantName: params.participantName,
      viewUrl: `${workerAppUrl}/shift/${params.shiftId}`,
    }),
  })
}

/**
 * Send shift cancellation notification
 * Sends to worker always, and to participant if they have an email on file
 */
export function sendShiftCancellationEmail(params: ShiftCancellationEmailParams): void {
  const dateStr = formatSydneyDate(params.scheduledStart, 'EEEE, d MMMM yyyy')
  const timeStr = formatSydneyDate(params.scheduledStart, 'h:mm a')

  // Email to worker
  sendNotificationEmail({
    to: params.workerEmail,
    cc: ADMIN_EMAIL,
    subject: `Shift Cancelled: ${dateStr}`,
    html: shiftCancellationTemplate({
      recipientName: params.workerName,
      date: dateStr,
      time: timeStr,
      participantName: params.participantName,
      reason: params.cancellationReason,
    }),
  })

  // Email to participant (if they have email on file)
  if (params.participantEmail) {
    sendNotificationEmail({
      to: params.participantEmail,
      cc: ADMIN_EMAIL,
      subject: `Shift Cancelled: ${dateStr}`,
      html: shiftCancellationTemplate({
        recipientName: params.participantName,
        date: dateStr,
        time: timeStr,
        participantName: params.participantName,
        reason: params.cancellationReason,
      }),
    })
  }
}

/**
 * Send invoice finalized notification to participant
 * CC'd to admin and emergency contact (if on file) for family management
 */
export function sendInvoiceFinalizedEmail(params: InvoiceFinalizedEmailParams): void {
  const participantPortalUrl = process.env.NEXT_PUBLIC_PARTICIPANT_URL || 'https://portal.ephraimcare.com.au'

  // Build CC list: admin always, emergency contact if available
  const ccList: string[] = [ADMIN_EMAIL]
  if (params.emergencyContactEmail) {
    ccList.push(params.emergencyContactEmail)
  }

  sendNotificationEmail({
    to: params.participantEmail,
    cc: ccList,
    subject: `Invoice ${params.invoiceNumber} Ready`,
    html: invoiceFinalizedTemplate({
      participantName: params.participantName,
      invoiceNumber: params.invoiceNumber,
      total: `$${params.total.toFixed(2)}`,
      viewUrl: `${participantPortalUrl}/invoices`,
    }),
  })
}
