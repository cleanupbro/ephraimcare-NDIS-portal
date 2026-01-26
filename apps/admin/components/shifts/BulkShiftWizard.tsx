'use client'

import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { addWeeks } from 'date-fns'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@ephraimcare/ui'
import {
  Button,
  Label,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Progress,
} from '@ephraimcare/ui'
import { Loader2, ArrowLeft, ArrowRight, Check } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { SUPPORT_TYPES } from '@/lib/workers/constants'
import {
  generateBulkShiftPreview,
  useExistingShifts,
  useBulkCreateShifts,
  type BulkShiftTemplate,
  type PreviewShift,
} from '@/hooks/use-bulk-shifts'
import { BulkShiftPreview } from './BulkShiftPreview'
import { toast } from '@/lib/toast'

// ─── Constants ──────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

const WEEKS_OPTIONS = [1, 2, 3, 4, 6, 8, 12]

// ─── Types ──────────────────────────────────────────────────────────────────

interface Participant {
  id: string
  first_name: string
  last_name: string
}

interface Worker {
  id: string
  services_provided: string[] | null
  profiles: { first_name: string; last_name: string } | null
}

interface BulkShiftWizardProps {
  organizationId: string
  onComplete?: () => void
  onCancel?: () => void
}

// ─── Helper: Get today's date string ────────────────────────────────────────

