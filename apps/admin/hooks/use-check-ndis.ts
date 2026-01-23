'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook to check if an NDIS number is already registered.
 * Only runs when provided a valid 9-digit NDIS number.
 */
export function useCheckNdisNumber(ndisNumber: string | undefined) {
  const isValid = !!ndisNumber && /^\d{9}$/.test(ndisNumber)

  return useQuery({
    queryKey: ['ndis-check', ndisNumber],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('participants')
        .select('id')
        .eq('ndis_number', ndisNumber!)
        .maybeSingle()

      if (error) throw error
      return { exists: !!data }
    },
    enabled: isValid,
    staleTime: 30 * 1000,
    retry: false,
  })
}
