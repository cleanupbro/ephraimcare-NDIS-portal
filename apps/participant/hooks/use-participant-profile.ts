'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Participant profile with all personal information fields.
 * Used for the read-only profile page display.
 */
export interface ParticipantProfile {
  id: string
  first_name: string
  last_name: string
  ndis_number: string
  date_of_birth: string | null
  phone: string | null
  email: string | null
  address: string | null
  suburb: string | null
  state: string | null
  postcode: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
  medical_notes: string | null
  support_needs: string | null
}

// ─── Profile Hook ─────────────────────────────────────────────────────────────

/**
 * Fetch participant profile for the authenticated user.
 * RLS enforces that only the participant's own record is returned.
 *
 * Used by the read-only profile page to display personal information.
 */
export function useParticipantProfile() {
  return useQuery<ParticipantProfile>({
    queryKey: ['participant-profile'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      // RLS enforces own data only via profile_id match
      const { data, error } = await (supabase
        .from('participants')
        .select(`
          id, first_name, last_name, ndis_number,
          date_of_birth, phone, email, address, suburb, state, postcode,
          emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
          medical_notes, support_needs
        `)
        .eq('profile_id', user.id)
        .single() as any)

      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - profile rarely changes
  })
}
