'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { WorkerWithProfile } from '@ephraimcare/types'

interface UseWorkersOptions {
  search?: string
  status?: 'active' | 'inactive' | 'all'
}

export function useWorkers({ search, status = 'active' }: UseWorkersOptions = {}) {
  return useQuery<WorkerWithProfile[]>({
    queryKey: ['workers', { search, status }],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('workers')
        .select('*, profiles!inner(first_name, last_name, email, phone)')
        .order('created_at', { ascending: false })

      // Status filter
      if (status === 'active') {
        query = query.eq('is_active', true)
      } else if (status === 'inactive') {
        query = query.eq('is_active', false)
      }
      // 'all' = no filter

      const { data, error } = await query
      if (error) throw error

      let workers = (data as unknown as WorkerWithProfile[]) ?? []

      // Client-side search filter on name and email
      if (search && search.trim().length > 0) {
        const term = search.trim().toLowerCase()
        workers = workers.filter((w) => {
          const fullName = `${w.profiles.first_name} ${w.profiles.last_name}`.toLowerCase()
          const email = w.profiles.email.toLowerCase()
          return fullName.includes(term) || email.includes(term)
        })
      }

      return workers
    },
    staleTime: 30 * 1000,
  })
}
