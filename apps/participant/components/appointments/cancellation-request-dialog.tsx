'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Label,
  Textarea,
} from '@ephraimcare/ui'
import { X } from 'lucide-react'
import { useCreateCancellationRequest, type Appointment } from '@/hooks/use-appointments'

interface CancellationRequestDialogProps {
  appointment: Appointment
  participantId: string
  organizationId: string
  onSuccess?: () => void
}

export function CancellationRequestDialog({
  appointment,
  participantId,
  organizationId,
  onSuccess,
}: CancellationRequestDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const createRequest = useCreateCancellationRequest()

  const workerName = appointment.workers?.profiles
    ? `${appointment.workers.profiles.first_name} ${appointment.workers.profiles.last_name}`
    : 'Unassigned'

  async function handleSubmit() {
    setError('')

    if (reason.trim().length < 10) {
      setError('Please provide a reason (at least 10 characters)')
      return
    }

    createRequest.mutate(
      {
        shift_id: appointment.id,
        participant_id: participantId,
        organization_id: organizationId,
        reason: reason.trim(),
      },
      {
        onSuccess: () => {
          setOpen(false)
          setReason('')
          onSuccess?.()
        },
        onError: (err) => {
          setError('Failed to submit request. Please try again.')
        },
      }
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <X className="h-4 w-4 mr-1" />
          Request Cancel
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Request Appointment Cancellation</AlertDialogTitle>
          <AlertDialogDescription>
            Please provide a reason for cancelling this appointment. Your request will be reviewed
            by the care team.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Appointment details */}
          <div className="rounded-md bg-muted p-3">
            <p className="text-sm font-medium">
              {format(parseISO(appointment.scheduled_start), 'EEEE, d MMMM yyyy')}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(parseISO(appointment.scheduled_start), 'h:mm a')} -{' '}
              {format(parseISO(appointment.scheduled_end), 'h:mm a')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              with {workerName}
            </p>
          </div>

          {/* Reason input */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for cancellation</Label>
            <Textarea
              id="reason"
              placeholder="Please explain why you need to cancel this appointment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={createRequest.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {createRequest.isPending ? 'Submitting...' : 'Submit Request'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
