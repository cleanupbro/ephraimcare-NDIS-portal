'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import {
  Button,
  Label,
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@ephraimcare/ui'
import { createClient } from '@/lib/supabase/client'
import { shiftCreateSchema, type ShiftCreateFormData } from '@/lib/shifts/schemas'
import { SUPPORT_TYPES } from '@/lib/workers/constants'
import { TIME_SLOTS, DURATION_PRESETS } from '@/lib/shifts/constants'
import { ShiftConflictDialog, type ConflictWarning } from './shift-conflict-dialog'
import { useCreateShift } from '@/hooks/use-create-shift'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Participant {
  id: string
  first_name: string
  last_name: string
  organization_id: string
}

interface Worker {
  id: string
  services_provided: string[] | null
  profiles: { first_name: string; last_name: string } | null
}

interface ShiftFormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<ShiftCreateFormData>
  shiftId?: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Format HH:MM to 12-hour display (e.g. "06:00" -> "6:00 AM") */
function formatTimeDisplay(time: string): string {
  const [hh, mm] = time.split(':').map(Number)
  const period = hh >= 12 ? 'PM' : 'AM'
  const hour12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh
  return `${hour12}:${mm.toString().padStart(2, '0')} ${period}`
}

/** Calculate end time from start time + duration hours */
function calculateEndTime(startTime: string, durationHours: number): string {
  const [hh, mm] = startTime.split(':').map(Number)
  const totalMinutes = hh * 60 + mm + durationHours * 60
  const endHour = Math.floor(totalMinutes / 60)
  const endMin = totalMinutes % 60
  return `${endHour.toString().padStart(2, '0')}:${Math.round(endMin).toString().padStart(2, '0')}`
}

