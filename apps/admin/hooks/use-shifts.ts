'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ShiftWithRelations } from '@ephraimcare/types'

interface UseShiftsOptions {
  weekStart: string
  weekEnd: string
  initialData?: ShiftWithRelations[]
}

export function useShifts({ weekStart, weekEnd, initialData }: UseShiftsOptions) {
  return useQuery<ShiftWithRelations[]>({
    queryKey: ['shifts', { weekStart, weekEnd }],
    queryFn: async () => {
      const supabase = createClient()

      const { data, error } = await (supabase
        .from('shifts')
        .select(
          '*, participants(id, first_name, last_name), workers(id, services_provided, profiles(first_name, last_name))'
        )
        .gte('scheduled_start', weekStart)
        .lte('scheduled_start', weekEnd)
        .order('scheduled_start', { ascending: true }) as any)

      if (error) throw error
      return (data as ShiftWithRelations[]) ?? []
    },
    initialData,
    staleTime: 30_000,
  })
}
