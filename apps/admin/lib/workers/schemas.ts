import { z } from 'zod'
import { SUPPORT_TYPES } from './constants'

// ─── Worker Basic Info ──────────────────────────────────────────────────────

export const workerBasicSchema = z.object({
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be 100 characters or less'),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be 100 characters or less'),
  email: z.string().email('Must be a valid email address'),
  phone: z
    .string()
    .regex(/^(\+61|0)[2-9]\d{8}$/, 'Must be a valid Australian phone number')
    .optional()
    .or(z.literal('')),
})

// ─── Worker Details ─────────────────────────────────────────────────────────

export const workerDetailsSchema = z.object({
  services_provided: z
    .array(z.enum(SUPPORT_TYPES))
    .min(1, 'At least one support type is required'),
  qualification: z.array(z.string()).optional().default([]),
  hourly_rate: z.coerce
    .number()
    .min(0, 'Hourly rate must be 0 or greater')
    .optional(),
  max_hours_per_week: z.coerce
    .number()
    .min(1, 'Must be at least 1 hour')
    .max(168, 'Cannot exceed 168 hours per week')
    .default(38),
})

// ─── Worker Compliance ──────────────────────────────────────────────────────

export const workerComplianceSchema = z.object({
  ndis_check_number: z.string().optional().or(z.literal('')),
  ndis_check_expiry: z.string().optional().or(z.literal('')),
  wwcc_number: z.string().optional().or(z.literal('')),
  wwcc_expiry: z.string().optional().or(z.literal('')),
})

// ─── Full Worker Schema (for creation -- includes email) ────────────────────

export const workerFullSchema = workerBasicSchema
  .merge(workerDetailsSchema)
  .merge(workerComplianceSchema)

// ─── Edit Worker Schema (email excluded -- read-only after creation) ────────

export const workerEditSchema = workerBasicSchema
  .omit({ email: true })
  .merge(workerDetailsSchema)
  .merge(workerComplianceSchema)

// ─── Inferred Types ─────────────────────────────────────────────────────────

export type WorkerBasicData = z.infer<typeof workerBasicSchema>
export type WorkerDetailsData = z.infer<typeof workerDetailsSchema>
export type WorkerComplianceData = z.infer<typeof workerComplianceSchema>
export type WorkerFullData = z.infer<typeof workerFullSchema>
export type WorkerEditData = z.infer<typeof workerEditSchema>
