'use client'

import { useQuery } from '@tanstack/react-query'
import { startOfISOWeek, startOfMonth, differenceInMinutes } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { WorkerStats } from '@ephraimcare/types'

function calculateTotalHours(
  shifts: { actual_start: string | null; actual_end: string | null }[]
): number {
  return shifts.reduce((total, shift) => {
    if (!shift.actual_start || !shift.actual_end) return total
    const hours =
      differenceInMinutes(new Date(shift.actual_end), new Date(shift.actual_start)) / 60
    return total + Math.max(0, hours)
  }, 0)
}

export function useWorkerStats(workerId: string | undefined) {
  return useQuery<WorkerStats>({
    queryKey: ['worker-stats', workerId],
    queryFn: async () => {
      const supabase = createClient()
      const now = new Date()
      const weekStart = startOfISOWeek(now)
      const monthStart = startOfMonth(now)

      // Hours this week (completed shifts)
      const { data: weekShifts } = await supabase
        .from('shifts')
        .select('actual_start, actual_end')
        .eq('worker_id', workerId!)
        .eq('status', 'completed')
        .gte('scheduled_start', weekStart.toISOString())

      // Hours this month (completed shifts)
      const { data: monthShifts } = await supabase
        .from('shifts')
        .select('actual_start, actual_end')
        .eq('worker_id', workerId!)
        .eq('status', 'completed')
        .gte('scheduled_start', monthStart.toISOString())

      // Next upcoming shift with participant name
      const { data: nextShiftData } = await (supabase
        .from('shifts') as any)
        .select('id, scheduled_start, scheduled_end, participants!inner(first_name, last_name)')
        .eq('worker_id', workerId!)
        .in('status', ['scheduled', 'confirmed'])
        .gte('scheduled_start', now.toISOString())
        .order('scheduled_start')
        .limit(1)
        .maybeSingle()

      const typedNextShift = nextShiftData as {
        id: string
        scheduled_start: string
        scheduled_end: string
        participants: { first_name: string; last_name: string }
      } | null

      const nextShift = typedNextShift
        ? {
            id: typedNextShift.id,
            scheduled_start: typedNextShift.scheduled_start,
            scheduled_end: typedNextShift.scheduled_end,
            participants: typedNextShift.participants,
          }
        : null

      return {
        hoursThisWeek: calculateTotalHours((weekShifts as any[]) ?? []),
        hoursThisMonth: calculateTotalHours((monthShifts as any[]) ?? []),
        nextShift,
      }
    },
    enabled: !!workerId,
    staleTime: 60 * 1000, // 1 minute
  })
}
