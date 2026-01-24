import { z } from 'zod'

// ─── Generate Invoice Schema ──────────────────────────────────────────────────

/** Validates the payload for generating a new invoice from shifts */
export const generateInvoiceSchema = z
  .object({
    participant_id: z.string().uuid(),
    period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
    period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  })
  .refine((data) => data.period_start <= data.period_end, {
    message: 'Start date must be before end date',
    path: ['period_end'],
  })

// ─── Support Type Rate Schema ─────────────────────────────────────────────────

/** Validates rate configuration for a support type */
export const supportTypeRateSchema = z.object({
  support_type: z.string().min(1, 'Support type is required'),
  ndis_item_number: z.string().optional().or(z.literal('')),
  weekday_rate: z.coerce.number().positive('Rate must be positive'),
  saturday_rate: z.coerce.number().positive('Rate must be positive'),
  sunday_rate: z.coerce.number().positive('Rate must be positive'),
  public_holiday_rate: z.coerce.number().positive('Rate must be positive'),
  effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
})

// ─── Public Holiday Schema ────────────────────────────────────────────────────

/** Validates public holiday entry */
export const publicHolidaySchema = z.object({
  holiday_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  name: z.string().min(1, 'Holiday name is required').max(100),
})

// ─── Finalize Invoice Schema ──────────────────────────────────────────────────

/** Validates the payload for finalizing (submitting) an invoice */
export const finalizeInvoiceSchema = z.object({
  invoice_id: z.string().uuid(),
})

// ─── Type Inferences ──────────────────────────────────────────────────────────

export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>
export type SupportTypeRateInput = z.infer<typeof supportTypeRateSchema>
export type PublicHolidayInput = z.infer<typeof publicHolidaySchema>
