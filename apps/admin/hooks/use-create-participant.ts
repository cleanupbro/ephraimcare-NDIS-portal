'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { BasicInfoData, PlanDetailsData, ContactsData, SupportNeedsData } from '@/lib/participants/schemas'
import type { Database } from '@ephraimcare/types'

type ParticipantInsert = Database['public']['Tables']['participants']['Insert']
type NdisPlanInsert = Database['public']['Tables']['ndis_plans']['Insert']

export interface CreateParticipantInput {
  basicInfo: BasicInfoData
  planDetails: PlanDetailsData
  contacts: ContactsData
  supportNeeds: SupportNeedsData
  organization_id: string
}

export function useCreateParticipant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateParticipantInput) => {
      const supabase = createClient()

      // 1. Create participant
      const participantData: ParticipantInsert = {
        organization_id: input.organization_id,
        first_name: input.basicInfo.first_name,
        last_name: input.basicInfo.last_name,
        ndis_number: input.basicInfo.ndis_number,
        date_of_birth: input.basicInfo.date_of_birth,
        phone: input.basicInfo.phone || null,
        email: input.basicInfo.email || null,
        address_line_1: input.contacts.address_line_1 || null,
        address_line_2: input.contacts.address_line_2 || null,
        suburb: input.contacts.suburb || null,
        state: input.contacts.state || 'NSW',
        postcode: input.contacts.postcode || null,
        emergency_contact_name: input.contacts.emergency_contact_name || null,
        emergency_contact_phone: input.contacts.emergency_contact_phone || null,
        notes: input.supportNeeds.notes || null,
        is_active: true,
        profile_id: null,
      }

      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .insert(participantData as any)
        .select('id')
        .single()

      if (participantError) throw participantError
      if (!participant) throw new Error('Failed to create participant')

      // 2. Create NDIS plan
      const planData: NdisPlanInsert = {
        participant_id: (participant as any).id,
        plan_number: input.planDetails.plan_number || null,
        start_date: input.planDetails.plan_start_date,
        end_date: input.planDetails.plan_end_date,
        total_budget: input.planDetails.total_budget,
        status: 'active',
      }

      const { error: planError } = await supabase
        .from('ndis_plans')
        .insert(planData as any)

      if (planError) throw planError

      return participant as { id: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] })
    },
  })
}
