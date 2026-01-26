'use client'

import { Calendar, Frown } from 'lucide-react'
import { useParticipantAppointments } from '@/hooks/use-appointments'
import { AppointmentCard } from '@/components/appointments/appointment-card'

export default function AppointmentsPage() {
  const { data, isLoading, error } = useParticipantAppointments()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Upcoming Appointments</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Upcoming Appointments</h1>
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          Unable to load appointments. Please try refreshing the page.
        </div>
      </div>
    )
  }

  const { participant, appointments } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Upcoming Appointments</h1>
        <p className="text-sm text-muted-foreground">
          View and manage your scheduled support sessions
        </p>
      </div>

      {appointments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">No Upcoming Appointments</h3>
          <p className="text-sm text-muted-foreground">
            You don't have any scheduled appointments. Contact your care team to book a session.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              participantId={participant.id}
              organizationId={participant.organization_id}
            />
          ))}
        </div>
      )}

      {/* Info footer */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium mb-1">Need to change an appointment?</h3>
        <p className="text-xs text-muted-foreground">
          You can request to cancel an appointment by clicking "Request Cancel" on any upcoming
          appointment. Your care team will review your request and get back to you.
        </p>
      </div>
    </div>
  )
}
