'use client'

import { useState } from 'react'
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
  Input,
  Label,
} from '@ephraimcare/ui'
import { CheckCircle } from 'lucide-react'
import { useMarkNdiaReported } from '@/hooks/use-incidents'

interface NdiaReportDialogProps {
  incidentId: string
  incidentTitle: string
  userId: string
  onSuccess?: () => void
}

export function NdiaReportDialog({
  incidentId,
  incidentTitle,
  userId,
  onSuccess,
}: NdiaReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [referenceNumber, setReferenceNumber] = useState('')
  const markReported = useMarkNdiaReported()

  async function handleSubmit() {
    if (!referenceNumber.trim()) return

    markReported.mutate(
      {
        id: incidentId,
        ndia_reference_number: referenceNumber.trim(),
        ndia_reported_by: userId,
      },
      {
        onSuccess: () => {
          setOpen(false)
          setReferenceNumber('')
          onSuccess?.()
        },
      }
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark as Reported to NDIA
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark Incident as Reported to NDIA</AlertDialogTitle>
          <AlertDialogDescription>
            Confirm that incident "{incidentTitle}" has been reported to NDIA and enter the
            reference number provided.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="reference">NDIA Reference Number</Label>
          <Input
            id="reference"
            placeholder="e.g., NDIA-2026-123456"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Enter the reference number received from NDIA after reporting.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={!referenceNumber.trim() || markReported.isPending}
          >
            {markReported.isPending ? 'Saving...' : 'Confirm Report'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
