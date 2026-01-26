'use client'

import { useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns'
import { Button } from '@ephraimcare/ui'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { DATE_RANGE_PRESETS } from '@/lib/reports/constants'
import type { DateRangeFilter } from '@/lib/reports/types'

// ─── Types ──────────────────────────────────────────────────────────────────

interface DateRangePickerProps {
  value: DateRangeFilter
  onChange: (range: DateRangeFilter) => void
}

// ─── Component ──────────────────────────────────────────────────────────────

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(value.from)
  const [selecting, setSelecting] = useState<'from' | 'to' | null>(null)
  const [tempFrom, setTempFrom] = useState<Date | null>(null)

  // Calendar grid days
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  function handlePresetClick(preset: (typeof DATE_RANGE_PRESETS)[number]) {
    const range = preset.getValue()
    onChange(range)
    setIsOpen(false)
  }

  function handleDayClick(day: Date) {
    if (selecting === 'from' || tempFrom === null) {
      setTempFrom(day)
      setSelecting('to')
    } else {
      // Ensure from is before to
      const from = day < tempFrom ? day : tempFrom
      const to = day < tempFrom ? tempFrom : day
      onChange({ from, to })
      setTempFrom(null)
      setSelecting(null)
      setIsOpen(false)
    }
  }

  function isInRange(day: Date): boolean {
    if (tempFrom) {
      return day >= tempFrom && day <= value.to
    }
    return day >= value.from && day <= value.to
  }

  function isRangeStart(day: Date): boolean {
    return isSameDay(day, tempFrom ?? value.from)
  }

  function isRangeEnd(day: Date): boolean {
    return isSameDay(day, value.to)
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="min-w-[260px] justify-start text-left font-normal"
      >
        <Calendar className="mr-2 h-4 w-4" />
        {format(value.from, 'dd MMM yyyy')} - {format(value.to, 'dd MMM yyyy')}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 rounded-lg border border-border bg-background shadow-lg">
          <div className="flex">
            {/* Presets */}
            <div className="border-r border-border p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">Presets</p>
              {DATE_RANGE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset)}
                  className="block w-full text-left px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Calendar */}
            <div className="p-3">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 mb-1">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
                  <div
                    key={day}
                    className="h-8 w-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Day Grid */}
              <div className="grid grid-cols-7">
                {days.map((day, i) => {
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const inRange = isInRange(day)
                  const isStart = isRangeStart(day)
                  const isEnd = isRangeEnd(day)
                  const isToday = isSameDay(day, new Date())

                  return (
                    <button
                      key={i}
                      onClick={() => handleDayClick(day)}
                      disabled={!isCurrentMonth}
                      className={`
                        h-8 w-8 flex items-center justify-center text-sm rounded-md transition-colors
                        ${!isCurrentMonth ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted'}
                        ${inRange && !isStart && !isEnd ? 'bg-primary/10' : ''}
                        ${isStart || isEnd ? 'bg-primary text-primary-foreground' : ''}
                        ${isToday && !isStart && !isEnd ? 'font-bold text-primary' : ''}
                      `}
                    >
                      {format(day, 'd')}
                    </button>
                  )
                })}
              </div>

              {/* Selection hint */}
              {selecting === 'to' && tempFrom && (
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  Select end date
                </p>
              )}
            </div>
          </div>

          {/* Close backdrop */}
          <div
            className="fixed inset-0 -z-10"
            onClick={() => {
              setIsOpen(false)
              setTempFrom(null)
              setSelecting(null)
            }}
          />
        </div>
      )}
    </div>
  )
}
