"use client"

import { differenceInDays, parseISO } from 'date-fns'
import { Badge } from '@ephraimcare/ui'

interface PlanCountdownProps {
  endDate: string | null | undefined
}

export function PlanCountdown({ endDate }: PlanCountdownProps) {
  if (!endDate) {
    return <Badge variant="secondary">No active plan</Badge>
  }

  const end = parseISO(endDate)
  const today = new Date()
  const daysRemaining = differenceInDays(end, today)

  if (daysRemaining < 0) {
    return <Badge variant="destructive">Plan expired</Badge>
  }

  if (daysRemaining < 30) {
    return (
      <Badge variant="destructive">
        {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
      </Badge>
    )
  }

  if (daysRemaining < 60) {
    return (
      <Badge className="border-transparent bg-amber-100 text-amber-800 hover:bg-amber-100/80">
        {daysRemaining} days remaining
      </Badge>
    )
  }

  return (
    <Badge variant="default">
      {daysRemaining} days remaining
    </Badge>
  )
}
