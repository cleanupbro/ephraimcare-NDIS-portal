'use client'

import { type ColumnDef } from '@tanstack/react-table'
import type { WorkerWithProfile } from '@ephraimcare/types'
import { Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@ephraimcare/ui'
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { getOverallComplianceStatus, COMPLIANCE_COLORS, type ComplianceStatus } from '@/lib/workers/constants'

const STATUS_LABELS: Record<ComplianceStatus, string> = {
  valid: 'All checks valid',
  expiring: 'Check expiring soon',
  expired: 'Check expired',
  not_set: 'Checks not set',
}

export const workerColumns: ColumnDef<WorkerWithProfile>[] = [
  {
    id: 'name',
    accessorFn: (row) => `${row.profiles.first_name} ${row.profiles.last_name}`,
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
        href={`/workers/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.original.profiles.first_name} {row.original.profiles.last_name}
      </Link>
    ),
  },
  {
    id: 'email',
    accessorFn: (row) => row.profiles.email,
    header: 'Email',
    cell: ({ row }) => (
      <span className="max-w-[200px] truncate block text-sm text-muted-foreground">
        {row.original.profiles.email}
      </span>
    ),
  },
  {
    id: 'support_types',
    accessorFn: (row) => row.services_provided?.join(', ') ?? '',
    header: 'Support Types',
    cell: ({ row }) => {
      const services = row.original.services_provided ?? []
      if (services.length === 0) {
        return <span className="text-sm text-muted-foreground">None</span>
      }
      const visible = services.slice(0, 2)
      const remaining = services.length - 2
      return (
        <div className="flex flex-wrap gap-1">
          {visible.map((service) => (
            <Badge key={service} variant="secondary" className="text-xs">
              {service}
            </Badge>
          ))}
          {remaining > 0 && (
            <Badge variant="secondary" className="text-xs">
              +{remaining} more
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    id: 'status',
    accessorFn: (row) =>
      getOverallComplianceStatus(row.ndis_check_expiry, row.wwcc_expiry),
    header: 'Status',
    cell: ({ row }) => {
      const status = getOverallComplianceStatus(
        row.original.ndis_check_expiry,
        row.original.wwcc_expiry
      )
      return (
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${COMPLIANCE_COLORS[status]}`}
          title={STATUS_LABELS[status]}
        />
      )
    },
  },
  {
    id: 'hours_this_week',
    header: 'Hours This Week',
    cell: () => (
      <span className="text-sm text-muted-foreground">&mdash;</span>
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/workers/${row.original.id}`}>View</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/workers/${row.original.id}/edit`}>Edit</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]
