import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

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
      toast.success('Shift deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
    },
    onError: (error) => {
      console.error('Failed to delete shift:', error)
      toast.error('Failed to delete shift')
    },
  })
}
