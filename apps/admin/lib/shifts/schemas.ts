import { z } from 'zod'
import { SUPPORT_TYPES } from '../workers/constants'

// ─── Shift Create Schema ────────────────────────────────────────────────────

export const shiftCreateSchema = z.object({
  participant_id: z.string().uuid('Participant is required'),
  worker_id: z.string().uuid('Worker is required'),
  support_type: z.string().min(1, 'Support type is required'),
  date: z.string().min(1, 'Date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  duration_hours: z.coerce
    .number()
    .min(0.25, 'Min 15 minutes')
    .max(24, 'Max 24 hours'),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

export type ShiftCreateFormData = z.infer<typeof shiftCreateSchema>

// ─── Shift Edit Schema ──────────────────────────────────────────────────────

export const shiftEditSchema = shiftCreateSchema.partial().extend({
  status: z
    .enum([
      'pending',
      'proposed',
      'scheduled',
      'confirmed',
      'in_progress',
      'completed',
      'cancelled',
      'no_show',
    ])
    .optional(),
})

export type ShiftEditFormData = z.infer<typeof shiftEditSchema>

// ─── Shift Cancel Schema ────────────────────────────────────────────────────

export const shiftCancelSchema = z.object({
  cancellation_reason: z
    .string()
    .min(1, 'Reason required')
    .max(500),
})

export type ShiftCancelFormData = z.infer<typeof shiftCancelSchema>

// ─── Override Checkout Schema ──────────────────────────────────────────────

export const overrideCheckoutSchema = z.object({
  check_out_time: z.string().datetime({ message: 'Valid ISO datetime required' }),
})

export type OverrideCheckoutData = z.infer<typeof overrideCheckoutSchema>
