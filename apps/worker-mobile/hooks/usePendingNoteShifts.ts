import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface PendingNoteShift {
  shiftId: string
  participantId: string
  participantName: string
  checkOutTime: string
  durationMinutes: number
  scheduledStart: string
  scheduledEnd: string
  organizationId: string
  existingNote?: {
    id: string
    content: string
    concernFlag: boolean
    concernText?: string
  }
}

export function usePendingNoteShifts(workerId: string | undefined | null) {
  return useQuery({
    queryKey: ['case-notes', 'pending', workerId],
    queryFn: async (): Promise<PendingNoteShift[]> => {
      if (!workerId) return []

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      // Step 1: Get completed shifts with checkout in last 24h
      const { data: checkIns, error: checkInError } = await (supabase
        .from('shift_check_ins')
        .select(`
          shift_id,
          check_out_time,
          duration_minutes,
          shifts!inner (
            id, participant_id, worker_id, scheduled_start, scheduled_end, organization_id,
            participants (first_name, last_name)
          )
        `) as any)
        .not('check_out_time', 'is', null)
        .gte('check_out_time', twentyFourHoursAgo)

      if (checkInError) throw checkInError
      if (!checkIns || checkIns.length === 0) return []

      // Filter to only this worker's shifts
      const workerCheckIns = (checkIns as any[]).filter(
        (ci) => ci.shifts?.worker_id === workerId
      )
      if (workerCheckIns.length === 0) return []

      const shiftIds = workerCheckIns.map((ci: any) => ci.shift_id)

      // Step 2: Get existing notes for these shifts
      const { data: existingNotes } = await (supabase
        .from('case_notes')
        .select('id, shift_id, content, concern_flag, concern_text')
        .in('shift_id', shiftIds)
        .eq('worker_id', workerId) as any)

      const notesByShift = new Map<string, any>(
        (existingNotes ?? []).map((n: any) => [n.shift_id, n])
      )

      // Step 3: Build pending list (shifts without notes)
      return workerCheckIns
        .map((ci: any) => {
          const shift = ci.shifts as any
          const participant = shift?.participants
          const note = notesByShift.get(ci.shift_id)

          return {
            shiftId: ci.shift_id,
            participantId: shift.participant_id,
            participantName: participant
              ? `${participant.first_name} ${participant.last_name}`
              : 'Unknown',
            checkOutTime: ci.check_out_time,
            durationMinutes: ci.duration_minutes ?? 0,
            scheduledStart: shift.scheduled_start,
            scheduledEnd: shift.scheduled_end,
            organizationId: shift.organization_id,
            existingNote: note
              ? {
                  id: note.id,
                  content: note.content,
                  concernFlag: note.concern_flag,
                  concernText: note.concern_text ?? undefined,
                }
              : undefined,
          }
        })
        .filter((item: PendingNoteShift) => !item.existingNote)
    },
    enabled: !!workerId,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}
