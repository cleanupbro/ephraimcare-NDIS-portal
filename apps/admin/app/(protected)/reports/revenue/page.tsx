'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { DollarSign, FileText, PieChart as PieChartIcon, TrendingUp } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Progress,
} from '@ephraimcare/ui'
import { ReportLayout } from '@/components/reports/ReportLayout'
import { ChartCard } from '@/components/reports/charts/ChartCard'
import { RevenueLineChart } from '@/components/reports/charts/RevenueLineChart'
import { useRevenueReport, type SupportTypeBreakdown } from '@/hooks/use-revenue-report'
import { generateCsv, downloadCsv } from '@/lib/reports/csv-export'
import { DATE_RANGE_PRESETS } from '@/lib/reports/constants'
import type { DateRangeFilter, ExportFormat, RevenueReportRow, CsvColumn } from '@/lib/reports/types'
import { subMonths, startOfMonth, endOfMonth } from 'date-fns'

// ─── Currency Formatter ─────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatMonth(month: string): string {
  try {
    const [year, m] = month.split('-')
    const date = new Date(parseInt(year), parseInt(m) - 1, 1)
    return format(date, 'MMMM yyyy')
  } catch {
    return month
  }
}

// ─── CSV Columns Definition ─────────────────────────────────────────────────

const CSV_COLUMNS: CsvColumn<RevenueReportRow>[] = [
  { header: 'Month', key: 'month', format: (v) => formatMonth(String(v)) },
  { header: 'Invoice Count', key: 'invoiceCount', format: (v) => String(v) },
  { header: 'Subtotal (ex GST)', key: 'subtotal', format: (v) => String(v) },
  { header: 'GST', key: 'gst', format: (v) => String(v) },
  { header: 'Total Revenue', key: 'totalRevenue', format: (v) => String(v) },
]

// ─── Support Type Card ──────────────────────────────────────────────────────

interface SupportTypeCardProps {
  data: SupportTypeBreakdown[]
  isLoading?: boolean
}

function SupportTypeCard({ data, isLoading }: SupportTypeCardProps) {
  // Color palette for support types (max 8 colors, then cycle)
  const SUPPORT_TYPE_COLORS = [
    '#0d9488', // teal-600
    '#8b5cf6', // violet-500
    '#f59e0b', // amber-500
    '#ec4899', // pink-500
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#ef4444', // red-500
    '#6366f1', // indigo-500
  ]

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-muted-foreground" />
            Support Type Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-muted-foreground" />
            Support Type Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-sm text-muted-foreground">
            No support type data available for the selected period.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-muted-foreground" />
          Support Type Breakdown
        </CardTitle>
        <CardDescription>Revenue distribution by support category</CardDescription>
      </CardHeader>
      <CardContent className="pt-2 space-y-3">
        {data.map((item, index) => {
          const color = SUPPORT_TYPE_COLORS[index % SUPPORT_TYPE_COLORS.length]
          return (
            <div key={item.supportType} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate max-w-[140px]" title={item.supportType}>
                    {item.supportType}
                  </span>
                </span>
                <span className="font-medium text-right">
                  {formatCurrency(item.revenue)}
                  <span className="text-muted-foreground ml-1">
                    ({item.percentage.toFixed(1)}%)
                  </span>
                </span>
              </div>
              <Progress
                value={item.percentage}
                className="h-2"
                style={
                  {
                    '--progress-color': color,
                  } as React.CSSProperties
                }
              />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default function RevenueReportPage() {
  // Default to "Last 6 Months" (customize for revenue trends)
  const [dateRange, setDateRange] = useState<DateRangeFilter>(() => ({
    from: startOfMonth(subMonths(new Date(), 5)),
    to: endOfMonth(new Date()),
  }))

  // Fetch revenue report data
  const { data: reportData, isLoading } = useRevenueReport(dateRange)

  // Extract data with defaults
  const rows = reportData?.rows ?? []
  const supportTypeBreakdown = reportData?.supportTypeBreakdown ?? []
  const totals = reportData?.totals ?? {
    totalRevenue: 0,
    totalSubtotal: 0,
    totalGst: 0,
    totalInvoices: 0,
  }

  // Calculate summaries
  const summaries = useMemo(() => {
    return [
      {
        label: 'Total Revenue',
        value: formatCurrency(totals.totalRevenue),
      },
      {
        label: 'Subtotal (ex GST)',
        value: formatCurrency(totals.totalSubtotal),
      },
      {
        label: 'Total GST',
        value: formatCurrency(totals.totalGst),
      },
      {
        label: 'Invoices',
        value: totals.totalInvoices,
      },
    ]
  }, [totals])

  // Handle export
  function handleExport(exportFormat: ExportFormat) {
    if (exportFormat === 'csv') {
      const csv = generateCsv(rows, CSV_COLUMNS)
      const filename = `revenue-report-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}`
      downloadCsv(csv, filename)
    } else if (exportFormat === 'excel') {
      // Excel export - placeholder for plan 05
      console.log('Excel export not yet implemented')
    } else if (exportFormat === 'pdf') {
      // PDF export - placeholder for plan 05
      console.log('PDF export not yet implemented')
    }
  }

  // Calculate monthly average
  const monthlyAverage = rows.length > 0
    ? totals.totalRevenue / rows.filter(r => r.invoiceCount > 0).length || 0
    : 0

  return (
    <ReportLayout
      title="Revenue Trends Report"
      description={`Analyze invoicing patterns and revenue over time. Monthly average: ${formatCurrency(monthlyAverage)}`}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      onExport={handleExport}
      canExport={rows.length > 0}
      summaries={summaries}
      isLoading={isLoading}
    >
      <div className="space-y-6">
        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue Line Chart (2/3 width) */}
          <div className="lg:col-span-2">
            <ChartCard
              title="Revenue Trends"
              description="Total revenue and subtotal over time"
            >
              <RevenueLineChart data={rows} height={320} />
            </ChartCard>
          </div>

          {/* Support Type Breakdown (1/3 width) */}
          <div className="lg:col-span-1">
            <SupportTypeCard data={supportTypeBreakdown} isLoading={isLoading} />
          </div>
        </div>

        {/* Monthly Data Table */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Monthly Breakdown</h3>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No revenue data found for the selected period.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Invoices</TableHead>
                    <TableHead className="text-right">Subtotal (ex GST)</TableHead>
                    <TableHead className="text-right">GST</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell className="font-medium">{formatMonth(row.month)}</TableCell>
                      <TableCell className="text-right">
                        <span className="flex items-center justify-end gap-1">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          {row.invoiceCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(row.subtotal)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(row.gst)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className="flex items-center justify-end gap-1">
                          <DollarSign className="h-3 w-3 text-teal-600" />
                          {formatCurrency(row.totalRevenue)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{totals.totalInvoices}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.totalSubtotal)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.totalGst)}</TableCell>
                    <TableCell className="text-right">
                      <span className="flex items-center justify-end gap-1 text-teal-600">
                        <TrendingUp className="h-4 w-4" />
                        {formatCurrency(totals.totalRevenue)}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-6 text-sm text-muted-foreground pt-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-teal-600" />
            <span>Total Revenue (inc GST)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-violet-500" />
            <span>Subtotal (ex GST)</span>
          </div>
        </div>
      </div>
    </ReportLayout>
  )
}
