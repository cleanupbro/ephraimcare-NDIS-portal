/**
 * Notification infrastructure barrel export
 * Import from '@/lib/notifications' for clean access to all notification functionality
 */

// Types
export type {
  NotificationEmailParams,
  ShiftAssignmentEmailParams,
  ShiftCancellationEmailParams,
  InvoiceFinalizedEmailParams,
} from './types'

// Email sending functions
export {
  ADMIN_EMAIL,
  sendNotificationEmail,
  sendShiftAssignmentEmail,
  sendShiftCancellationEmail,
  sendInvoiceFinalizedEmail,
} from './send-email'

// Templates (exported for testing purposes)
export {
  shiftAssignmentTemplate,
  shiftCancellationTemplate,
  invoiceFinalizedTemplate,
} from './templates'
