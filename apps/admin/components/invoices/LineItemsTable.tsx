'use client'

import { format } from 'date-fns'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@ephraimcare/ui'
import { DAY_TYPE_LABELS } from '@/lib/invoices/constants'
import { formatCurrency, formatHours } from '@/lib/invoices/calculations'
import type { InvoiceLineItem, DayType } from '@/lib/invoices/types'

interface LineItemsTableProps {
  lineItems: InvoiceLineItem[]
}

export function LineItemsTable({ lineItems }: LineItemsTableProps) {
  if (!lineItems || lineItems.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No line items found
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="w-[100px]">Date</TableHead>
          <TableHead>Service</TableHead>
          <TableHead>Day Type</TableHead>
          <TableHead className="text-right">Hours</TableHead>
          <TableHead className="text-right">Rate</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lineItems.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-mono text-sm">
              {format(new Date(item.service_date), 'dd/MM/yyyy')}
            </TableCell>
            <TableCell>
              <span className="capitalize">{item.support_type.replace(/_/g, ' ')}</span>
              {item.ndis_item_number && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({item.ndis_item_number})
                </span>
              )}
            </TableCell>
            <TableCell>
              {DAY_TYPE_LABELS[item.day_type as DayType] || item.day_type}
            </TableCell>
            <TableCell className="text-right font-mono">
              {formatHours(item.billable_minutes)}
            </TableCell>
            <TableCell className="text-right font-mono">
              {formatCurrency(item.unit_price)}/hr
            </TableCell>
            <TableCell className="text-right font-mono font-medium">
              {formatCurrency(item.line_total)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
