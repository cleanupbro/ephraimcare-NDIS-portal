'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Participant } from '@ephraimcare/types'

// Re-export form-related hooks from their dedicated files
export { useCheckNdisNumber } from './use-check-ndis'
export { useCreateParticipant } from './use-create-participant'

// --- Query Hooks ---

interface UseParticipantsOptions {
  search?: string
  status?: 'active' | 'archived' | 'all'
}

export function useParticipants({ search, status = 'active' }: UseParticipantsOptions = {}) {
  return useQuery<Participant[]>({
    queryKey: ['participants', { search, status }],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase.from('participants').select('*').order('first_name')

      // Status filter
      if (status === 'active') {
        query = query.eq('is_active', true)
      } else if (status === 'archived') {
        query = query.eq('is_active', false)
      }
      // 'all' = no filter

      // Search filter
      if (search && search.trim().length > 0) {
        const term = search.trim()
        query = query.or(
          `first_name.ilike.%${term}%,last_name.ilike.%${term}%,ndis_number.ilike.%${term}%`
        )
      }

      const { data, error } = await query
      if (error) throw error
      return (data as Participant[]) ?? []
    },
    staleTime: 30 * 1000,
  })
}

export function useParticipant(id: string | undefined) {
  return useQuery<Participant & { ndis_plan?: any }>({
    queryKey: ['participant', id],
    queryFn: async () => {
      const supabase = createClient()

      // Fetch participant
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .select('*')
        .eq('id', id!)
        .single()

      if (participantError) throw participantError

      // Fetch current active NDIS plan
      const { data: ndisPlan } = await supabase
        .from('ndis_plans')
        .select('*')
        .eq('participant_id', id!)
        .eq('status', 'active')
        .maybeSingle()

      return { ...(participant as unknown as Participant), ndis_plan: ndisPlan }
    },
    enabled: !!id,
  })
}

// --- Mutation Hooks ---

interface UpdateParticipantInput {
  id: string
  data: Partial<Omit<Participant, 'id' | 'ndis_number' | 'organization_id' | 'created_at' | 'updated_at'>>
}

export function useUpdateParticipant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: UpdateParticipantInput) => {
      const supabase = createClient()

      // Strip ndis_number from payload to prevent accidental changes
      const { ...updateData } = data
      delete (updateData as any).ndis_number

      const { data: result, error } = await (supabase
        .from('participants') as any)
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single()

      if (error) throw error
      return result as unknown as Participant
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['participants'] })
      queryClient.invalidateQueries({ queryKey: ['participant', variables.id] })
    },
  })
}

export function useArchiveParticipant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()

      const { error } = await (supabase
        .from('participants') as any)
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] })
    },
  })
}

// --- Utility Hooks ---

export function useHasActiveShifts(participantId: string | undefined) {
  return useQuery<boolean>({
    queryKey: ['participant-active-shifts', participantId],
    queryFn: async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('shifts')
        .select('id')
        .eq('participant_id', participantId!)
        .in('status', ['scheduled', 'in_progress', 'pending_approval'])
        .limit(1)

      if (error) throw error
      return (data?.length ?? 0) > 0
    },
    enabled: !!participantId,
  })
}
