'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { DateRangeFilter, ParticipantActivityRow } from '@/lib/reports/types'

// ─── Types ──────────────────────────────────────────────────────────────────

interface UseParticipantActivityReportOptions {
  dateRange: DateRangeFilter
  participantId?: string
}

interface ParticipantActivityResult {
  data: ParticipantActivityRow[]
  totals: {
    totalParticipants: number
    totalShifts: number
    totalHours: number
    averageShiftsPerParticipant: number
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Fetches and aggregates completed shifts by participant within a date range.
 * Returns per-participant statistics: shift count, total hours, last shift date.
 */
export function useParticipantActivityReport({
  dateRange,
  participantId,
}: UseParticipantActivityReportOptions) {
  return useQuery<ParticipantActivityResult>({
    queryKey: [
      'participant-activity-report',
      {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        participantId,
      },
    ],
    queryFn: async () => {
      const supabase = createClient()

      // Query completed shifts with participant data
      let query = supabase
        .from('shifts')
        .select(
          'id, scheduled_start, scheduled_end, actual_start, actual_end, participant_id, participants!inner(id, first_name, last_name)'
        )
        .eq('status', 'completed')
        .gte('scheduled_start', dateRange.from.toISOString())
        .lte('scheduled_start', dateRange.to.toISOString())

      // Optional participant filter
      if (participantId) {
        query = query.eq('participant_id', participantId)
      }

      const { data: shifts, error } = await (query as any)
      if (error) throw error

      // Aggregate by participant
      const participantMap = new Map<
        string,
        {
          participantId: string
          participantName: string
          shiftCount: number
          totalMinutes: number
          lastShiftDate: string | null
        }
      >()

      for (const shift of shifts ?? []) {
        const pId = shift.participant_id as string
        const participant = shift.participants as {
          id: string
          first_name: string
          last_name: string
        }
        const participantName = participant
          ? `${participant.first_name} ${participant.last_name}`
          : 'Unknown Participant'

        // Calculate hours from actual times if available, else scheduled
        const start = shift.actual_start || shift.scheduled_start
        const end = shift.actual_end || shift.scheduled_end
        const minutes =
          (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60)

        const shiftDate = shift.scheduled_start.split('T')[0]

        const existing = participantMap.get(pId)
        if (existing) {
          existing.shiftCount += 1
          existing.totalMinutes += minutes
          // Track most recent shift date
          if (!existing.lastShiftDate || shiftDate > existing.lastShiftDate) {
            existing.lastShiftDate = shiftDate
          }
        } else {
          participantMap.set(pId, {
            participantId: pId,
            participantName,
            shiftCount: 1,
            totalMinutes: minutes,
            lastShiftDate: shiftDate,
          })
        }
      }

      // Convert to output format
      const data: ParticipantActivityRow[] = Array.from(participantMap.values())
        .map((p) => ({
          participantId: p.participantId,
          participantName: p.participantName,
          shiftCount: p.shiftCount,
          totalHours: Math.round((p.totalMinutes / 60) * 100) / 100,
          lastShiftDate: p.lastShiftDate,
        }))
        .sort((a, b) => b.shiftCount - a.shiftCount) // Sort by most shifts first

      // Calculate totals
      const totalParticipants = data.length
      const totalShifts = data.reduce((sum, p) => sum + p.shiftCount, 0)
      const totalHours = data.reduce((sum, p) => sum + p.totalHours, 0)
      const averageShiftsPerParticipant =
        totalParticipants > 0
          ? Math.round((totalShifts / totalParticipants) * 100) / 100
          : 0

      return {
        data,
        totals: {
          totalParticipants,
          totalShifts,
          totalHours: Math.round(totalHours * 100) / 100,
          averageShiftsPerParticipant,
        },
      }
    },
    staleTime: 60_000, // 1 minute
  })
}
