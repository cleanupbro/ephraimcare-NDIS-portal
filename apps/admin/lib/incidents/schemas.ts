import { z } from 'zod'
import { INCIDENT_TYPES, INCIDENT_SEVERITIES, INCIDENT_STATUSES } from './constants'

// ─── Incident Schemas ────────────────────────────────────────────────────────

export const incidentCreateSchema = z.object({
  participant_id: z.string().uuid().optional().nullable(),
  worker_id: z.string().uuid().optional().nullable(),
  shift_id: z.string().uuid().optional().nullable(),
  incident_type: z.enum(INCIDENT_TYPES),
  severity: z.enum(INCIDENT_SEVERITIES),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  actions_taken: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  incident_date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
})

export type IncidentCreateFormData = z.infer<typeof incidentCreateSchema>

export const incidentUpdateSchema = incidentCreateSchema.partial().extend({
  status: z.enum(INCIDENT_STATUSES).optional(),
  closed_at: z.string().nullable().optional(),
  closed_by: z.string().uuid().nullable().optional(),
})

export type IncidentUpdateFormData = z.infer<typeof incidentUpdateSchema>

export const ndiaReportSchema = z.object({
  ndia_reference_number: z.string().min(1, 'Reference number is required').max(50),
})

export type NdiaReportFormData = z.infer<typeof ndiaReportSchema>

// ─── Cancellation Request Schemas ────────────────────────────────────────────

export const cancellationRequestSchema = z.object({
  shift_id: z.string().uuid(),
  reason: z.string().min(10, 'Please provide a reason (at least 10 characters)').max(500),
})

export type CancellationRequestFormData = z.infer<typeof cancellationRequestSchema>

export const cancellationReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  admin_notes: z.string().max(500).optional(),
})

export type CancellationReviewFormData = z.infer<typeof cancellationReviewSchema>
