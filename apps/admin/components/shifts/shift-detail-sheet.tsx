'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
import { format } from 'date-fns'
import { Pencil, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUpdateShift } from '@/hooks/use-update-shift'
import { ShiftCancelDialog } from './shift-cancel-dialog'
import { SHIFT_STATUS_COLORS, TIME_SLOTS, DURATION_PRESETS, type ShiftStatusKey } from '@/lib/shifts/constants'
import type { ShiftWithRelations } from '@ephraimcare/types'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ShiftDetailSheetProps {
  shift: ShiftWithRelations | null
  open: boolean
  onClose: () => void
}

interface WorkerOption {
  id: string
  profiles: { first_name: string; last_name: string } | null
}

interface EditFormState {
  worker_id: string
  date: string
  start_time: string
  duration_hours: number
  notes: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatShiftTime(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Australia/Sydney',
  })
}

function calculateDuration(start: string, end: string): string {
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  const totalMinutes = Math.round((endMs - startMs) / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

function calculateDurationHours(start: string, end: string): number {
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  return (endMs - startMs) / 3600000
}

function extractTime(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Australia/Sydney',
  })
}

function extractDate(iso: string): string {
  return format(new Date(iso), 'yyyy-MM-dd')
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ShiftDetailSheet({ shift, open, onClose }: ShiftDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [workers, setWorkers] = useState<WorkerOption[]>([])
  const [editForm, setEditForm] = useState<EditFormState>({
    worker_id: '',
    date: '',
    start_time: '',
    duration_hours: 1,
    notes: '',
  })

  const updateMutation = useUpdateShift(shift?.id ?? '')

  // Fetch workers for edit mode
  useEffect(() => {
    if (!isEditing) return

    const supabase = createClient()
    async function fetchWorkers() {
      const { data } = await (supabase
        .from('workers')
        .select('id, profiles(first_name, last_name)')
        .eq('is_active', true)
        .order('created_at', { ascending: true }) as any)

      if (data) {
        setWorkers(data as WorkerOption[])
      }
    }
    fetchWorkers()
  }, [isEditing])

  // Populate edit form when entering edit mode
  useEffect(() => {
    if (isEditing && shift) {
      setEditForm({
        worker_id: shift.worker_id,
        date: extractDate(shift.scheduled_start),
        start_time: extractTime(shift.scheduled_start),
        duration_hours: calculateDurationHours(shift.scheduled_start, shift.scheduled_end),
        notes: shift.notes ?? '',
      })
    }
  }, [isEditing, shift])

  // Reset state when sheet closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false)
      setShowCancel(false)
    }
  }, [open])

  if (!shift) {
    return <Sheet open={false}><SheetContent><SheetHeader><SheetTitle>Shift Details</SheetTitle><SheetDescription>No shift selected</SheetDescription></SheetHeader></SheetContent></Sheet>
  }

  const statusKey = shift.status as ShiftStatusKey
  const statusStyle = SHIFT_STATUS_COLORS[statusKey] ?? SHIFT_STATUS_COLORS.pending
  const isEditable = shift.status !== 'completed' && shift.status !== 'cancelled'

  const participantName = shift.participants
    ? `${shift.participants.first_name} ${shift.participants.last_name}`
    : 'Unassigned participant'

  const workerName = shift.workers?.profiles
    ? `${shift.workers.profiles.first_name} ${shift.workers.profiles.last_name}`
    : 'Unassigned worker'

  function handleSaveEdit() {
    if (!shift) return

    // Build scheduled_start from date + start_time
    const scheduledStart = new Date(`${editForm.date}T${editForm.start_time}:00`)
    const scheduledEnd = new Date(scheduledStart.getTime() + editForm.duration_hours * 3600000)

    updateMutation.mutate(
      {
        worker_id: editForm.worker_id,
        scheduled_start: scheduledStart.toISOString(),
        scheduled_end: scheduledEnd.toISOString(),
        notes: editForm.notes || null,
      },
      {
        onSuccess: () => {
          setIsEditing(false)
          onClose()
        },
      }
    )
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{participantName}</SheetTitle>
            <SheetDescription>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle.badge}`}>
                {statusStyle.text}
              </span>
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 py-4 space-y-6">
            {isEditing ? (
              /* ── Edit Mode ─────────────────────────────────────────── */
              <div className="space-y-4">
                {/* Worker select */}
                <div className="space-y-2">
                  <Label>Worker</Label>
                  <Select
                    value={editForm.worker_id}
                    onValueChange={(value) => setEditForm({ ...editForm, worker_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select worker" />
                    </SelectTrigger>
                    <SelectContent>
                      {workers.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.profiles ? `${w.profiles.first_name} ${w.profiles.last_name}` : 'Unknown'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  />
                </div>

                {/* Start time */}
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select
                    value={editForm.start_time}
                    onValueChange={(value) => setEditForm({ ...editForm, start_time: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <div className="flex flex-wrap gap-2">
                    {DURATION_PRESETS.map((preset) => (
                      <Button
                        key={preset.label}
                        type="button"
                        variant={editForm.duration_hours === preset.hours ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEditForm({ ...editForm, duration_hours: preset.hours })}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    min="0.25"
                    max="24"
                    step="0.25"
                    value={editForm.duration_hours}
                    onChange={(e) => setEditForm({ ...editForm, duration_hours: parseFloat(e.target.value) || 1 })}
                    className="mt-2 w-24"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                    placeholder="Shift notes..."
                  />
                </div>

                {/* Save / Cancel buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSaveEdit}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={updateMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* ── View Mode ─────────────────────────────────────────── */
              <div className="space-y-4">
                <DetailRow label="Worker" value={workerName} />
                <DetailRow label="Support Type" value={shift.support_type ?? 'Not specified'} />
                <DetailRow label="Date" value={format(new Date(shift.scheduled_start), 'EEEE, d MMMM yyyy')} />
                <DetailRow
                  label="Time"
                  value={`${formatShiftTime(shift.scheduled_start)} - ${formatShiftTime(shift.scheduled_end)}`}
                />
                <DetailRow
                  label="Duration"
                  value={calculateDuration(shift.scheduled_start, shift.scheduled_end)}
                />
                <DetailRow label="Status" value={statusStyle.text} />
                <DetailRow label="Notes" value={shift.notes ?? 'No notes'} />

                {shift.status === 'cancelled' && shift.cancellation_reason && (
                  <DetailRow label="Cancellation Reason" value={shift.cancellation_reason} />
                )}
              </div>
            )}

            {/* ── Actions ──────────────────────────────────────────── */}
            {isEditable && !isEditing && (
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit Shift
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/50 hover:bg-destructive/10"
                  onClick={() => setShowCancel(true)}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                  Cancel Shift
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ShiftCancelDialog
        open={showCancel}
        onClose={() => {
          setShowCancel(false)
          onClose()
        }}
        shiftId={shift.id}
      />
    </>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  )
}
