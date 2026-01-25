'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'
import type { PublicHolidayInput } from '@/lib/invoices/schemas'

// ─── Holiday Type ──────────────────────────────────────────────────────────────

export interface PublicHoliday {
  id: string
  organization_id: string
  holiday_date: string
  name: string
  created_by: string
  created_at: string
}

// ─── Fetch Holidays ────────────────────────────────────────────────────────────

export function useHolidays() {
  return useQuery<PublicHoliday[]>({
    queryKey: ['holidays'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await (supabase
        .from('public_holidays')
        .select('*')
        .order('holiday_date', { ascending: true }) as any)

      if (error) throw error
      return (data ?? []) as PublicHoliday[]
    },
    staleTime: 30 * 1000,
  })
}

// ─── Create Holiday ────────────────────────────────────────────────────────────

export function useCreateHoliday() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: PublicHolidayInput) => {
      const supabase = createClient()

      // Get current user and organization_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await (supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single() as any)

      if (!profile?.organization_id) throw new Error('No organization found')

      const { error } = await (supabase
        .from('public_holidays')
        .insert({
          organization_id: profile.organization_id,
          holiday_date: data.holiday_date,
          name: data.name,
          created_by: user.id,
        }) as any)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] })
      toast({
        title: 'Holiday added',
        description: 'Public holiday has been added successfully.',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add holiday',
        description: error.message,
        variant: 'error',
      })
    },
  })
}

// ─── Delete Holiday ────────────────────────────────────────────────────────────

export function useDeleteHoliday() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()

      const { error } = await (supabase
        .from('public_holidays')
        .delete()
        .eq('id', id) as any)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] })
      toast({
        title: 'Holiday deleted',
        description: 'Public holiday has been removed.',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete holiday',
        description: error.message,
        variant: 'error',
      })
    },
  })
}
