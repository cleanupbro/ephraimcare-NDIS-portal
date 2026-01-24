import { useQuery } from '@tanstack/react-query'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { supabase } from '../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShiftCheckIn {
  id: string
  shift_id: string
  check_in_time: string
  check_in_latitude: number
  check_in_longitude: number
  check_out_time: string | null
  check_out_latitude: number | null
  check_out_longitude: number | null
  check_out_type: 'manual' | 'auto' | 'admin_override' | null
  duration_minutes: number | null
  synced_from_offline: boolean
}

export interface ShiftWithParticipant {
  id: string
  participant_id: string
  worker_id: string
  scheduled_start: string
  scheduled_end: string
  actual_start: string | null
  actual_end: string | null
  status: string
  support_type: string | null
  notes: string | null
  organization_id: string
  created_at: string
  updated_at: string
  participants: {
    id: string
    first_name: string
    last_name: string
    address_line_1: string | null
    suburb: string | null
    latitude: number | null
    longitude: number | null
    notes: string | null
  } | null
  shift_check_ins: ShiftCheckIn[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SHIFT_SELECT = `
  id,
  participant_id,
  worker_id,
  scheduled_start,
  scheduled_end,
  actual_start,
  actual_end,
  status,
  support_type,
  notes,
  organization_id,
  created_at,
  updated_at,
  participants (
    id,
    first_name,
    last_name,
    address_line_1,
    suburb,
    latitude,
    longitude,
    notes
  ),
  shift_check_ins (
    id,
    shift_id,
    check_in_time,
    check_in_latitude,
    check_in_longitude,
    check_out_time,
    check_out_latitude,
    check_out_longitude,
    check_out_type,
    duration_minutes,
    synced_from_offline
  )
` as const

async function fetchWorkerShifts(
  workerId: string,
  rangeStart: Date,
  rangeEnd: Date
): Promise<ShiftWithParticipant[]> {
  const { data, error } = await (supabase
    .from('shifts')
    .select(SHIFT_SELECT)
    .eq('worker_id', workerId)
    .neq('status', 'cancelled')
    .gte('scheduled_start', rangeStart.toISOString())
    .lte('scheduled_start', rangeEnd.toISOString())
    .order('scheduled_start', { ascending: true }) as any)

  if (error) throw error
  return (data ?? []) as ShiftWithParticipant[]
}

async function fetchShiftById(
  shiftId: string
): Promise<ShiftWithParticipant | null> {
  const { data, error } = await (supabase
    .from('shifts')
    .select(SHIFT_SELECT)
    .eq('id', shiftId)
    .single() as any)

  if (error) throw error
  return (data ?? null) as ShiftWithParticipant | null
}

// ─── Query Hooks ──────────────────────────────────────────────────────────────

/**
 * Fetches today's shifts for the given worker, ordered by start time.
 * Stale time: 2 minutes.
 */
export function useTodayShifts(workerId: string | undefined) {
  return useQuery({
    queryKey: ['shifts', 'today', workerId],
    queryFn: () => {
      const now = new Date()
      return fetchWorkerShifts(workerId!, startOfDay(now), endOfDay(now))
    },
    enabled: !!workerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Fetches the week's shifts for the given worker.
 * weekStart defaults to current week start (Monday).
 * Stale time: 5 minutes.
 */
export function useWeekShifts(
  workerId: string | undefined,
  weekStart?: Date
) {
  const baseDate = weekStart ?? new Date()
  const start = startOfWeek(baseDate, { weekStartsOn: 1 })
  const end = endOfWeek(baseDate, { weekStartsOn: 1 })

  return useQuery({
    queryKey: ['shifts', 'week', workerId, start.toISOString()],
    queryFn: () => fetchWorkerShifts(workerId!, start, end),
    enabled: !!workerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetches a single shift with full participant and check-in detail.
 */
export function useShiftDetail(shiftId: string | undefined) {
  return useQuery({
    queryKey: ['shifts', 'detail', shiftId],
    queryFn: () => fetchShiftById(shiftId!),
    enabled: !!shiftId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}
