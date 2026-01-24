'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/lib/toast'
import { createClient } from '@/lib/supabase/client'

// ─── Types ──────────────────────────────────────────────────────────────────

interface CancelShiftInput {
  cancellation_reason: string
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useCancelShift(shiftId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CancelShiftInput) => {
      const supabase = createClient()

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
