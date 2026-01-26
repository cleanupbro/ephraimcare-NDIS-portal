'use client'

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { addWeeks, addDays, setHours, setMinutes, isBefore, format } from 'date-fns'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BulkShiftTemplate {
  participantId: string
  workerId: string
  supportType: string
  daysOfWeek: number[] // 0=Sunday, 1=Monday, etc.
  startHour: number
  startMinute: number
  durationMinutes: number
  notes: string | null
  weeksToGenerate: number
  startDate: Date
}

export interface PreviewShift {
  id: string // Temporary ID for preview
  scheduledStart: Date
  scheduledEnd: Date
  dayName: string
  participantId: string
  workerId: string
  supportType: string
  notes: string | null
  hasConflict: boolean
  conflictReason?: string
  selected: boolean // Can be deselected by user
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// ─── Fetch Existing Shifts for Conflict Detection ───────────────────────────

/**
 * Fetch existing shifts for a worker within a date range
 * Used for conflict detection when generating bulk shifts
 */
export function useExistingShifts(
  workerId: string,
  startDate: Date,
  endDate: Date,
  enabled: boolean
) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['existing-shifts', workerId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select('id, worker_id, scheduled_start, scheduled_end')
        .eq('worker_id', workerId)
        .gte('scheduled_start', startDate.toISOString())
        .lte('scheduled_end', endDate.toISOString())
        .not('status', 'eq', 'cancelled')

      if (error) throw error
      return data || []
    },
    enabled,
  })
}

// ─── Generate Preview of Shifts to be Created ───────────────────────────────

/**
 * Generate preview of shifts to be created based on template
 * Detects conflicts with existing shifts
 */
export function generateBulkShiftPreview(
  template: BulkShiftTemplate,
  existingShifts: { worker_id: string; scheduled_start: string; scheduled_end: string }[]
): PreviewShift[] {
  const preview: PreviewShift[] = []

  let currentWeekStart = new Date(template.startDate)
  // Adjust to start of week (Sunday)
  const dayOffset = currentWeekStart.getDay()
  currentWeekStart = addDays(currentWeekStart, -dayOffset)

  for (let week = 0; week < template.weeksToGenerate; week++) {
    for (const dayOfWeek of template.daysOfWeek) {
      // Calculate date for this day
      const shiftDate = addDays(currentWeekStart, dayOfWeek)

      // Skip if before start date
      if (isBefore(shiftDate, template.startDate)) continue

      // Set time
      let scheduledStart = setHours(shiftDate, template.startHour)
      scheduledStart = setMinutes(scheduledStart, template.startMinute)
      const scheduledEnd = new Date(
        scheduledStart.getTime() + template.durationMinutes * 60 * 1000
      )

      // Check for conflicts with existing shifts
      const conflict = existingShifts.find((es) => {
        if (es.worker_id !== template.workerId) return false

        const existingStart = new Date(es.scheduled_start)
        const existingEnd = new Date(es.scheduled_end)

        // Check overlap: new shift overlaps with existing shift
        return (
          (scheduledStart >= existingStart && scheduledStart < existingEnd) ||
          (scheduledEnd > existingStart && scheduledEnd <= existingEnd) ||
          (scheduledStart <= existingStart && scheduledEnd >= existingEnd)
        )
      })

      preview.push({
        id: crypto.randomUUID(),
        scheduledStart,
        scheduledEnd,
        dayName: DAY_NAMES[dayOfWeek],
        participantId: template.participantId,
        workerId: template.workerId,
        supportType: template.supportType,
        notes: template.notes,
        hasConflict: !!conflict,
        conflictReason: conflict ? 'Worker has overlapping shift' : undefined,
        selected: !conflict, // Auto-deselect conflicting shifts
      })
    }

    currentWeekStart = addWeeks(currentWeekStart, 1)
  }

  return preview.sort((a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime())
}

// ─── Create Multiple Shifts from Preview ────────────────────────────────────

/**
 * Create multiple shifts from preview
 * Sends single summary notification (not per-shift)
 */
export function useBulkCreateShifts() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      shifts,
      organizationId,
      sendNotification = true,
    }: {
      shifts: PreviewShift[]
      organizationId: string
      sendNotification?: boolean
    }) => {
      // Only create selected, non-conflicting shifts
      const shiftsToCreate = shifts.filter((s) => s.selected && !s.hasConflict)

      if (shiftsToCreate.length === 0) {
        throw new Error('No shifts selected')
      }

      // Batch insert shifts
      const { data, error } = await (supabase
        .from('shifts') as any)
        .insert(
          shiftsToCreate.map((shift) => ({
            participant_id: shift.participantId,
            worker_id: shift.workerId,
            support_type: shift.supportType,
            scheduled_start: shift.scheduledStart.toISOString(),
            scheduled_end: shift.scheduledEnd.toISOString(),
            notes: shift.notes,
            organization_id: organizationId,
            status: 'pending',
          }))
        )
        .select('id')

      if (error) throw error

      // Send single summary notification (not per-shift)
      if (sendNotification && data && data.length > 0) {
        const firstShift = shiftsToCreate[0]
        const lastShift = shiftsToCreate[shiftsToCreate.length - 1]

        // Get worker email
        const { data: worker } = await (supabase
          .from('workers')
          .select('profile:profiles(email, first_name)')
          .eq('id', firstShift.workerId)
          .single() as any)

        const workerData = worker as { profile: { email: string; first_name: string } | null } | null
        if (workerData?.profile) {
          const profile = workerData.profile
          // Send summary email via API (fire-and-forget)
          fetch('/api/notifications/bulk-shifts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workerEmail: profile.email,
              workerName: profile.first_name,
              shiftCount: data.length,
              startDate: format(firstShift.scheduledStart, 'MMM d, yyyy'),
              endDate: format(lastShift.scheduledStart, 'MMM d, yyyy'),
            }),
          }).catch((err) => console.error('Bulk notification error:', err))
        }
      }

      return {
        created: data?.length || 0,
        total: shiftsToCreate.length,
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
    },
  })
}

// ─── Calculate Preview Statistics ───────────────────────────────────────────

/**
 * Calculate summary statistics for preview
 */
export function calculatePreviewStats(preview: PreviewShift[]): {
  total: number
  selected: number
  conflicts: number
  totalHours: number
} {
  const selected = preview.filter((s) => s.selected)
  const conflicts = preview.filter((s) => s.hasConflict)

  const totalMinutes = selected.reduce((acc, shift) => {
    const duration = (shift.scheduledEnd.getTime() - shift.scheduledStart.getTime()) / 60000
    return acc + duration
  }, 0)

  return {
    total: preview.length,
    selected: selected.length,
    conflicts: conflicts.length,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
  }
}
