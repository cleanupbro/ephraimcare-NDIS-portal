'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/lib/toast'
import { createClient } from '@/lib/supabase/client'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UpdateShiftInput {
  worker_id?: string
  scheduled_start?: string
  scheduled_end?: string
  notes?: string | null
  support_type?: string
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useUpdateShift(shiftId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateShiftInput) => {
      const supabase = createClient()

      const { data, error } = await (supabase
        .from('shifts') as any)
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', shiftId)
        .select('id')
        .single()

      if (error) throw error
      return data as { id: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      toast({ title: 'Shift updated', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update shift', description: error.message, variant: 'error' })
    },
  })
}
