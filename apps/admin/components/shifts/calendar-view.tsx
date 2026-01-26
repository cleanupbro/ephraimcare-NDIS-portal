'use client'

import { useState, useMemo } from 'react'
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addDays,
  subDays,
  parseISO,
} from 'date-fns'
import { Button, Badge } from '@ephraimcare/ui'
import { ChevronLeft, ChevronRight, Calendar, List } from 'lucide-react'

interface Shift {
  id: string
  scheduled_start: string
  scheduled_end: string
  status: string
  support_type: string
  participants?: { first_name: string; last_name: string } | null
  workers?: { profiles: { first_name: string; last_name: string } | null } | null
}

interface CalendarViewProps {
  shifts: Shift[]
  onShiftClick?: (shift: Shift) => void
  isLoading?: boolean
}

type ViewMode = 'week' | 'month' | 'day'

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  in_progress: 'bg-amber-100 text-amber-800 border-amber-200',
  completed: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function CalendarView({ shifts, onShiftClick, isLoading }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('week')

  // Get shifts for a specific day
  function getShiftsForDay(day: Date) {
    return shifts.filter((shift) => isSameDay(parseISO(shift.scheduled_start), day))
  }

  // Navigation handlers
  function goToToday() {
    setCurrentDate(new Date())
  }

  function goPrev() {
    if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1))
    else if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1))
    else setCurrentDate(subDays(currentDate, 1))
  }

  function goNext() {
    if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1))
    else if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1))
    else setCurrentDate(addDays(currentDate, 1))
  }

  // Calculate days to display
  const days = useMemo(() => {
    if (viewMode === 'day') {
      return [currentDate]
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      const end = endOfWeek(currentDate, { weekStartsOn: 1 })
      return eachDayOfInterval({ start, end })
    } else {
      const start = startOfMonth(currentDate)
      const end = endOfMonth(currentDate)
      // Include days from prev/next month to fill the grid
      const startOfGrid = startOfWeek(start, { weekStartsOn: 1 })
      const endOfGrid = endOfWeek(end, { weekStartsOn: 1 })
      return eachDayOfInterval({ start: startOfGrid, end: endOfGrid })
    }
  }, [currentDate, viewMode])

  // Render shift badge
  function renderShiftBadge(shift: Shift, compact = false) {
    const participant = shift.participants
      ? `${shift.participants.first_name} ${shift.participants.last_name.charAt(0)}.`
      : 'Unassigned'
    const time = format(parseISO(shift.scheduled_start), 'h:mm a')

    if (compact) {
      return (
        <div
          key={shift.id}
          onClick={() => onShiftClick?.(shift)}
          className={`h-1.5 w-1.5 rounded-full cursor-pointer ${
            shift.status === 'cancelled' ? 'bg-red-400' : 'bg-blue-400'
          }`}
          title={`${time} - ${participant}`}
        />
      )
    }

    return (
      <div
        key={shift.id}
        onClick={() => onShiftClick?.(shift)}
        className={`rounded border px-2 py-1 text-xs cursor-pointer truncate ${
          STATUS_COLORS[shift.status] || STATUS_COLORS.scheduled
        }`}
      >
        <span className="font-medium">{time}</span>
        <span className="mx-1">·</span>
        <span>{participant}</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="ghost" size="sm" onClick={goPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold ml-2">
            {viewMode === 'day'
              ? format(currentDate, 'EEEE, d MMMM yyyy')
              : viewMode === 'week'
                ? `${format(days[0], 'd MMM')} - ${format(days[6], 'd MMM yyyy')}`
                : format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>

        {/* View Toggle */}
        <div className="flex rounded-md bg-muted p-1">
          {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === mode
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      {isLoading ? (
        <div className="h-96 rounded-lg border border-border flex items-center justify-center">
          <span className="text-muted-foreground">Loading shifts...</span>
        </div>
      ) : viewMode === 'month' ? (
        /* Month View */
        <div className="rounded-lg border border-border overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border bg-muted">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="px-2 py-2 text-xs font-medium text-center">
                {day}
              </div>
            ))}
          </div>
          {/* Days grid */}
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const dayShifts = getShiftsForDay(day)
              const isToday = isSameDay(day, new Date())
              const isCurrentMonth = isSameMonth(day, currentDate)

              return (
                <div
                  key={i}
                  className={`min-h-24 border-b border-r border-border p-1 ${
                    !isCurrentMonth ? 'bg-muted/50' : ''
                  }`}
                >
                  <div
                    className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-primary text-primary-foreground' : ''
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                  <div className="flex flex-wrap gap-0.5">
                    {dayShifts.slice(0, 4).map((shift) => renderShiftBadge(shift, true))}
                    {dayShifts.length > 4 && (
                      <span className="text-xs text-muted-foreground">+{dayShifts.length - 4}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Week/Day View */
        <div className="rounded-lg border border-border overflow-hidden">
          {/* Day headers */}
          <div className={`grid border-b border-border bg-muted ${viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
            {days.map((day, i) => {
              const isToday = isSameDay(day, new Date())
              return (
                <div key={i} className="px-2 py-2 text-center border-r border-border last:border-r-0">
                  <div className="text-xs font-medium">{format(day, 'EEE')}</div>
                  <div
                    className={`text-lg font-semibold w-8 h-8 mx-auto flex items-center justify-center rounded-full ${
                      isToday ? 'bg-primary text-primary-foreground' : ''
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                </div>
              )
            })}
          </div>
          {/* Time grid */}
          <div className="max-h-96 overflow-y-auto">
            <div className={`grid ${viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
              {days.map((day, dayIndex) => {
                const dayShifts = getShiftsForDay(day)
                return (
                  <div key={dayIndex} className="border-r border-border last:border-r-0 min-h-64 p-1 space-y-1">
                    {dayShifts.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">No shifts</span>
                      </div>
                    ) : (
                      dayShifts.map((shift) => renderShiftBadge(shift))
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
