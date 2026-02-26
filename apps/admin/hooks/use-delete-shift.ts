import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'

export function useDeleteShift() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (shiftId: string) => {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shiftId)

      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Shift deleted successfully', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
    },
    onError: (error) => {
      console.error('Failed to delete shift:', error)
      toast({ title: 'Failed to delete shift', variant: 'error' })
    },
  })
}
