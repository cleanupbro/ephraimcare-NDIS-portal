import type { Metadata } from 'next'
import { ShiftForm } from '@/components/shifts/shift-form'

export const metadata: Metadata = {
  title: 'Schedule Shift | Ephraim Care',
}

export default function NewShiftPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto py-6 px-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Schedule New Shift</h1>
        <p className="text-muted-foreground mt-1">
          Create a new shift by selecting a participant, support type, and worker.
        </p>
      </div>

      <ShiftForm mode="create" />
    </div>
  )
}
