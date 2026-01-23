'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
  Button,
  Input,
  Label,
} from '@ephraimcare/ui'
import { useArchiveParticipant, useHasActiveShifts } from '@/hooks/use-participants'
import { toast } from '@/lib/toast'

interface ArchiveDialogProps {
  participantId: string
  participantName: string
  onArchived?: () => void
}

export function ArchiveDialog({ participantId, participantName, onArchived }: ArchiveDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const { data: hasActiveShifts, isLoading: isCheckingShifts } = useHasActiveShifts(participantId)
  const archiveMutation = useArchiveParticipant()

  const isConfirmed = confirmText.trim() === participantName
  const isBlocked = hasActiveShifts === true

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setConfirmText('')
    }
  }

  const handleArchive = async () => {
    try {
      await archiveMutation.mutateAsync(participantId)
      toast({ title: 'Participant archived', variant: 'success' })
      setConfirmText('')
      setOpen(false)
      onArchived?.()
      router.push('/participants')
    } catch (error) {
      toast({
        title: 'Failed to archive participant',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'error',
      })
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <div className="relative">
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            disabled={isBlocked || isCheckingShifts}
          >
            Archive Participant
          </Button>
        </AlertDialogTrigger>
        {isBlocked && (
          <p className="mt-1 text-xs text-destructive max-w-[240px]">
            Cannot archive: participant has upcoming or active shifts. Cancel or reassign them first.
          </p>
        )}
      </div>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive {participantName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This participant will be hidden from the active list. Their data will be preserved
            but they will no longer appear in default views.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          <Label htmlFor="confirm-name" className="text-sm font-medium">
            Type &ldquo;{participantName}&rdquo; to confirm:
          </Label>
          <Input
            id="confirm-name"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type participant's full name"
            autoComplete="off"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleArchive}
            disabled={!isConfirmed || archiveMutation.isPending}
          >
            {archiveMutation.isPending ? 'Archiving...' : 'Archive'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
