'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

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

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useCreateShift() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (input: CreateShiftInput) => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('shifts')
        .insert({
          participant_id: input.participant_id,
          worker_id: input.worker_id,
          support_type: input.support_type,
          scheduled_start: input.scheduled_start,
          scheduled_end: input.scheduled_end,
          notes: input.notes,
          organization_id: input.organization_id,
          status: 'pending',
        } as any)
        .select('id')
        .single()

      if (error) throw error
      return data as { id: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      toast.success('Shift scheduled successfully')
      router.push('/shifts')
    },
    onError: (error: Error) => {
      toast.error(`Failed to create shift: ${error.message}`)
    },
  })
}
