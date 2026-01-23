'use client'

import { type ColumnDef } from '@tanstack/react-table'
import type { Participant } from '@ephraimcare/types'
import { Badge } from '@ephraimcare/ui'
import { ArrowUpDown } from 'lucide-react'
import Link from 'next/link'

export const participantColumns: ColumnDef<Participant>[] = [
  {
    id: 'name',
    accessorFn: (row) => `${row.first_name} ${row.last_name}`,
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Name
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => (
      <Link
        href={`/participants/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.original.first_name} {row.original.last_name}
      </Link>
    ),
  },
  {
    accessorKey: 'ndis_number',
    header: 'NDIS Number',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.ndis_number}</span>
    ),
  },
  {
    id: 'status',
    accessorFn: (row) => (row.is_active ? 'Active' : 'Archived'),
    header: 'Status',
    cell: ({ row }) => (
      <Badge
        variant={row.original.is_active ? 'default' : 'secondary'}
        className={
          row.original.is_active
            ? 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200'
            : ''
        }
      >
        {row.original.is_active ? 'Active' : 'Archived'}
      </Badge>
    ),
  },
]
