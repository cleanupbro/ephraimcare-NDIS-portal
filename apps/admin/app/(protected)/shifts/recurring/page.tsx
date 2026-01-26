'use client'

import { RecurringShiftForm } from '@/components/shifts/recurring-shift-form'

export default function RecurringShiftsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Recurring Shifts</h1>
        <p className="text-sm text-muted-foreground">
          Create multiple shifts on selected days across weeks
        </p>
      </div>

      <RecurringShiftForm />
    </div>
  )
}
