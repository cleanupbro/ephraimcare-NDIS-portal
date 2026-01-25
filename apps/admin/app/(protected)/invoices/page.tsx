'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { Plus, FileText } from 'lucide-react'
import {
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Tabs,
  TabsList,
  TabsTrigger,
  Skeleton,
} from '@ephraimcare/ui'
import { useState } from 'react'
import { useInvoices } from '@/hooks/use-invoices'
import { INVOICE_STATUS_COLORS, type InvoiceStatusKey } from '@/lib/invoices/constants'
import { formatCurrency } from '@/lib/invoices/calculations'
import { ExportCsvButton } from '@/components/invoices/ExportCsvButton'
import type { InvoiceStatus } from '@/lib/invoices/types'

type StatusFilter = InvoiceStatus | 'all'

export default function InvoicesPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const { data: invoices, isLoading, error } = useInvoices({ status: statusFilter })

  // Get IDs of finalized invoices for CSV export
  const finalizedInvoiceIds = invoices
    ?.filter((i) => ['submitted', 'paid'].includes(i.status))
    .map((i) => i.id) ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-20 inline-block" />
            ) : (
              `${invoices?.length ?? 0} invoice${invoices?.length !== 1 ? 's' : ''}`
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportCsvButton invoiceIds={finalizedInvoiceIds} />
          <Button asChild>
            <Link href="/invoices/generate">
              <Plus className="mr-2 h-4 w-4" />
              Generate Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Invoice Table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Invoice #</TableHead>
              <TableHead>Participant</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                </TableRow>
              ))
            ) : error ? (
              // Error state
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  <p>Failed to load invoices</p>
                  <p className="text-sm text-red-500">{error instanceof Error ? error.message : 'Unknown error'}</p>
                </TableCell>
              </TableRow>
            ) : invoices && invoices.length > 0 ? (
              // Invoice rows
              invoices.map((invoice) => {
                const statusConfig = INVOICE_STATUS_COLORS[invoice.status as InvoiceStatusKey] ?? INVOICE_STATUS_COLORS.draft
                const participantName = invoice.participants
                  ? `${invoice.participants.first_name} ${invoice.participants.last_name}`
                  : 'Unknown'

                return (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <TableCell>
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="font-mono text-xs font-medium text-primary hover:underline"
                      >
                        {invoice.invoice_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                        {participantName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(invoice.period_start), 'dd/MM/yyyy')} -{' '}
                      {format(new Date(invoice.period_end), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(invoice.invoice_date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(invoice.total)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig.badge}>
                        {statusConfig.text}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              // Empty state
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <FileText className="h-10 w-10 text-muted-foreground/50" />
                    <div>
                      <p className="font-medium text-muted-foreground">No invoices yet</p>
                      <p className="text-sm text-muted-foreground/75">
                        Generate your first invoice from completed shifts.
                      </p>
                    </div>
                    <Button asChild size="sm" className="mt-2">
                      <Link href="/invoices/generate">
                        <Plus className="mr-2 h-4 w-4" />
                        Generate Invoice
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
