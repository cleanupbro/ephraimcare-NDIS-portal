'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/lib/toast'
import type { WorkerFullData } from '@/lib/workers/schemas'

interface CreateWorkerResponse {
  id: string
  user_id: string
}

interface CreateWorkerError {
  error: string
}

export function useCreateWorker() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: WorkerFullData): Promise<CreateWorkerResponse> => {
      const response = await fetch('/api/workers/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone || null,
          services_provided: data.services_provided,
          qualification: data.qualification || [],
          hourly_rate: data.hourly_rate || null,
          max_hours_per_week: data.max_hours_per_week ?? 38,
          ndis_check_number: data.ndis_check_number || null,
          ndis_check_expiry: data.ndis_check_expiry || null,
          wwcc_number: data.wwcc_number || null,
          wwcc_expiry: data.wwcc_expiry || null,
        }),
      })

      if (!response.ok) {
        const errorData: CreateWorkerError = await response.json()
        throw new Error(errorData.error || 'Failed to create worker')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
      toast({
        title: 'Worker invited',
        description: 'An invitation email has been sent to the worker.',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create worker',
        description: error.message,
        variant: 'error',
      })
    },
  })
}
