'use client'

import { useState, useDeferredValue } from 'react'
import type { Participant } from '@ephraimcare/types'
import { Skeleton } from '@ephraimcare/ui'
import { useParticipants } from '@/hooks/use-participants'
import { DataTable } from '@/components/ui/data-table'
import { participantColumns } from './participant-columns'
import { ParticipantSearch } from './participant-search'

interface ParticipantListProps {
  initialData?: Participant[]
}

export function ParticipantList({ initialData }: ParticipantListProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'active' | 'archived' | 'all'>('active')
  const deferredSearch = useDeferredValue(search)

  const { data: participants, isLoading } = useParticipants({
    search: deferredSearch,
    status,
  })

  // Use query data if available, fall back to initialData
  const displayData = participants ?? initialData ?? []

  return (
    <div className="space-y-4">
      <ParticipantSearch
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />

      {isLoading && !participants ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <DataTable columns={participantColumns} data={displayData} />
      )}
    </div>
  )
}
