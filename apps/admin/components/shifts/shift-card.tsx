'use client'

import type { ShiftWithRelations } from '@ephraimcare/types'
import { SHIFT_STATUS_COLORS, type ShiftStatusKey } from '@/lib/shifts/constants'
import { Clock, User, Briefcase } from 'lucide-react'

interface ShiftCardProps {
  shift: ShiftWithRelations
  onClick?: () => void
}

function formatShiftTime(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Australia/Sydney',
  })
}

function calculateDuration(start: string, end: string): string {
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  const totalMinutes = Math.round((endMs - startMs) / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

export function ShiftCard({ shift, onClick }: ShiftCardProps) {
  const statusKey = shift.status as ShiftStatusKey
  const statusStyle = SHIFT_STATUS_COLORS[statusKey] ?? SHIFT_STATUS_COLORS.pending

  const participantName = shift.participants
    ? `${shift.participants.first_name} ${shift.participants.last_name}`
    : 'Unassigned participant'

  const workerName = shift.workers?.profiles
    ? `${shift.workers.profiles.first_name} ${shift.workers.profiles.last_name}`
    : 'Unassigned worker'

  const timeRange = `${formatShiftTime(shift.scheduled_start)} - ${formatShiftTime(shift.scheduled_end)}`
  const duration = calculateDuration(shift.scheduled_start, shift.scheduled_end)

  return (
    <div
      className={`rounded-lg border bg-card p-4 border-l-4 ${statusStyle.border} ${onClick ? 'cursor-pointer hover:bg-accent/50 transition-colors' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1.5">
          {/* Time range and duration */}
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{timeRange}</span>
            <span className="text-xs text-muted-foreground">({duration})</span>
          </div>

          {/* Participant */}
          <div className="flex items-center gap-2 text-sm">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{participantName}</span>
          </div>

          {/* Worker */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Briefcase className="h-3.5 w-3.5" />
            <span>{workerName}</span>
          </div>

          {/* Support type */}
          {shift.support_type && (
            <p className="text-xs text-muted-foreground pl-5.5">
              {shift.support_type}
            </p>
          )}
        </div>

        {/* Status badge */}
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle.badge}`}>
          {statusStyle.text}
        </span>
      </div>
    </div>
  )
}
