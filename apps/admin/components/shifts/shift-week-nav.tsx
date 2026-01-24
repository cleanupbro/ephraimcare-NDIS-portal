'use client'

import { format } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@ephraimcare/ui'

interface ShiftWeekNavProps {
  currentWeekStart: Date
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

export function ShiftWeekNav({ currentWeekStart, onPrev, onNext, onToday }: ShiftWeekNavProps) {
  const weekEnd = new Date(currentWeekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const startLabel = format(currentWeekStart, 'd MMM')
  const endLabel = format(weekEnd, 'd MMM yyyy')

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={onPrev} aria-label="Previous week">
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="min-w-[160px] text-center text-sm font-medium">
        {startLabel} &ndash; {endLabel}
      </span>

      <Button variant="outline" size="icon" onClick={onNext} aria-label="Next week">
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button variant="ghost" size="sm" onClick={onToday} className="ml-1 text-xs">
        Today
      </Button>
    </div>
  )
}
