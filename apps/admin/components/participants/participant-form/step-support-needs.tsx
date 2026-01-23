'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Label, Button, Textarea } from '@ephraimcare/ui'
import { supportNeedsSchema, type SupportNeedsData } from '@/lib/participants/schemas'
import { useParticipantFormStore } from '@/lib/participants/form-store'

interface StepSupportNeedsProps {
  onSubmitAll: () => void
  onBack: () => void
  isSubmitting: boolean
}

export function StepSupportNeeds({ onSubmitAll, onBack, isSubmitting }: StepSupportNeedsProps) {
  const { supportNeeds, setSupportNeeds, markStepComplete } = useParticipantFormStore()

  const form = useForm<SupportNeedsData>({
    resolver: zodResolver(supportNeedsSchema),
    defaultValues: supportNeeds ?? {
      notes: '',
    },
  })

  const notesValue = useWatch({ control: form.control, name: 'notes' })
  const charCount = (notesValue ?? '').length

  const onSubmit = (data: SupportNeedsData) => {
    setSupportNeeds(data)
    markStepComplete(3)
    onSubmitAll()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="notes">Support Notes</Label>
        <Textarea
          id="notes"
          placeholder="Enter any support needs, goals, preferences, or other relevant information about this participant..."
          className="min-h-[200px] resize-y"
          maxLength={2000}
          {...form.register('notes')}
        />
        <div className="flex items-center justify-between">
          {form.formState.errors.notes ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.notes.message}
            </p>
          ) : (
            <span />
          )}
          <p className="text-xs text-muted-foreground">
            {charCount} / 2000
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Participant'}
        </Button>
      </div>
    </form>
  )
}
