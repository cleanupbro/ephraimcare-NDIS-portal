'use client'

import { format, parseISO } from 'date-fns'
import { Card, CardContent, Badge } from '@ephraimcare/ui'
import { Calendar, Clock, User } from 'lucide-react'
import { CancellationRequestDialog } from './cancellation-request-dialog'
import { usePendingCancellationRequest, type Appointment } from '@/hooks/use-appointments'

interface AppointmentCardProps {
  appointment: Appointment
  participantId: string
  organizationId: string
}

const SUPPORT_TYPE_LABELS: Record<string, string> = {
  personal_care: 'Personal Care',
  domestic_assistance: 'Domestic Assistance',
  community_access: 'Community Access',
  transport: 'Transport',
  therapy: 'Therapy',
  respite: 'Respite',
}

export function AppointmentCard({
  appointment,
  participantId,
  organizationId,
}: AppointmentCardProps) {
  const { data: pendingRequest } = usePendingCancellationRequest(appointment.id)

  const workerName = appointment.workers?.profiles
    ? `${appointment.workers.profiles.first_name} ${appointment.workers.profiles.last_name}`
    : 'Worker to be assigned'

  const hasPendingRequest = !!pendingRequest

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Date */}
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {format(parseISO(appointment.scheduled_start), 'EEEE, d MMMM yyyy')}
              </span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span>
                {format(parseISO(appointment.scheduled_start), 'h:mm a')} -{' '}
                {format(parseISO(appointment.scheduled_end), 'h:mm a')}
              </span>
            </div>

            {/* Worker */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <User className="h-4 w-4" />
              <span>{workerName}</span>
            </div>

            {/* Support Type */}
            <Badge variant="outline">
              {SUPPORT_TYPE_LABELS[appointment.support_type] || appointment.support_type}
            </Badge>
          </div>

          {/* Actions */}
          <div className="shrink-0">
            {hasPendingRequest ? (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Cancellation Pending
              </Badge>
            ) : (
              <CancellationRequestDialog
                appointment={appointment}
                participantId={participantId}
                organizationId={organizationId}
              />
            )}
          </div>
        </div>

        {/* Notes */}
        {appointment.notes && (
          <p className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
            {appointment.notes}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
