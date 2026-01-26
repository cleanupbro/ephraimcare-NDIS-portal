import { z } from 'zod'

/**
 * Organization registration schema
 * Used for new NDIS provider signup
 */
export const organizationRegisterSchema = z.object({
  organizationName: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be under 100 characters'),
  abn: z
    .string()
    .regex(/^\d{11}$/, 'ABN must be exactly 11 digits')
    .transform(val => val.replace(/\s/g, '')),
  adminEmail: z
    .string()
    .email('Please enter a valid email address'),
  adminPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  adminFirstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be under 50 characters'),
  adminLastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be under 50 characters'),
})

export type OrganizationRegisterInput = z.infer<typeof organizationRegisterSchema>
