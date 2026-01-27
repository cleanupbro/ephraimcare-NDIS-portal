'use client'

import { AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@ephraimcare/ui'

// ─── Types ──────────────────────────────────────────────────────────────────

export type ConflictWarning = {
  type: 'overlap' | 'plan_dates' | 'support_type' | 'screening_expiring'
  message: string
  details?: string
}

interface ShiftConflictDialogProps {
  open: boolean
  onClose: () => void
  onOverride: () => void
  conflicts: ConflictWarning[]
}

// ─── Conflict Type Labels ───────────────────────────────────────────────────

const CONFLICT_LABELS: Record<ConflictWarning['type'], string> = {
  overlap: 'Schedule Overlap',
  plan_dates: 'Plan Period',
  support_type: 'Service Mismatch',
  screening_expiring: 'Compliance Warning',
}

const CONFLICT_COLORS: Record<ConflictWarning['type'], string> = {
  overlap: 'text-red-600',
  plan_dates: 'text-amber-600',
  support_type: 'text-orange-600',
  screening_expiring: 'text-amber-500',
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ShiftConflictDialog({
  open,
  onClose,
  onOverride,
  conflicts,
}: ShiftConflictDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Scheduling Conflicts Detected
          </AlertDialogTitle>
          <AlertDialogDescription>
            The following issues were found. You can still create this shift.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          {conflicts.map((conflict, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-md border border-border p-3"
            >
              <AlertTriangle
                className={`h-4 w-4 mt-0.5 shrink-0 ${CONFLICT_COLORS[conflict.type]}`}
              />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  <span className="text-muted-foreground">
                    {CONFLICT_LABELS[conflict.type]}:
                  </span>{' '}
                  {conflict.message}
                </p>
                {conflict.details && (
                  <p className="text-xs text-muted-foreground">
                    {conflict.details}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onOverride}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Create Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
