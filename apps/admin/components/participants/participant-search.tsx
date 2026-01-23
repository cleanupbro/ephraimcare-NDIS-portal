'use client'

import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ephraimcare/ui'
import { Search } from 'lucide-react'

interface ParticipantSearchProps {
  search: string
  status: 'active' | 'archived' | 'all'
  onSearchChange: (value: string) => void
  onStatusChange: (value: 'active' | 'archived' | 'all') => void
}

export function ParticipantSearch({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: ParticipantSearchProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or NDIS number..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={status} onValueChange={(val) => onStatusChange(val as 'active' | 'archived' | 'all')}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
          <SelectItem value="all">All</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
