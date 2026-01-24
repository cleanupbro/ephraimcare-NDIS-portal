import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useSyncStore } from '../stores/syncStore'
import type { CreateCaseNoteInput } from '../lib/schemas/case-note'

export function useCreateCaseNote() {
  const addPendingAction = useSyncStore((s) => s.addPendingAction)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateCaseNoteInput) => {
      const { data, error } = await supabase
        .from('case_notes')
        .upsert({
          shift_id: input.shiftId,
          participant_id: input.participantId,
          worker_id: input.workerId,
          organization_id: input.organizationId,
          content: input.content,
          concern_flag: input.concernFlag,
          concern_text: input.concernText ?? null,
          note_date: new Date().toISOString().split('T')[0],
          is_draft: false,
        } as any, { onConflict: 'shift_id,worker_id' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onError: (_error, variables) => {
      // Queue for offline sync
      addPendingAction({
        type: 'case_note',
        shiftId: variables.shiftId,
        timestamp: new Date().toISOString(),
        latitude: 0,
        longitude: 0,
        payload: {
          participantId: variables.participantId,
          workerId: variables.workerId,
          organizationId: variables.organizationId,
          content: variables.content,
          concernFlag: variables.concernFlag,
          concernText: variables.concernText,
          noteDate: new Date().toISOString().split('T')[0],
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-notes'] })
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
    },
  })
}
