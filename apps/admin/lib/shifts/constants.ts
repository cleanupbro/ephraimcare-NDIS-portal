// ─── Shift Status Colors ────────────────────────────────────────────────────

/** Visual styling for each shift status: border (card left edge), badge (pill), text (label) */
export const SHIFT_STATUS_COLORS = {
  pending: {
    border: 'border-l-gray-400',
    badge: 'bg-gray-100 text-gray-700',
    text: 'Pending',
  },
  proposed: {
    border: 'border-l-blue-300',
    badge: 'bg-blue-50 text-blue-700',
    text: 'Proposed',
  },
  scheduled: {
    border: 'border-l-yellow-400',
    badge: 'bg-yellow-50 text-yellow-700',
    text: 'Scheduled',
  },
  confirmed: {
    border: 'border-l-indigo-500',
    badge: 'bg-indigo-50 text-indigo-700',
    text: 'Confirmed',
  },
  in_progress: {
    border: 'border-l-blue-500',
    badge: 'bg-blue-100 text-blue-800',
    text: 'In Progress',
  },
  completed: {
    border: 'border-l-green-500',
    badge: 'bg-green-50 text-green-700',
    text: 'Completed',
  },
  cancelled: {
    border: 'border-l-red-500',
    badge: 'bg-red-50 text-red-700',
    text: 'Cancelled',
  },
  no_show: {
    border: 'border-l-orange-500',
    badge: 'bg-orange-50 text-orange-700',
    text: 'No Show',
  },
} as const

export type ShiftStatusKey = keyof typeof SHIFT_STATUS_COLORS

// ─── Shift Statuses Array ───────────────────────────────────────────────────

/** All shift status values for filter dropdowns */
export const SHIFT_STATUSES: ShiftStatusKey[] = [
  'pending',
  'proposed',
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
]

// ─── Duration Presets ───────────────────────────────────────────────────────

/** Common NDIS shift durations for quick-select buttons */
export const DURATION_PRESETS = [
  { label: '1h', hours: 1 },
  { label: '1.5h', hours: 1.5 },
  { label: '2h', hours: 2 },
  { label: '3h', hours: 3 },
  { label: '4h', hours: 4 },
  { label: '8h', hours: 8 },
] as const

// ─── Time Slots ─────────────────────────────────────────────────────────────

/** Generate time slots from 06:00 to 22:00 in 15-minute increments */
function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      // Stop after 22:00 (don't generate 22:15, 22:30, 22:45)
      if (hour === 22 && minute > 0) break
      const hh = hour.toString().padStart(2, '0')
      const mm = minute.toString().padStart(2, '0')
      slots.push(`${hh}:${mm}`)
    }
  }
  return slots
}

/** Time slots from 06:00 to 22:00 in 15-minute increments (65 entries) */
export const TIME_SLOTS = generateTimeSlots()
