'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'
import { createClient } from '@/lib/supabase/client'
import { sendShiftAssignmentEmail } from '@/lib/notifications'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CreateShiftInput {
  participant_id: string
  worker_id: string
  support_type: string
  scheduled_start: string
  scheduled_end: string
  notes: string | null
  organization_id: string
}

/** Shift data shape returned from creation query with notification details */
interface CreatedShiftWithNotificationData {
  id: string
  scheduled_start: string
  scheduled_end: string
  worker: {
    profile: { email: string; first_name: string }
  }
  participant: { first_name: string; last_name: string }
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useCreateShift() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (input: CreateShiftInput) => {
      const supabase = createClient()

      const { data, error } = await (supabase
        .from('shifts') as any)
        .insert({
          participant_id: input.participant_id,
          worker_id: input.worker_id,
          support_type: input.support_type,
          scheduled_start: input.scheduled_start,
          scheduled_end: input.scheduled_end,
          notes: input.notes,
          organization_id: input.organization_id,
          status: 'pending',
        })
        .select(`
          id,
          scheduled_start,
          scheduled_end,
          worker:workers(
            profile:profiles(email, first_name)
          ),
          participant:participants(first_name, last_name)
        `)
        .single()

      if (error) throw error
      return data as CreatedShiftWithNotificationData
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })

      // Fire-and-forget notification (NOTF-01)
      sendShiftAssignmentEmail({
        workerEmail: data.worker.profile.email,
        workerName: data.worker.profile.first_name,
        scheduledStart: data.scheduled_start,
        scheduledEnd: data.scheduled_end,
        participantName: `${data.participant.first_name} ${data.participant.last_name}`,
        shiftId: data.id,
      })

      toast({ title: 'Shift scheduled successfully', variant: 'success' })
      router.push('/shifts')
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create shift', description: error.message, variant: 'error' })
    },
  })
}
