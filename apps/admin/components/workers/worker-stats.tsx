"use client"

import { Clock, Calendar, CalendarClock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Card, CardContent, Skeleton } from '@ephraimcare/ui'
import { useWorkerStats } from '@/hooks/use-worker-stats'

interface WorkerStatsProps {
  workerId: string
}

export function WorkerStats({ workerId }: WorkerStatsProps) {
  const { data: stats, isLoading } = useWorkerStats(workerId)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const hoursThisWeek = stats?.hoursThisWeek ?? 0
  const hoursThisMonth = stats?.hoursThisMonth ?? 0
  const nextShift = stats?.nextShift ?? null

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Hours This Week */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Hours This Week</p>
            <p className="text-xl font-semibold">{hoursThisWeek.toFixed(1)} hrs</p>
          </div>
        </CardContent>
      </Card>

      {/* Hours This Month */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Hours This Month</p>
            <p className="text-xl font-semibold">{hoursThisMonth.toFixed(1)} hrs</p>
          </div>
        </CardContent>
      </Card>

      {/* Next Shift */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Next Shift</p>
            {nextShift ? (
              <div>
                <p className="text-sm font-semibold">
                  {nextShift.participants.first_name} {nextShift.participants.last_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(nextShift.scheduled_start), 'd MMM, h:mm a')}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming shifts</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
