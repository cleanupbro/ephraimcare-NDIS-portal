import { z } from 'zod'

// ─── Step 1: Basic Info ──────────────────────────────────────────────────────

export const basicInfoSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100, 'First name must be 100 characters or less'),
  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name must be 100 characters or less'),
  ndis_number: z
    .string()
    .regex(/^\d{9}$/, 'NDIS number must be exactly 9 digits')
    .refine((val) => val.startsWith('43'), {
      message: 'NDIS number must start with 43',
    }),
  date_of_birth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine(
      (val) => {
        const date = new Date(val)
        return !isNaN(date.getTime()) && date < new Date()
      },
      { message: 'Date of birth must be in the past' }
    )
    .refine(
      (val) => {
        const date = new Date(val)
        return !isNaN(date.getTime()) && date >= new Date('1900-01-01')
      },
      { message: 'Date of birth must be after 1900-01-01' }
    ),
  phone: z
    .string()
    .regex(/^(\+61|0)[2-9]\d{8}$/, 'Must be a valid Australian phone number')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email('Must be a valid email address')
    .optional()
    .or(z.literal('')),
})

// ─── Step 2: Plan Details ────────────────────────────────────────────────────

const budgetCategorySchema = z.object({
  category: z.string().min(1, 'Category name is required'),
  allocated_amount: z.coerce.number().min(0, 'Amount must be 0 or greater'),
})

export const planDetailsSchema = z
  .object({
    plan_number: z.string().optional().or(z.literal('')),
    plan_start_date: z.string().min(1, 'Plan start date is required'),
    plan_end_date: z.string().min(1, 'Plan end date is required'),
    total_budget: z.coerce
      .number()
      .min(0, 'Budget must be 0 or greater')
      .max(999999.99, 'Budget cannot exceed $999,999.99'),
    budget_categories: z.array(budgetCategorySchema).optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.plan_start_date)
      const end = new Date(data.plan_end_date)
      return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start
    },
    {
      message: 'Plan end date must be after plan start date',
      path: ['plan_end_date'],
    }
  )

// ─── Step 3: Contacts ────────────────────────────────────────────────────────

export const contactsSchema = z.object({
  address_line_1: z.string().optional().or(z.literal('')),
  address_line_2: z.string().optional().or(z.literal('')),
  suburb: z.string().optional().or(z.literal('')),
  state: z.string().default('NSW'),
  postcode: z
    .string()
    .regex(/^\d{4}$/, 'Postcode must be 4 digits')
    .optional()
    .or(z.literal('')),
  emergency_contact_name: z.string().optional().or(z.literal('')),
  emergency_contact_phone: z
    .string()
    .regex(/^(\+61|0)[2-9]\d{8}$/, 'Must be a valid Australian phone number')
    .optional()
    .or(z.literal('')),
})

// ─── Step 4: Support Needs ───────────────────────────────────────────────────

export const supportNeedsSchema = z.object({
  notes: z.string().max(2000, 'Notes must be 2000 characters or less').optional().or(z.literal('')),
})

// ─── Full Participant Schema (for create form, includes ndis_number) ─────────

export const participantFullSchema = basicInfoSchema
  .merge(contactsSchema)
  .merge(supportNeedsSchema)

// ─── Edit Participant Schema (ndis_number excluded -- read-only field) ───────

export const participantEditSchema = basicInfoSchema
  .omit({ ndis_number: true })
  .merge(contactsSchema)
  .merge(supportNeedsSchema)

// ─── Inferred Types ──────────────────────────────────────────────────────────

export type BasicInfoData = z.infer<typeof basicInfoSchema>
export type PlanDetailsData = z.infer<typeof planDetailsSchema>
export type ContactsData = z.infer<typeof contactsSchema>
export type SupportNeedsData = z.infer<typeof supportNeedsSchema>
export type ParticipantFullData = z.infer<typeof participantFullSchema>
export type ParticipantEditData = z.infer<typeof participantEditSchema>
