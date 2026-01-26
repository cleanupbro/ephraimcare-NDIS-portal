'use client'

import { useEffect, useState } from 'react'
import { differenceInHours, differenceInMinutes, addHours, parseISO } from 'date-fns'
import { Clock, AlertTriangle } from 'lucide-react'

interface NdiaCountdownProps {
  incidentDate: string
  compact?: boolean
}

export function NdiaCountdown({ incidentDate, compact = false }: NdiaCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number
    minutes: number
    isOverdue: boolean
  } | null>(null)

  useEffect(() => {
    function calculateRemaining() {
      const deadline = addHours(parseISO(incidentDate), 24)
      const now = new Date()

      if (now > deadline) {
        const overdueHours = differenceInHours(now, deadline)
        const overdueMinutes = differenceInMinutes(now, deadline) % 60
        setTimeRemaining({
          hours: overdueHours,
          minutes: overdueMinutes,
          isOverdue: true,
        })
      } else {
        const hoursLeft = differenceInHours(deadline, now)
        const minutesLeft = differenceInMinutes(deadline, now) % 60
        setTimeRemaining({
          hours: hoursLeft,
          minutes: minutesLeft,
          isOverdue: false,
        })
      }
    }

    calculateRemaining()
    const interval = setInterval(calculateRemaining, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [incidentDate])

  if (!timeRemaining) return null

  const { hours, minutes, isOverdue } = timeRemaining

  // Color coding
  let colorClass = 'text-green-600 bg-green-50 border-green-200'
  if (isOverdue) {
    colorClass = 'text-red-600 bg-red-50 border-red-200'
  } else if (hours < 4) {
    colorClass = 'text-red-600 bg-red-50 border-red-200'
  } else if (hours < 12) {
    colorClass = 'text-amber-600 bg-amber-50 border-amber-200'
  }

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${colorClass}`}>
        {isOverdue ? (
          <>
            <AlertTriangle className="h-3 w-3" />
            Overdue {hours}h {minutes}m
          </>
        ) : (
          <>
            <Clock className="h-3 w-3" />
            {hours}h {minutes}m left
          </>
        )}
      </span>
    )
  }

  return (
    <div className={`flex items-center gap-3 rounded-md border p-3 ${colorClass}`}>
      {isOverdue ? (
        <AlertTriangle className="h-5 w-5 shrink-0" />
      ) : (
        <Clock className="h-5 w-5 shrink-0" />
      )}
      <div>
        <p className="text-sm font-medium">
          {isOverdue ? 'NDIA Report Overdue' : 'NDIA Report Required'}
        </p>
        <p className="text-xs">
          {isOverdue
            ? `Deadline was ${hours}h ${minutes}m ago`
            : `${hours}h ${minutes}m remaining to report`}
        </p>
      </div>
    </div>
  )
}
