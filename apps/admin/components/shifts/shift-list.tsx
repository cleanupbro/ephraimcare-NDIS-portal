'use client'

import { useState, useMemo } from 'react'
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format } from 'date-fns'
import { CalendarOff } from 'lucide-react'
import { Skeleton } from '@ephraimcare/ui'
import { useShifts } from '@/hooks/use-shifts'
import { ShiftCard } from './shift-card'
import { ShiftWeekNav } from './shift-week-nav'
import type { ShiftWithRelations } from '@ephraimcare/types'

interface ShiftListProps {
  initialData: ShiftWithRelations[]
}

export function ShiftList({ initialData }: ShiftListProps) {
  const [weekStart, setWeekStart] = useState<Date>(
    () => startOfWeek(new Date(), { weekStartsOn: 1 })
  )

  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart])

  const { data: shifts, isLoading } = useShifts({
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    initialData,
  })

  // Group shifts by day
  const groupedShifts = useMemo(() => {
    if (!shifts) return {}

    const groups: Record<string, ShiftWithRelations[]> = {}
    for (const shift of shifts) {
      const dayKey = format(new Date(shift.scheduled_start), 'yyyy-MM-dd')
      if (!groups[dayKey]) {
        groups[dayKey] = []
      }
      groups[dayKey].push(shift)
    }
    return groups
  }, [shifts])

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
                  <ShiftCard key={shift.id} shift={shift} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