function getTodayString(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = (now.getMonth() + 1).toString().padStart(2, '0')
  const dd = now.getDate().toString().padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// ─── Component ──────────────────────────────────────────────────────────────

export function BulkShiftWizard({ organizationId, onComplete, onCancel }: BulkShiftWizardProps) {
  const [step, setStep] = useState<'config' | 'preview' | 'complete'>('config')
  const [preview, setPreview] = useState<PreviewShift[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])

  const createShifts = useBulkCreateShifts()

  const form = useForm<{
    participantId: string
    workerId: string
    supportType: string
    daysOfWeek: number[]
    startTime: string
    durationMinutes: number
    weeksToGenerate: number
    startDate: string
    notes: string
  }>({
    defaultValues: {
      participantId: '',
      workerId: '',
      supportType: '',
      daysOfWeek: [1, 3, 5], // Mon, Wed, Fri default
      startTime: '09:00',
      durationMinutes: 120,
      weeksToGenerate: 4,
      startDate: getTodayString(),
      notes: '',
    },
  })

  const watchedValues = form.watch()

  // ─── Fetch participants and workers on mount ──────────────────────────────

  useEffect(() => {
    const supabase = createClient()

    async function fetchData() {
      const [participantsRes, workersRes] = await Promise.all([
        supabase
          .from('participants')
          .select('id, first_name, last_name')
          .eq('is_active', true)
          .order('first_name'),
        supabase
          .from('workers')
          .select('id, services_provided, profiles(first_name, last_name)')
          .eq('is_active', true)
          .order('created_at'),
      ])

      if (participantsRes.data) {
        setParticipants(participantsRes.data as unknown as Participant[])
      }
      if (workersRes.data) {
        setWorkers(workersRes.data as unknown as Worker[])
      }
    }

    fetchData()
  }, [])

  // ─── Filter workers by support type ───────────────────────────────────────

  const filteredWorkers = useMemo(() => {
    if (!watchedValues.supportType) return []
    return workers.filter((w) =>
      w.services_provided?.includes(watchedValues.supportType)
    )
  }, [workers, watchedValues.supportType])

  // Reset worker_id when support type changes and current worker doesn't match
  useEffect(() => {
    if (watchedValues.supportType && watchedValues.workerId) {
      const workerStillValid = filteredWorkers.some((w) => w.id === watchedValues.workerId)
      if (!workerStillValid) {
        form.setValue('workerId', '')
      }
    }
  }, [watchedValues.supportType, filteredWorkers, watchedValues.workerId, form])

  // ─── End date calculation ─────────────────────────────────────────────────

  const endDate = useMemo(() => {
    if (!watchedValues.startDate) return new Date()
    return addWeeks(new Date(watchedValues.startDate), watchedValues.weeksToGenerate)
  }, [watchedValues.startDate, watchedValues.weeksToGenerate])

  // Fetch existing shifts for conflict detection
  const { data: existingShifts } = useExistingShifts(
    watchedValues.workerId,
    new Date(watchedValues.startDate || new Date()),
    endDate,
    !!watchedValues.workerId && step === 'config'
  )

  // ─── Generate preview ─────────────────────────────────────────────────────

  const handleGeneratePreview = () => {
    const [hour, minute] = watchedValues.startTime.split(':').map(Number)

    const template: BulkShiftTemplate = {
      participantId: watchedValues.participantId,
      workerId: watchedValues.workerId,
      supportType: watchedValues.supportType,
      daysOfWeek: watchedValues.daysOfWeek,
      startHour: hour,
      startMinute: minute,
      durationMinutes: watchedValues.durationMinutes,
      weeksToGenerate: watchedValues.weeksToGenerate,
      startDate: new Date(watchedValues.startDate),
      notes: watchedValues.notes || null,
    }

    const generatedPreview = generateBulkShiftPreview(template, existingShifts || [])
    setPreview(generatedPreview)
    setStep('preview')
  }

  // ─── Toggle shift selection ───────────────────────────────────────────────

  const handleToggleShift = (shiftId: string) => {
    setPreview((prev) =>
      prev.map((s) => (s.id === shiftId ? { ...s, selected: !s.selected } : s))
    )
  }

  const handleToggleAll = (selected: boolean) => {
    setPreview((prev) =>
      prev.map((s) => (s.hasConflict ? s : { ...s, selected }))
    )
  }

  // ─── Create shifts ────────────────────────────────────────────────────────

  const handleCreate = async () => {
    try {
      const result = await createShifts.mutateAsync({
        shifts: preview,
        organizationId,
        sendNotification: true,
      })

      toast({ title: `Created ${result.created} shifts`, variant: 'success' })
      setStep('complete')
    } catch (error) {
      toast({
        title: 'Failed to create shifts',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
      })
    }
  }

  // ─── Validation ───────────────────────────────────────────────────────────

  const isConfigValid =
    watchedValues.participantId &&
    watchedValues.workerId &&
    watchedValues.supportType &&
    watchedValues.daysOfWeek.length > 0 &&
    watchedValues.startDate

  // ─── Day toggle handler ───────────────────────────────────────────────────

  const toggleDay = (dayValue: number) => {
    const current = watchedValues.daysOfWeek
    const updated = current.includes(dayValue)
      ? current.filter((d) => d !== dayValue)
      : [...current, dayValue]
    form.setValue('daysOfWeek', updated.sort())
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create Recurring Shifts</CardTitle>
        <Progress
          value={step === 'config' ? 33 : step === 'preview' ? 66 : 100}
          className="h-2"
        />
      </CardHeader>

      <CardContent>
        {step === 'config' && (
          <div className="space-y-6">
            {/* Participant & Worker */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Participant</Label>
                <Select
                  value={watchedValues.participantId}
                  onValueChange={(v) => form.setValue('participantId', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select participant" />
                  </SelectTrigger>
                  <SelectContent>
                    {participants.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Support Type</Label>
                <Select
                  value={watchedValues.supportType}
                  onValueChange={(v) => form.setValue('supportType', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select support type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORT_TYPES.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Worker */}
            <div className="space-y-2">
              <Label>Worker</Label>
              <Select
                value={watchedValues.workerId}
                onValueChange={(v) => form.setValue('workerId', v)}
                disabled={!watchedValues.supportType}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !watchedValues.supportType
                        ? 'Select support type first'
                        : filteredWorkers.length === 0
                          ? '(No matching workers)'
                          : 'Select worker'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredWorkers.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.profiles?.first_name} {w.profiles?.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Days of Week */}
            <div className="space-y-2">
              <Label>Days of Week</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label
                    key={day.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={watchedValues.daysOfWeek.includes(day.value)}
                      onChange={() => toggleDay(day.value)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Time & Duration */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" {...form.register('startTime')} />
              </div>

              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  min={30}
                  max={480}
                  step={30}
                  {...form.register('durationMinutes', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label>Weeks to Generate</Label>
                <Select
                  value={String(watchedValues.weeksToGenerate)}
                  onValueChange={(v) => form.setValue('weeksToGenerate', Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKS_OPTIONS.map((w) => (
                      <SelectItem key={w} value={String(w)}>
                        {w} week{w > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" {...form.register('startDate')} />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Notes for all shifts..."
                {...form.register('notes')}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleGeneratePreview} disabled={!isConfigValid}>
                Generate Preview
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-6">
            <BulkShiftPreview
              shifts={preview}
              onToggleShift={handleToggleShift}
              onToggleAll={handleToggleAll}
            />

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('config')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createShifts.isPending || preview.filter((s) => s.selected).length === 0}
              >
                {createShifts.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create {preview.filter((s) => s.selected && !s.hasConflict).length} Shifts
              </Button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Shifts Created!</h3>
            <p className="text-muted-foreground mb-6">
              The worker will receive a summary notification.
            </p>
            <Button onClick={onComplete}>
              Done
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
