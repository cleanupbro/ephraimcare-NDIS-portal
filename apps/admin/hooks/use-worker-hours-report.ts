'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { DateRangeFilter, WorkerHoursRow } from '@/lib/reports/types'

// ─── Types ──────────────────────────────────────────────────────────────────

interface UseWorkerHoursReportOptions {
  dateRange: DateRangeFilter
  workerId?: string
}

interface WorkerHoursResult {
  data: WorkerHoursRow[]
  totals: {
    totalWorkers: number
    totalShifts: number
    totalHours: number
    averageHoursPerWorker: number
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Fetches and aggregates completed shifts by worker within a date range.
 * Returns per-worker statistics: shift count, total hours, average hours per shift.
 */
export function useWorkerHoursReport({
  dateRange,
  workerId,
}: UseWorkerHoursReportOptions) {
  return useQuery<WorkerHoursResult>({
    queryKey: [
      'worker-hours-report',
      {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        workerId,
      },
    ],
    queryFn: async () => {
      const supabase = createClient()

      // Query completed shifts with worker profile data
      let query = supabase
        .from('shifts')
        .select(
          'id, scheduled_start, scheduled_end, actual_start, actual_end, worker_id, workers!inner(id, profiles!inner(first_name, last_name))'
        )
        .eq('status', 'completed')
        .gte('scheduled_start', dateRange.from.toISOString())
        .lte('scheduled_start', dateRange.to.toISOString())

      // Optional worker filter
      if (workerId) {
        query = query.eq('worker_id', workerId)
      }

      const { data: shifts, error } = await (query as any)
      if (error) throw error

      // Aggregate by worker
      const workerMap = new Map<
        string,
        {
          workerId: string
          workerName: string
          shiftCount: number
          totalMinutes: number
        }
      >()

      for (const shift of shifts ?? []) {
        const wId = shift.worker_id as string
        const worker = shift.workers as {
          id: string
          profiles: { first_name: string; last_name: string }
        }
        const workerName = worker?.profiles
          ? `${worker.profiles.first_name} ${worker.profiles.last_name}`
          : 'Unknown Worker'

        // Calculate hours from actual times if available, else scheduled
        const start = shift.actual_start || shift.scheduled_start
        const end = shift.actual_end || shift.scheduled_end
        const minutes =
          (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60)

        const existing = workerMap.get(wId)
        if (existing) {
          existing.shiftCount += 1
          existing.totalMinutes += minutes
        } else {
          workerMap.set(wId, {
            workerId: wId,
            workerName,
            shiftCount: 1,
            totalMinutes: minutes,
          })
        }
      }

      // Convert to output format
      const data: WorkerHoursRow[] = Array.from(workerMap.values())
        .map((w) => ({
          workerId: w.workerId,
          workerName: w.workerName,
          shiftCount: w.shiftCount,
          totalHours: Math.round((w.totalMinutes / 60) * 100) / 100,
          averageHoursPerShift:
            w.shiftCount > 0
              ? Math.round((w.totalMinutes / 60 / w.shiftCount) * 100) / 100
              : 0,
        }))
        .sort((a, b) => b.totalHours - a.totalHours) // Sort by most hours first

      // Calculate totals
      const totalWorkers = data.length
      const totalShifts = data.reduce((sum, w) => sum + w.shiftCount, 0)
      const totalHours = data.reduce((sum, w) => sum + w.totalHours, 0)
      const averageHoursPerWorker =
        totalWorkers > 0
          ? Math.round((totalHours / totalWorkers) * 100) / 100
          : 0

      return {
        data,
        totals: {
          totalWorkers,
          totalShifts,
          totalHours: Math.round(totalHours * 100) / 100,
          averageHoursPerWorker,
        },
      }
    },
    staleTime: 60_000, // 1 minute
  })
}
