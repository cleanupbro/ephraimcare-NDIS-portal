'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface CaseNoteFilters {
  dateFrom?: string
  dateTo?: string
  workerId?: string
}

export function useParticipantCaseNotes(participantId: string | undefined, filters: CaseNoteFilters = {}) {
  return useQuery({
    queryKey: ['case-notes', participantId, filters],
    queryFn: async () => {
      const supabase = createClient()

      let query = (supabase
        .from('case_notes')
        .select(
          '*, workers!inner(id, profiles(first_name, last_name)), shifts(scheduled_start, scheduled_end, shift_check_ins(duration_minutes, check_in_time, check_out_time))'
        )
        .eq('participant_id', participantId!) as any)

      if (filters.dateFrom) {
        query = query.gte('note_date', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('note_date', filters.dateTo)
      }
      if (filters.workerId) {
        query = query.eq('worker_id', filters.workerId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
    enabled: !!participantId,
    staleTime: 30_000,
  })
}

export function useReviewCaseNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (caseNoteId: string) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await (supabase
        .from('case_notes') as any)
        .update({
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', caseNoteId)
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

export function useAddAdminComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      caseNoteId,
      comment,
      organizationId,
    }: {
      caseNoteId: string
      comment: string
      organizationId: string
    }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await (supabase
        .from('case_note_admin_comments') as any)
        .insert({
          case_note_id: caseNoteId,
          admin_id: user.id,
          comment,
          organization_id: organizationId,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-notes'] })
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] })
    },
  })
}

export function useAdminComments(caseNoteId: string | undefined) {
  return useQuery({
    queryKey: ['admin-comments', caseNoteId],
    queryFn: async () => {
      const supabase = createClient()

      const { data, error } = await (supabase
        .from('case_note_admin_comments')
        .select('*, profiles(first_name, last_name)')
        .eq('case_note_id', caseNoteId!)
        .order('created_at', { ascending: false }) as any)

      if (error) throw error
      return data ?? []
    },
    enabled: !!caseNoteId,
    staleTime: 30_000,
  })
}

export function useCaseNoteWorkers(participantId: string | undefined) {
  return useQuery({
    queryKey: ['case-note-workers', participantId],
    queryFn: async () => {
      const supabase = createClient()

      const { data, error } = await (supabase
        .from('case_notes')
        .select('worker_id, workers!inner(id, profiles(first_name, last_name))')
        .eq('participant_id', participantId!) as any)

      if (error) throw error

      // Deduplicate by worker_id
      const seen = new Set<string>()
      const unique = (data ?? []).filter((row: any) => {
        if (seen.has(row.worker_id)) return false
        seen.add(row.worker_id)
        return true
      })

      return unique
    },
    enabled: !!participantId,
    staleTime: 60_000,
  })
}
