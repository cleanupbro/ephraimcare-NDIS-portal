'use client'

import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ephraimcare/ui'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'

interface WorkerSearchProps {
  search: string
  status: 'active' | 'inactive' | 'all'
  onSearchChange: (value: string) => void
  onStatusChange: (value: 'active' | 'inactive' | 'all') => void
}

export function WorkerSearch({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: WorkerSearchProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={status} onValueChange={(val) => onStatusChange(val as 'active' | 'inactive' | 'all')}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="all">All</SelectItem>
        </SelectContent>
      </Select>
      <Button asChild>
        <Link href="/workers/new">
          <Plus className="mr-2 h-4 w-4" />
          Add Worker
        </Link>
      </Button>
    </div>
  )
}
