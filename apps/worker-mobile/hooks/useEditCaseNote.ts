import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

interface EditCaseNoteInput {
  noteId: string
  content: string
  concernFlag: boolean
  concernText?: string
}

export function useEditCaseNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: EditCaseNoteInput) => {
      const { data, error } = await (supabase
        .from('case_notes') as any)
        .update({
          content: input.content,
          concern_flag: input.concernFlag,
          concern_text: input.concernText ?? null,
        })
        .eq('id', input.noteId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-notes'] })
    },
  })
}
