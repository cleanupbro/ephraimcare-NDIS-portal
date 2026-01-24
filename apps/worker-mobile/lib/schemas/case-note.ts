import { z } from 'zod'

export const caseNoteSchema = z.object({
  content: z.string().min(10, 'Note must be at least 10 characters'),
  concernFlag: z.boolean().default(false),
  concernText: z.string().optional().refine(
    (val) => val === undefined || val.length === 0 || val.length >= 5,
    'Concern description must be at least 5 characters if provided'
  ),
})

export type CaseNoteFormData = z.infer<typeof caseNoteSchema>

export interface CreateCaseNoteInput {
  shiftId: string
  participantId: string
  workerId: string
  organizationId: string
  content: string
  concernFlag: boolean
  concernText?: string
}
