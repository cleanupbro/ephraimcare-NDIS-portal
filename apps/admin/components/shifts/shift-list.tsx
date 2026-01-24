'use client'

import { useState, useMemo, useEffect } from 'react'
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format } from 'date-fns'
import { CalendarOff } from 'lucide-react'
import { Skeleton } from '@ephraimcare/ui'
import { createClient } from '@/lib/supabase/client'
import { useShifts } from '@/hooks/use-shifts'
import { ShiftCard } from './shift-card'
import { ShiftWeekNav } from './shift-week-nav'
import { ShiftFilters, type ShiftFilterState } from './shift-filters'
import { ShiftDetailSheet } from './shift-detail-sheet'
import type { ShiftWithRelations } from '@ephraimcare/types'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ShiftListProps {
  initialData: ShiftWithRelations[]
}

interface ParticipantOption {
  id: string
  first_name: string
  last_name: string
}

interface WorkerOption {
  id: string
  profiles: { first_name: string; last_name: string } | null
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ShiftList({ initialData }: ShiftListProps) {
  const [weekStart, setWeekStart] = useState<Date>(
    () => startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [filters, setFilters] = useState<ShiftFilterState>({
    participantId: '',
    workerId: '',
    status: '',
    supportType: '',
  })
  const [selectedShift, setSelectedShift] = useState<ShiftWithRelations | null>(null)
  const [participants, setParticipants] = useState<ParticipantOption[]>([])
  const [workers, setWorkers] = useState<WorkerOption[]>([])

  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart])

  const { data: shifts, isLoading } = useShifts({
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    initialData,
  })

  // Fetch participants and workers for filter dropdowns
  useEffect(() => {
    const supabase = createClient()

    async function fetchFilterOptions() {
      const [participantsRes, workersRes] = await Promise.all([
        (supabase
          .from('participants')
          .select('id, first_name, last_name')
          .order('first_name', { ascending: true }) as any),
        (supabase
          .from('workers')
          .select('id, profiles(first_name, last_name)')
          .eq('is_active', true)
          .order('created_at', { ascending: true }) as any),
      ])

      if (participantsRes.data) {
        setParticipants(participantsRes.data as ParticipantOption[])
      }
      if (workersRes.data) {
        setWorkers(workersRes.data as WorkerOption[])
      }
    }

    fetchFilterOptions()
  }, [])

  // Apply client-side filters
  const filteredShifts = useMemo(() => {
    if (!shifts) return []

    return shifts.filter((shift) => {
      // Participant filter
      if (filters.participantId && shift.participant_id !== filters.participantId) {
        return false
      }

      // Worker filter
      if (filters.workerId && shift.worker_id !== filters.workerId) {
        return false
      }

      // Status filter
      if (filters.status) {
        // Show only the selected status
        if (shift.status !== filters.status) return false
      } else {
        // Default: hide cancelled shifts
        if (shift.status === 'cancelled') return false
      }

      // Support type filter
      if (filters.supportType && shift.support_type !== filters.supportType) {
        return false
      }

      return true
    })
  }, [shifts, filters])

  // Group shifts by day
  const groupedShifts = useMemo(() => {
    const groups: Record<string, ShiftWithRelations[]> = {}
    for (const shift of filteredShifts) {
      const dayKey = format(new Date(shift.scheduled_start), 'yyyy-MM-dd')
      if (!groups[dayKey]) {
        groups[dayKey] = []
      }
      groups[dayKey].push(shift)
    }
    return groups
  }, [filteredShifts])

  const sortedDays = useMemo(() => {
    return Object.keys(groupedShifts).sort()
  }, [groupedShifts])

  function handlePrev() {
    setWeekStart((prev) => subWeeks(prev, 1))
  }

  function handleNext() {
    setWeekStart((prev) => addWeeks(prev, 1))
  }

  function handleToday() {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <ShiftFilters
          filters={filters}
          onFiltersChange={setFilters}
          participants={participants}
          workers={workers}
        />
        <div className="flex justify-center">
          <ShiftWeekNav
            currentWeekStart={weekStart}
            onPrev={handlePrev}
            onNext={handleNext}
            onToday={handleToday}
          />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ShiftFilters
        filters={filters}
        onFiltersChange={setFilters}
        participants={participants}
        workers={workers}
      />

      <div className="flex justify-center">
        <ShiftWeekNav
          currentWeekStart={weekStart}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
        />
      </div>

      {sortedDays.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarOff className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No shifts scheduled this week
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Use &ldquo;Schedule Shift&rdquo; to add shifts for this period.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDays.map((dayKey) => (
            <div key={dayKey}>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {format(new Date(dayKey + 'T00:00:00'), 'EEEE, d MMM')}
              </h3>
              <div className="space-y-2">
                {groupedShifts[dayKey].map((shift) => (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    onClick={() => setSelectedShift(shift)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ShiftDetailSheet
        shift={selectedShift}
        open={!!selectedShift}
        onClose={() => setSelectedShift(null)}
      />
    </div>
  )
}
