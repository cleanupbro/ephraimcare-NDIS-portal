'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface DashboardData {
  participant: {
    id: string
    first_name: string
    last_name: string
    ndis_number: string
  }
  plan: {
    id: string
    start_date: string
    end_date: string
    total_budget: number
    used_budget: number
    status: string
  } | null
  upcomingShifts: Array<{
    id: string
    scheduled_start: string
    scheduled_end: string
    support_type: string
    worker: {
      first_name: string
      last_name: string
    } | null
  }>
}

export function useParticipantDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['participant-dashboard'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      // Get participant record (RLS enforces own data only)
      const { data: participant, error: pErr } = await (supabase
        .from('participants')
        .select('id, first_name, last_name, ndis_number')
        .eq('profile_id', user.id)
        .single() as any)

      if (pErr || !participant) throw new Error('No participant record')

      // Get active NDIS plan (may not exist)
      const { data: plan } = await (supabase
        .from('ndis_plans')
        .select('id, start_date, end_date, total_budget, used_budget, status')
        .eq('participant_id', participant.id)
        .eq('status', 'active')
        .maybeSingle() as any)

      // Get upcoming shifts (next 5, status = scheduled/confirmed)
      const { data: shifts } = await (supabase
        .from('shifts')
        .select(`
          id,
          scheduled_start,
          scheduled_end,
          support_type,
          workers!inner(profiles!inner(first_name, last_name))
        `)
        .eq('participant_id', participant.id)
        .in('status', ['scheduled', 'confirmed'])
        .gte('scheduled_start', new Date().toISOString())
        .order('scheduled_start', { ascending: true })
        .limit(5) as any)

      // Transform shifts to flatten worker data
      const upcomingShifts = (shifts || []).map((s: any) => ({
        id: s.id,
        scheduled_start: s.scheduled_start,
        scheduled_end: s.scheduled_end,
        support_type: s.support_type,
        worker: s.workers?.profiles ? {
          first_name: s.workers.profiles.first_name,
          last_name: s.workers.profiles.last_name,
        } : null,
      }))

      return { participant, plan, upcomingShifts }
    },
    staleTime: 60 * 1000, // 1 minute - data is mostly static
  })
}
