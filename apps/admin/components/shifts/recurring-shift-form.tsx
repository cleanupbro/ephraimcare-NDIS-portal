'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  addWeeks,
  setDay,
  format,
  isBefore,
  startOfDay,
} from 'date-fns'
import {
  Button,
  Label,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@ephraimcare/ui'
import { ChevronLeft, AlertTriangle, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const recurringShiftSchema = z.object({
  participant_id: z.string().uuid(),
  worker_id: z.string().uuid().optional(),
  support_type: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  weeks: z.number().min(1).max(12),
})

type FormData = z.infer<typeof recurringShiftSchema>

interface Participant {
  id: string
  first_name: string
  last_name: string
  organization_id: string
}

interface Worker {
  id: string
  profiles: { first_name: string; last_name: string } | null
}

const SUPPORT_TYPES = [
  { value: 'personal_care', label: 'Personal Care' },
  { value: 'domestic_assistance', label: 'Domestic Assistance' },
  { value: 'community_access', label: 'Community Access' },
  { value: 'transport', label: 'Transport' },
  { value: 'therapy', label: 'Therapy' },
  { value: 'respite', label: 'Respite' },
]

const DAYS_OF_WEEK = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
]

export function RecurringShiftForm() {
  const router = useRouter()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(recurringShiftSchema),
    defaultValues: {
      weeks: 4,
      start_time: '09:00',
      end_time: '12:00',
    },
  })

  const weeks = watch('weeks')
  const startTime = watch('start_time')
  const endTime = watch('end_time')

  // Fetch participants and workers
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const [pRes, wRes] = await Promise.all([
        supabase.from('participants').select('id, first_name, last_name, organization_id').eq('is_active', true),
        supabase.from('workers').select('id, profiles(first_name, last_name)').eq('is_active', true),
      ])
      if (pRes.data) setParticipants(pRes.data as Participant[])
      if (wRes.data) setWorkers(wRes.data as unknown as Worker[])
    }
    fetchData()
  }, [])

  // Calculate preview dates
  const previewDates = useMemo(() => {
    if (selectedDays.length === 0) return []

    const dates: Date[] = []
    const today = startOfDay(new Date())

    for (let week = 0; week < (weeks || 4); week++) {
      for (const day of selectedDays) {
        let date = setDay(addWeeks(today, week), day)
        // If the day is before today in the current week, skip to next week
        if (week === 0 && isBefore(date, today)) {
          date = addWeeks(date, 1)
        }
        if (!dates.some((d) => d.getTime() === date.getTime())) {
          dates.push(date)
        }
      }
    }

    return dates.sort((a, b) => a.getTime() - b.getTime())
  }, [selectedDays, weeks])

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  async function onSubmit(data: FormData) {
    if (selectedDays.length === 0) {
      setError('Please select at least one day of the week')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/shifts/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          days: selectedDays,
          organization_id: participants.find((p) => p.id === data.participant_id)?.organization_id,
        }),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || 'Failed to create shifts')
      }

      router.push('/shifts')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create shifts')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Link
        href="/shifts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Shifts
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <h2 className="font-heading text-xl font-semibold">Create Recurring Shifts</h2>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Participant */}
          <div className="space-y-2">
            <Label>Participant</Label>
            <Select onValueChange={(val) => setValue('participant_id', val)}>
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

          {/* Worker */}
          <div className="space-y-2">
            <Label>Worker (optional)</Label>
            <Select onValueChange={(val) => setValue('worker_id', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Assign worker" />
              </SelectTrigger>
              <SelectContent>
                {workers.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.profiles?.first_name} {w.profiles?.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Support Type */}
          <div className="space-y-2">
            <Label>Support Type</Label>
            <Select onValueChange={(val) => setValue('support_type', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select support type" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.support_type && (
              <p className="text-sm text-destructive">{errors.support_type.message}</p>
            )}
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" {...register('start_time')} />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="time" {...register('end_time')} />
            </div>
          </div>

          {/* Days of Week */}
          <div className="space-y-2">
            <Label>Days of Week</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`rounded-md px-3 py-2 text-sm font-medium border transition-colors ${
                    selectedDays.includes(day.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:bg-muted'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Number of Weeks */}
          <div className="space-y-2">
            <Label>Repeat for (weeks)</Label>
            <Select
              value={String(weeks)}
              onValueChange={(val) => setValue('weeks', parseInt(val))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 6, 8, 12].map((w) => (
                  <SelectItem key={w} value={String(w)}>{w} {w === 1 ? 'week' : 'weeks'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : `Create ${previewDates.length} Shifts`}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/shifts">Cancel</Link>
            </Button>
          </div>
        </form>

        {/* Preview */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-medium flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4" />
            Preview ({previewDates.length} shifts)
          </h3>
          {previewDates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Select days of the week to see preview
            </p>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {previewDates.map((date, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0"
                >
                  <span>{format(date, 'EEE, d MMM yyyy')}</span>
                  <span className="text-muted-foreground">
                    {startTime} - {endTime}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
