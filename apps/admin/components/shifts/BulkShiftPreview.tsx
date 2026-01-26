'use client'

import { format } from 'date-fns'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ephraimcare/ui'
import { Badge } from '@ephraimcare/ui'
import { AlertTriangle, Clock, Calendar } from 'lucide-react'

import type { PreviewShift } from '@/hooks/use-bulk-shifts'
import { calculatePreviewStats } from '@/hooks/use-bulk-shifts'

// ─── Types ──────────────────────────────────────────────────────────────────

interface BulkShiftPreviewProps {
  shifts: PreviewShift[]
  onToggleShift: (shiftId: string) => void
  onToggleAll: (selected: boolean) => void
}

// ─── Component ──────────────────────────────────────────────────────────────

export function BulkShiftPreview({
  shifts,
  onToggleShift,
  onToggleAll,
}: BulkShiftPreviewProps) {
  const stats = calculatePreviewStats(shifts)
  const allSelected = shifts.every((s) => s.selected || s.hasConflict)

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Shifts</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold text-green-600">{stats.selected}</div>
          <div className="text-sm text-muted-foreground">Selected</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.conflicts}</div>
          <div className="text-sm text-muted-foreground">Conflicts</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{stats.totalHours}h</div>
          <div className="text-sm text-muted-foreground">Total Hours</div>
        </div>
      </div>

      {/* Conflict warning */}
      {stats.conflicts > 0 && (
        <div className="rounded-lg border border-orange-300 bg-orange-50 p-4 text-orange-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">
              {stats.conflicts} shift{stats.conflicts > 1 ? 's' : ''} conflict with existing
              schedules and will be skipped. You can still select them if needed.
            </span>
          </div>
        </div>
      )}

      {/* Preview table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onToggleAll(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.map((shift) => {
              const duration = Math.round(
                (shift.scheduledEnd.getTime() - shift.scheduledStart.getTime()) / 60000
              )
              const hours = Math.floor(duration / 60)
              const minutes = duration % 60

              return (
                <TableRow
                  key={shift.id}
                  className={shift.hasConflict ? 'bg-orange-50' : ''}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={shift.selected}
                      onChange={() => onToggleShift(shift.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(shift.scheduledStart, 'MMM d, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>{shift.dayName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {format(shift.scheduledStart, 'h:mm a')} -{' '}
                      {format(shift.scheduledEnd, 'h:mm a')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {hours}h {minutes > 0 ? `${minutes}m` : ''}
                  </TableCell>
                  <TableCell>
                    {shift.hasConflict ? (
                      <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Conflict
                      </Badge>
                    ) : shift.selected ? (
                      <Badge variant="default">Ready</Badge>
                    ) : (
                      <Badge variant="secondary">Skipped</Badge>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
