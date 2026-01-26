'use client'

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@ephraimcare/ui'
import { SUPPORT_TYPES } from '@/lib/workers/constants'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ReportFilterState {
  participantId: string
  workerId: string
  supportType: string
}

interface ReportFiltersProps {
  filters: ReportFilterState
  onFiltersChange: (filters: ReportFilterState) => void
  participants: { id: string; first_name: string; last_name: string }[]
  workers: { id: string; profiles: { first_name: string; last_name: string } | null }[]
  /** Show participant filter */
  showParticipant?: boolean
  /** Show worker filter */
  showWorker?: boolean
  /** Show support type filter */
  showSupportType?: boolean
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ReportFilters({
  filters,
  onFiltersChange,
  participants,
  workers,
  showParticipant = true,
  showWorker = true,
  showSupportType = true,
}: ReportFiltersProps) {
  function updateFilter(key: keyof ReportFilterState, value: string) {
    onFiltersChange({ ...filters, [key]: value === '__all__' ? '' : value })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Participant filter */}
      {showParticipant && (
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
      )}

      {/* Worker filter */}
      {showWorker && (
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
      )}

      {/* Support Type filter */}
      {showSupportType && (
        <Select
          value={filters.supportType || '__all__'}
          onValueChange={(value) => updateFilter('supportType', value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Support Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Support Types</SelectItem>
            {SUPPORT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
