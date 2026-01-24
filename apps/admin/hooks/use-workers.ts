'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { WorkerWithProfile } from '@ephraimcare/types'
import type { WorkerEditData } from '@/lib/workers/schemas'
import { toast } from '@/lib/toast'

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

// ─── Update Worker ────────────────────────────────────────────────────────────

export function useUpdateWorker(workerId: string, profileId: string) {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: WorkerEditData) => {
      const supabase = createClient()

      // Split into profile fields and worker fields
      const profileFields = {
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone || null,
      }

      const workerFields: Record<string, unknown> = {
        services_provided: data.services_provided,
        qualification: data.qualification || [],
        hourly_rate: data.hourly_rate || null,
        max_hours_per_week: data.max_hours_per_week ?? 38,
      }

      // Only include compliance fields if provided (columns may not exist pre-migration)
      if (data.ndis_check_number) workerFields.ndis_check_number = data.ndis_check_number
      if (data.ndis_check_expiry) workerFields.ndis_check_expiry = data.ndis_check_expiry
      if (data.wwcc_number) workerFields.wwcc_number = data.wwcc_number
      if (data.wwcc_expiry) workerFields.wwcc_expiry = data.wwcc_expiry

      // Update profile record
      const { error: profileError } = await (supabase
        .from('profiles') as any)
        .update(profileFields)
        .eq('id', profileId)

      if (profileError) throw new Error(`Profile update failed: ${profileError.message}`)

      // Update worker record
      const { error: workerError } = await (supabase
        .from('workers') as any)
        .update(workerFields)
        .eq('id', workerId)

      if (workerError) throw new Error(`Worker update failed: ${workerError.message}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
      queryClient.invalidateQueries({ queryKey: ['worker', workerId] })
      toast({
        title: 'Worker updated',
        description: 'Worker details have been saved successfully.',
        variant: 'success',
      })
      router.push(`/workers/${workerId}`)
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update worker',
        description: error.message,
        variant: 'error',
      })
    },
  })
}

// ─── Resend Invite ────────────────────────────────────────────────────────────

export function useResendInvite() {
  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const response = await fetch('/api/workers/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to resend invite')
      }

      return response.json()
    },
    onSuccess: () => {
      toast({
        title: 'Invite resent',
        description: 'Invite resent successfully.',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to resend invite',
        description: error.message,
        variant: 'error',
      })
    },
  })
}
