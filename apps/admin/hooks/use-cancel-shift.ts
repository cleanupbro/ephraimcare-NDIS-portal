'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/lib/toast'
import { createClient } from '@/lib/supabase/client'
import { sendShiftCancellationEmail } from '@/lib/notifications'

// ─── Types ──────────────────────────────────────────────────────────────────

interface CancelShiftInput {
  cancellation_reason: string
}

/** Notification data fetched after cancellation */
interface CancellationNotificationData {
  scheduled_start: string
  worker: {
    profile: { email: string; first_name: string }
  }
  participant: {
    first_name: string
    last_name: string
    email: string | null
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useCancelShift(shiftId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CancelShiftInput) => {
      const supabase = createClient()

      // Step 1: Cancel the shift
      const { data, error } = await (supabase
        .from('shifts') as any)
        .update({
          status: 'cancelled',
          cancellation_reason: input.cancellation_reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', shiftId)
        .select('id')
        .single()

      if (error) throw error

      // Step 2: Fetch notification data (worker + participant emails)
      const { data: notifData } = await (supabase
        .from('shifts') as any)
        .select(`
          scheduled_start,
          worker:workers(profile:profiles(email, first_name)),
          participant:participants(first_name, last_name, email)
        `)
        .eq('id', shiftId)
        .single()

      // Step 3: Send cancellation email (fire-and-forget, NOTF-02)
      if (notifData?.worker?.profile?.email) {
        const nd = notifData as CancellationNotificationData
        sendShiftCancellationEmail({
          workerEmail: nd.worker.profile.email,
          workerName: nd.worker.profile.first_name,
          participantEmail: nd.participant?.email || null,
          participantName: nd.participant
            ? `${nd.participant.first_name} ${nd.participant.last_name}`
            : 'Unknown',
          scheduledStart: nd.scheduled_start,
          cancellationReason: input.cancellation_reason,
        })
      }

      return data as { id: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      toast({ title: 'Shift cancelled', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to cancel shift', description: error.message, variant: 'error' })
    },
  })
}
