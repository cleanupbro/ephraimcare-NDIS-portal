'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'
import type { SupportTypeRateInput } from '@/lib/invoices/schemas'

// ─── Rate Type ─────────────────────────────────────────────────────────────────

export interface SupportTypeRate {
  id: string
  organization_id: string
  support_type: string
  ndis_item_number: string | null
  weekday_rate: number
  saturday_rate: number
  sunday_rate: number
  public_holiday_rate: number
  effective_from: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Fetch Rates ───────────────────────────────────────────────────────────────

export function useRates() {
  return useQuery<SupportTypeRate[]>({
    queryKey: ['rates'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await (supabase
        .from('support_type_rates')
        .select('*')
        .eq('is_active', true)
        .order('support_type') as any)

      if (error) throw error
      return (data ?? []) as SupportTypeRate[]
    },
    staleTime: 30 * 1000,
  })
}

// ─── Create Rate ───────────────────────────────────────────────────────────────

export function useCreateRate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SupportTypeRateInput) => {
      const supabase = createClient()

      // Get current user's organization_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await (supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single() as any)

      if (!profile?.organization_id) throw new Error('No organization found')

      const { error } = await (supabase
        .from('support_type_rates') as any)
        .insert({
          organization_id: profile.organization_id,
          support_type: data.support_type,
          ndis_item_number: data.ndis_item_number || null,
          weekday_rate: data.weekday_rate,
          saturday_rate: data.saturday_rate,
          sunday_rate: data.sunday_rate,
          public_holiday_rate: data.public_holiday_rate,
          effective_from: data.effective_from,
          is_active: true,
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rates'] })
      toast({
        title: 'Rate created',
        description: 'Support type rate has been saved successfully.',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create rate',
        description: error.message,
        variant: 'error',
      })
    },
  })
}

// ─── Update Rate ───────────────────────────────────────────────────────────────

export function useUpdateRate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: SupportTypeRateInput & { id: string }) => {
      const supabase = createClient()

      const { error } = await (supabase
        .from('support_type_rates') as any)
        .update({
          support_type: data.support_type,
          ndis_item_number: data.ndis_item_number || null,
          weekday_rate: data.weekday_rate,
          saturday_rate: data.saturday_rate,
          sunday_rate: data.sunday_rate,
          public_holiday_rate: data.public_holiday_rate,
          effective_from: data.effective_from,
        })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rates'] })
      toast({
        title: 'Rate updated',
        description: 'Support type rate has been updated successfully.',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update rate',
        description: error.message,
        variant: 'error',
      })
    },
  })
}
