/**
 * HTML email templates for notification emails
 * Inline CSS for maximum email client compatibility
 * Ephraim Care branding: #66BB6A (green)
 */

interface ShiftAssignmentTemplateParams {
  workerName: string
  date: string // Formatted: "Monday, 27 January 2026"
  time: string // Formatted: "9:00 AM - 1:00 PM"
  participantName: string
  viewUrl: string
}

interface ShiftCancellationTemplateParams {
  recipientName: string
  date: string
  time: string
  participantName: string
  reason: string
}

interface InvoiceFinalizedTemplateParams {
  participantName: string
  invoiceNumber: string
  total: string // Formatted: "$150.00"
  viewUrl: string
}

/**
 * Shift assignment email template
 * Sent to worker when a new shift is scheduled
 */
export function shiftAssignmentTemplate(params: ShiftAssignmentTemplateParams): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #66BB6A; margin-bottom: 16px;">New Shift Assigned</h2>
  <p>Hi ${params.workerName},</p>
  <p>You have a new shift:</p>
  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p style="margin: 0;"><strong>Date:</strong> ${params.date}</p>
    <p style="margin: 8px 0 0;"><strong>Time:</strong> ${params.time}</p>
    <p style="margin: 8px 0 0;"><strong>Participant:</strong> ${params.participantName}</p>
  </div>
  <a href="${params.viewUrl}" style="display: inline-block; background: #66BB6A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">View Shift Details</a>
  <p style="color: #666; font-size: 12px; margin-top: 32px;">Ephraim Care</p>
</body>
</html>`.trim()
}

/**
 * Shift cancellation email template
 * Sent to worker and/or participant when shift is cancelled
 */
export function shiftCancellationTemplate(params: ShiftCancellationTemplateParams): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333; margin-bottom: 16px;">Shift Cancelled</h2>
  <p>Hi ${params.recipientName},</p>
  <p>A shift has been cancelled:</p>
  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p style="margin: 0;"><strong>Date:</strong> ${params.date}</p>
    <p style="margin: 8px 0 0;"><strong>Time:</strong> ${params.time}</p>
    <p style="margin: 8px 0 0;"><strong>Participant:</strong> ${params.participantName}</p>
  </div>
  <div style="margin: 16px 0;">
    <p style="margin: 0;"><strong>Reason:</strong></p>
    <p style="margin: 4px 0 0; color: #666;">${params.reason}</p>
  </div>
  <p style="color: #666; font-size: 12px; margin-top: 32px;">Ephraim Care</p>
</body>
</html>`.trim()
}

/**
 * Invoice finalized email template
 * Sent to participant when their invoice is ready
 */
export function invoiceFinalizedTemplate(params: InvoiceFinalizedTemplateParams): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #66BB6A; margin-bottom: 16px;">Invoice Ready</h2>
  <p>Hi ${params.participantName},</p>
  <p>Your invoice is now available for review:</p>
  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p style="margin: 0;"><strong>Invoice Number:</strong> ${params.invoiceNumber}</p>
    <p style="margin: 8px 0 0;"><strong>Total Amount:</strong> ${params.total}</p>
  </div>
  <a href="${params.viewUrl}" style="display: inline-block; background: #66BB6A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">View Invoice</a>
  <p style="color: #666; font-size: 12px; margin-top: 32px;">Ephraim Care</p>
</body>
</html>`.trim()
}