/** Get today's date formatted as YYYY-MM-DD */
function getTodayString(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = (now.getMonth() + 1).toString().padStart(2, '0')
  const dd = now.getDate().toString().padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ShiftForm({ mode, defaultValues, shiftId }: ShiftFormProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [conflicts, setConflicts] = useState<ConflictWarning[]>([])
  const [showConflictDialog, setShowConflictDialog] = useState(false)
  const [customDuration, setCustomDuration] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  const createShift = useCreateShift()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ShiftCreateFormData>({
    resolver: zodResolver(shiftCreateSchema),
    defaultValues: {
      participant_id: '',
      worker_id: '',
      support_type: '',
      date: getTodayString(),
      start_time: '09:00',
      duration_hours: 2,
      notes: '',
      ...defaultValues,
    },
  })

  const supportType = watch('support_type')
  const workerId = watch('worker_id')
  const startTime = watch('start_time')
  const durationHours = watch('duration_hours')
  const participantId = watch('participant_id')

  // ─── Fetch participants and workers on mount ──────────────────────────────

  useEffect(() => {
    const supabase = createClient()

    async function fetchData() {
      const [participantsRes, workersRes] = await Promise.all([
        supabase
          .from('participants')
          .select('id, first_name, last_name, organization_id')
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
    if (!supportType) return []
    return workers.filter((w) =>
      w.services_provided?.includes(supportType)
    )
  }, [workers, supportType])

  // Reset worker_id when support type changes and current worker doesn't match
  useEffect(() => {
    if (supportType && workerId) {
      const workerStillValid = filteredWorkers.some((w) => w.id === workerId)
      if (!workerStillValid) {
        setValue('worker_id', '')
      }
    }
  }, [supportType, filteredWorkers, workerId, setValue])

  // ─── End time calculation ─────────────────────────────────────────────────

  const endTimeDisplay = useMemo(() => {
    if (!startTime || !durationHours) return '--:--'
    const endTime = calculateEndTime(startTime, durationHours)
    return formatTimeDisplay(endTime)
  }, [startTime, durationHours])

  // ─── Conflict detection ───────────────────────────────────────────────────

  async function checkConflicts(data: ShiftCreateFormData): Promise<ConflictWarning[]> {
    const supabase = createClient()
    const detected: ConflictWarning[] = []

    // Calculate scheduled start and end as ISO timestamps
    const scheduledStart = new Date(`${data.date}T${data.start_time}:00`).toISOString()
    const endTime = calculateEndTime(data.start_time, data.duration_hours)
    const scheduledEnd = new Date(`${data.date}T${endTime}:00`).toISOString()

    // 1. Check worker overlaps
    const { data: overlaps } = await supabase
      .from('shifts')
      .select('id, scheduled_start, scheduled_end, participants(first_name, last_name)')
      .eq('worker_id', data.worker_id)
      .neq('status', 'cancelled')
      .lt('scheduled_start', scheduledEnd)
      .gt('scheduled_end', scheduledStart) as any

    if (overlaps && overlaps.length > 0) {
      for (const overlap of overlaps) {
        const overlapStart = new Date(overlap.scheduled_start).toLocaleString('en-AU', {
          hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Australia/Sydney',
        })
        const overlapEnd = new Date(overlap.scheduled_end).toLocaleString('en-AU', {
          hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Australia/Sydney',
        })
        const participantName = overlap.participants
          ? `${overlap.participants.first_name} ${overlap.participants.last_name}`
          : 'Unknown'

        detected.push({
          type: 'overlap',
          message: 'Worker has an overlapping shift',
          details: `Existing shift with ${participantName}: ${overlapStart} - ${overlapEnd}`,
        })
      }
    }

    // 2. Check plan dates
    const { data: plans } = await supabase
      .from('ndis_plans')
      .select('start_date, end_date')
      .eq('participant_id', data.participant_id)
      .eq('status', 'active')
      .limit(1)
      .single() as any

    if (plans) {
      const shiftDate = new Date(data.date)
      const planStart = new Date(plans.start_date)
      const planEnd = new Date(plans.end_date)

      if (shiftDate < planStart || shiftDate > planEnd) {
        detected.push({
          type: 'plan_dates',
          message: 'Shift is outside participant\'s active plan period',
          details: `Plan period: ${plans.start_date} to ${plans.end_date}`,
        })
      }
    }

    // 3. Check support type match
    const selectedWorker = workers.find((w) => w.id === data.worker_id)
    if (selectedWorker && !selectedWorker.services_provided?.includes(data.support_type)) {
      detected.push({
        type: 'support_type',
        message: 'Support type mismatch',
        details: `Worker does not list "${data.support_type}" in their services`,
      })
    }

    return detected
  }

  // ─── Form submission ──────────────────────────────────────────────────────

  async function onSubmit(data: ShiftCreateFormData) {
    setIsChecking(true)
    try {
      const detected = await checkConflicts(data)

      if (detected.length > 0) {
        setConflicts(detected)
        setShowConflictDialog(true)
        return
      }

      await createShiftFromData(data)
    } finally {
      setIsChecking(false)
    }
  }

  async function createShiftFromData(data: ShiftCreateFormData) {
    const scheduledStart = new Date(`${data.date}T${data.start_time}:00`).toISOString()
    const endTime = calculateEndTime(data.start_time, data.duration_hours)
    const scheduledEnd = new Date(`${data.date}T${endTime}:00`).toISOString()

    // Get organization_id from the selected participant
    const participant = participants.find((p) => p.id === data.participant_id)
    const organizationId = participant?.organization_id || ''

    createShift.mutate({
      participant_id: data.participant_id,
      worker_id: data.worker_id,
      support_type: data.support_type,
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
      notes: data.notes || null,
      organization_id: organizationId,
    })
  }

  function handleOverride() {
    setShowConflictDialog(false)
    const data = {
      participant_id: watch('participant_id'),
      worker_id: watch('worker_id'),
      support_type: watch('support_type'),
      date: watch('date'),
      start_time: watch('start_time'),
      duration_hours: watch('duration_hours'),
      notes: watch('notes'),
    } as ShiftCreateFormData
    createShiftFromData(data)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <Link
        href="/shifts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Shifts
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
        {/* Participant */}
        <div className="space-y-2">
          <Label htmlFor="participant_id">Participant</Label>
          <Select
            value={participantId}
            onValueChange={(val) => setValue('participant_id', val)}
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
          {errors.participant_id && (
            <p className="text-sm text-destructive">{errors.participant_id.message}</p>
          )}
        </div>

        {/* Support Type */}
        <div className="space-y-2">
          <Label htmlFor="support_type">Support Type</Label>
          <Select
            value={supportType}
            onValueChange={(val) => setValue('support_type', val)}
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
          {errors.support_type && (
            <p className="text-sm text-destructive">{errors.support_type.message}</p>
          )}
        </div>

        {/* Worker */}
        <div className="space-y-2">
          <Label htmlFor="worker_id">Worker</Label>
          <Select
            value={workerId}
            onValueChange={(val) => setValue('worker_id', val)}
            disabled={!supportType}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  !supportType
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
          {errors.worker_id && (
            <p className="text-sm text-destructive">{errors.worker_id.message}</p>
          )}
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            type="date"
            id="date"
            min={getTodayString()}
            {...register('date')}
          />
          {errors.date && (
            <p className="text-sm text-destructive">{errors.date.message}</p>
          )}
        </div>

        {/* Start Time */}
        <div className="space-y-2">
          <Label htmlFor="start_time">Start Time</Label>
          <Select
            value={startTime}
            onValueChange={(val) => setValue('start_time', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select start time" />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {formatTimeDisplay(slot)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.start_time && (
            <p className="text-sm text-destructive">{errors.start_time.message}</p>
          )}
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label>Duration</Label>
          <div className="flex flex-wrap gap-2">
            {DURATION_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                variant={!customDuration && durationHours === preset.hours ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setCustomDuration(false)
                  setValue('duration_hours', preset.hours)
                }}
              >
                {preset.label}
              </Button>
            ))}
            <Button
              type="button"
              variant={customDuration ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCustomDuration(true)}
            >
              Custom
            </Button>
          </div>
          {customDuration && (
            <div className="mt-2">
              <Input
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                placeholder="Hours"
                {...register('duration_hours', { valueAsNumber: true })}
              />
            </div>
          )}
          {errors.duration_hours && (
            <p className="text-sm text-destructive">{errors.duration_hours.message}</p>
          )}
        </div>

        {/* End Time (calculated) */}
        <div className="space-y-2">
          <Label>End Time</Label>
          <span className="block text-sm font-medium text-muted-foreground py-2">
            {endTimeDisplay}
          </span>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            placeholder="Any additional information..."
            maxLength={2000}
            {...register('notes')}
          />
          {errors.notes && (
            <p className="text-sm text-destructive">{errors.notes.message}</p>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || isChecking || createShift.isPending}
          >
            {isChecking ? 'Checking...' : createShift.isPending ? 'Creating...' : 'Schedule Shift'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/shifts">Cancel</Link>
          </Button>
        </div>
      </form>

      {/* Conflict Dialog */}
      <ShiftConflictDialog
        open={showConflictDialog}
        onClose={() => setShowConflictDialog(false)}
        onOverride={handleOverride}
        conflicts={conflicts}
      />
    </>
  )
}
