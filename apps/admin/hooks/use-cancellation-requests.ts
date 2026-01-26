'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface CancellationRequest {
  id: string
  shift_id: string
  participant_id: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  reviewed_at: string | null
  shifts: {
    id: string
    scheduled_start: string
    scheduled_end: string
    support_type: string
    workers: {
      profiles: { first_name: string; last_name: string } | null
    } | null
  } | null
  participants: {
    first_name: string
    last_name: string
    ndis_number: string
  } | null
}

export const cancellationKeys = {
  all: ['cancellation-requests'] as const,
  list: (status?: string) => [...cancellationKeys.all, 'list', status] as const,
  pending: () => [...cancellationKeys.all, 'pending'] as const,
  count: () => [...cancellationKeys.all, 'count'] as const,
}

export function useCancellationRequests(status?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: cancellationKeys.list(status),
    queryFn: async () => {
      let query = (supabase
        .from('shift_cancellation_requests') as any)
        .select(`
          id,
          shift_id,
          participant_id,
          reason,
          status,
          admin_notes,
          created_at,
          reviewed_at,
          shifts(id, scheduled_start, scheduled_end, support_type, workers(profiles(first_name, last_name))),
          participants(first_name, last_name, ndis_number)
        `)
        .order('created_at', { ascending: false })

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error
      return data as CancellationRequest[]
    },
  })
}

export function usePendingCancellationCount() {
  const supabase = createClient()

  return useQuery({
    queryKey: cancellationKeys.count(),
    queryFn: async () => {
      const { count, error } = await (supabase
        .from('shift_cancellation_requests') as any)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (error) throw error
      return count || 0
    },
  })
}

interface ReviewRequestInput {
  id: string
  status: 'approved' | 'rejected'
  admin_notes?: string
  reviewed_by: string
}

export function useReviewCancellationRequest() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ReviewRequestInput) => {
      // Update request status
      const { data: request, error: requestError } = await (supabase
        .from('shift_cancellation_requests') as any)
        .update({
          status: input.status,
          admin_notes: input.admin_notes || null,
          reviewed_by: input.reviewed_by,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select('shift_id')
        .single()

      if (requestError) throw requestError

      // If approved, cancel the shift
      if (input.status === 'approved' && request?.shift_id) {
        const { error: shiftError } = await (supabase
          .from('shifts') as any)
          .update({ status: 'cancelled' })
          .eq('id', request.shift_id)

        if (shiftError) throw shiftError
      }

      return request
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cancellationKeys.all })
    },
  })
}
