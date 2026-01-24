'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  Button,
  Textarea,
  Label,
} from '@ephraimcare/ui'
import { useCancelShift } from '@/hooks/use-cancel-shift'
import { shiftCancelSchema } from '@/lib/shifts/schemas'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ShiftCancelDialogProps {
  open: boolean
  onClose: () => void
  shiftId: string
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ShiftCancelDialog({ open, onClose, shiftId }: ShiftCancelDialogProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const cancelMutation = useCancelShift(shiftId)

  function handleSubmit() {
    const result = shiftCancelSchema.safeParse({ cancellation_reason: reason })
    if (!result.success) {
      setError(result.error.errors[0]?.message ?? 'Invalid input')
      return
    }

    setError('')
    cancelMutation.mutate(
      { cancellation_reason: reason.trim() },
      {
        onSuccess: () => {
          setReason('')
          onClose()
        },
      }
    )
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setReason('')
      setError('')
      onClose()
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Shift</AlertDialogTitle>
          <AlertDialogDescription>
            This will cancel the shift. The shift data will be preserved but marked as cancelled.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="cancel-reason">Cancellation Reason</Label>
          <Textarea
            id="cancel-reason"
            placeholder="Enter the reason for cancellation..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              if (error) setError('')
            }}
            rows={3}
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Keep Shift</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Shift'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
