import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const participantSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  ndis_number: z.string().regex(/^\d{9}$/, 'NDIS number must be 9 digits'),
  date_of_birth: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address_line_1: z.string().optional(),
  suburb: z.string().optional(),
  state: z.string().default('NSW'),
  postcode: z.string().regex(/^\d{4}$/, 'Postcode must be 4 digits').optional(),
})

export const shiftSchema = z.object({
  participant_id: z.string().uuid(),
  worker_id: z.string().uuid(),
  scheduled_start: z.string().datetime(),
  scheduled_end: z.string().datetime(),
  notes: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type ParticipantInput = z.infer<typeof participantSchema>
export type ShiftInput = z.infer<typeof shiftSchema>
