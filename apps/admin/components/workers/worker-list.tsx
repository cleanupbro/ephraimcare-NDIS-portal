'use client'

import { useState, useDeferredValue } from 'react'
import type { WorkerWithProfile } from '@ephraimcare/types'
import { Skeleton } from '@ephraimcare/ui'
import { useWorkers } from '@/hooks/use-workers'
import { DataTable } from '@/components/ui/data-table'
import { workerColumns } from './worker-columns'
import { WorkerSearch } from './worker-search'

interface WorkerListProps {
  initialData?: WorkerWithProfile[]
}

export function WorkerList({ initialData }: WorkerListProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive' | 'all'>('active')
  const deferredSearch = useDeferredValue(search)

  const { data: workers, isLoading } = useWorkers({
    search: deferredSearch,
    status,
  })

  // Use query data if available, fall back to initialData
  const displayData = workers ?? initialData ?? []

  return (
    <div className="space-y-4">
      <WorkerSearch
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />

      {isLoading && !workers ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <DataTable columns={workerColumns} data={displayData} />
      )}
    </div>
  )
}
