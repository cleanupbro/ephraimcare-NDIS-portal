'use client'

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@ephraimcare/ui'
import { SHIFT_STATUS_COLORS, SHIFT_STATUSES, type ShiftStatusKey } from '@/lib/shifts/constants'
import { SUPPORT_TYPES } from '@/lib/workers/constants'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ShiftFilterState {
  participantId: string
  workerId: string
  status: string
  supportType: string
}

interface ShiftFiltersProps {
  filters: ShiftFilterState
  onFiltersChange: (filters: ShiftFilterState) => void
  participants: { id: string; first_name: string; last_name: string }[]
  workers: { id: string; profiles: { first_name: string; last_name: string } | null }[]
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ShiftFilters({ filters, onFiltersChange, participants, workers }: ShiftFiltersProps) {
  function updateFilter(key: keyof ShiftFilterState, value: string) {
    onFiltersChange({ ...filters, [key]: value === '__all__' ? '' : value })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Participant filter */}
      <Select
        value={filters.participantId || '__all__'}
        onValueChange={(value) => updateFilter('participantId', value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Participants" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Participants</SelectItem>
          {participants.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.first_name} {p.last_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Worker filter */}
      <Select
        value={filters.workerId || '__all__'}
        onValueChange={(value) => updateFilter('workerId', value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Workers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Workers</SelectItem>
          {workers.map((w) => (
            <SelectItem key={w.id} value={w.id}>
              {w.profiles ? `${w.profiles.first_name} ${w.profiles.last_name}` : 'Unknown'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status filter */}
      <Select
        value={filters.status || '__all__'}
        onValueChange={(value) => updateFilter('status', value)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Statuses</SelectItem>
          {SHIFT_STATUSES.filter((s) => s !== 'cancelled').map((status) => (
            <SelectItem key={status} value={status}>
              {SHIFT_STATUS_COLORS[status].text}
            </SelectItem>
          ))}
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      {/* Support Type filter */}
      <Select
        value={filters.supportType || '__all__'}
        onValueChange={(value) => updateFilter('supportType', value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Types</SelectItem>
          {SUPPORT_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
