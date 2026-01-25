'use client'

import { differenceInDays, format, parseISO, isPast } from 'date-fns'
import { Calendar } from 'lucide-react'

interface PlanInfoCardProps {
  startDate: string
  endDate: string
}

export function PlanInfoCard({ startDate, endDate }: PlanInfoCardProps) {
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  const today = new Date()
  const daysRemaining = differenceInDays(end, today)
  const isExpired = isPast(end)

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">Plan Period</h3>
      </div>
      <div className="mt-4 space-y-3">
        <div className="text-lg font-semibold">
          {format(start, 'd MMM yyyy')} — {format(end, 'd MMM yyyy')}
        </div>
        {isExpired ? (
          <div className="text-sm font-medium text-red-600">
            Plan expired
          </div>
        ) : (
          <div className={`text-sm font-medium ${daysRemaining <= 30 ? 'text-amber-600' : 'text-muted-foreground'}`}>
            {daysRemaining} days remaining
          </div>
        )}
      </div>
    </div>
  )
}
