'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@ephraimcare/ui/components/dialog'
import { Button } from '@ephraimcare/ui/components/button'
import { Textarea } from '@ephraimcare/ui/components/textarea'
import { Label } from '@ephraimcare/ui/components/label'
import { Loader2 } from 'lucide-react'

import { useAddProgressNote } from '@/hooks/use-goals'
import { toast } from '@/lib/toast'

interface GoalProgressModalProps {
  open: boolean
  onClose: () => void
  goalId: string
  goalTitle: string
  participantId: string
  shiftId?: string
  workerId?: string
}

export function GoalProgressModal({
  open,
  onClose,
  goalId,
  goalTitle,
  participantId,
  shiftId,
  workerId,
}: GoalProgressModalProps) {
  const [rating, setRating] = useState<number>(3)
  const addProgress = useAddProgressNote()

  const form = useForm({
    defaultValues: {
      note: '',
    },
  })

  const onSubmit = async (data: { note: string }) => {
    if (data.note.length < 10) {
      toast({ title: 'Note must be at least 10 characters', variant: 'error' })
      return
    }

    try {
      await addProgress.mutateAsync({
        goalId,
        participantId,
        shiftId,
        workerId,
        note: data.note,
        progressRating: rating,
      })
      toast({ title: 'Progress note added', variant: 'success' })
      form.reset()
      setRating(3)
      onClose()
    } catch (error) {
      toast({ title: 'Failed to add progress note', variant: 'error' })
    }
  }

  const ratingLabels = [
    'No progress',
    'Minimal progress',
    'Some progress',
    'Good progress',
    'Excellent progress',
  ]

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Progress Note</DialogTitle>
          <p className="text-sm text-muted-foreground">{goalTitle}</p>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">How did the participant progress on this goal?</Label>
            <Textarea
              id="note"
              placeholder="Describe the progress, observations, and any relevant details..."
              className="min-h-[100px]"
              {...form.register('note')}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label>Progress Rating</Label>
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`
                    flex-1 py-3 rounded-md border text-center transition-colors
                    ${rating === n
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-input'
                    }
                  `}
                >
                  <span className="text-lg font-bold">{n}</span>
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {ratingLabels[rating - 1]}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={addProgress.isPending}>
              {addProgress.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Progress
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
