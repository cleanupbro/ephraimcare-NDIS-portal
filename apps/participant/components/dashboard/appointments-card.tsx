'use client'

import { format, parseISO } from 'date-fns'
import { Clock } from 'lucide-react'

interface Appointment {
  id: string
  scheduled_start: string
  scheduled_end: string
  support_type: string
  worker: { first_name: string; last_name: string } | null
}

interface AppointmentsCardProps {
  appointments: Appointment[]
}

export function AppointmentsCard({ appointments }: AppointmentsCardProps) {
  if (appointments.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">Upcoming Appointments</h3>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">No upcoming appointments scheduled</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">Upcoming Appointments</h3>
      </div>
      <ul className="mt-4 divide-y divide-border">
        {appointments.map((apt) => {
          const start = parseISO(apt.scheduled_start)
          const end = parseISO(apt.scheduled_end)
          const workerName = apt.worker
            ? `${apt.worker.first_name} ${apt.worker.last_name}`
            : 'Worker TBA'

          return (
            <li key={apt.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{format(start, 'EEEE, d MMM')}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(start, 'h:mm a')} — {format(end, 'h:mm a')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{workerName}</p>
                  <p className="text-xs text-muted-foreground">{apt.support_type}</p>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
