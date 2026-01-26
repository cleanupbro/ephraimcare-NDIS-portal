'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface Appointment {
  id: string
  scheduled_start: string
  scheduled_end: string
  status: string
  support_type: string
  notes: string | null
  workers: {
    id: string
    profiles: { first_name: string; last_name: string } | null
  } | null
}

export interface ParticipantInfo {
  id: string
  first_name: string
  organization_id: string
}

export const appointmentKeys = {
  all: ['appointments'] as const,
  upcoming: () => [...appointmentKeys.all, 'upcoming'] as const,
}

export function useParticipantAppointments() {
  const supabase = createClient()

  return useQuery({
    queryKey: appointmentKeys.upcoming(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get participant record
      const { data: participant, error: pErr } = await (supabase
        .from('participants')
        .select('id, first_name, organization_id')
        .eq('profile_id', user.id)
        .single() as any)

      if (pErr || !participant) throw new Error('No participant record')

      const now = new Date().toISOString()

      const { data: appointments, error } = await supabase
        .from('shifts')
        .select(`
          id,
          scheduled_start,
          scheduled_end,
          status,
          support_type,
          notes,
          workers(id, profiles(first_name, last_name))
        `)
        .eq('participant_id', participant.id)
        .neq('status', 'cancelled')
        .gte('scheduled_start', now)
        .order('scheduled_start', { ascending: true })

      if (error) throw error

      return {
        participant: participant as ParticipantInfo,
        appointments: appointments as Appointment[],
      }
    },
  })
}

interface CreateCancellationRequestInput {
  shift_id: string
  participant_id: string
  organization_id: string
  reason: string
}

export function useCreateCancellationRequest() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateCancellationRequestInput) => {
      const { data, error } = await (supabase
        .from('shift_cancellation_requests') as any)
        .insert({
          shift_id: input.shift_id,
          participant_id: input.participant_id,
          organization_id: input.organization_id,
          reason: input.reason,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
    },
  })
}

export function usePendingCancellationRequest(shiftId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['cancellation-request', shiftId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('shift_cancellation_requests') as any)
        .select('id, status')
        .eq('shift_id', shiftId)
        .eq('status', 'pending')
        .maybeSingle()

      if (error) throw error
      return data
    },
    enabled: !!shiftId,
  })
}
