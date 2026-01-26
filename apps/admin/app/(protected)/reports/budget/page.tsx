'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react'
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ephraimcare/ui'
import { ReportLayout } from '@/components/reports/ReportLayout'
import { ChartCard } from '@/components/reports/charts/ChartCard'
import { BudgetBarChart } from '@/components/reports/charts/BudgetBarChart'
import { useBudgetReport, calculateBudgetSummaries } from '@/hooks/use-budget-report'
import { useParticipants } from '@/hooks/use-participants'
import { generateCsv, downloadCsv } from '@/lib/reports/csv-export'
import { exportToExcel } from '@/lib/reports/excel-export'
import { downloadPdf } from '@/lib/reports/pdf-export'
import { ReportPdfDocument, type ReportColumn } from '@/components/reports/pdf/ReportPdfDocument'
import { DATE_RANGE_PRESETS } from '@/lib/reports/constants'
import type { DateRangeFilter, ExportFormat, BudgetReportRow, CsvColumn } from '@/lib/reports/types'

// ─── Alert Badge Component ──────────────────────────────────────────────────

function AlertBadge({ alert }: { alert: 'ok' | 'warning' | 'critical' }) {
  if (alert === 'critical') {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        Critical
      </Badge>
    )
  }

  if (alert === 'warning') {
    return (
      <Badge className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
        <AlertTriangle className="h-3 w-3" />
        Warning
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <CheckCircle className="h-3 w-3" />
      OK
    </Badge>
  )
}

// ─── Currency Formatter ─────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// ─── CSV Columns Definition ─────────────────────────────────────────────────

const CSV_COLUMNS: CsvColumn<BudgetReportRow>[] = [
  { header: 'Participant Name', key: 'participantName' },
  { header: 'NDIS Number', key: 'ndisNumber' },
  { header: 'Allocated Budget', key: 'allocatedBudget', format: (v) => String(v) },
  { header: 'Used Budget', key: 'usedBudget', format: (v) => String(v) },
  { header: 'Remaining Budget', key: 'remainingBudget', format: (v) => String(v) },
  { header: 'Utilization %', key: 'utilizationPercent', format: (v) => `${v}%` },
  { header: 'Status', key: 'alert' },
]

// PDF column definitions (wider for readability)
const PDF_COLUMNS: ReportColumn<BudgetReportRow>[] = [
  { header: 'Participant', key: 'participantName', width: '25%' },
  { header: 'NDIS Number', key: 'ndisNumber', width: '18%' },
  { header: 'Allocated', key: 'allocatedBudget', width: '14%', align: 'right', format: (v) => formatCurrency(v as number) },
  { header: 'Used', key: 'usedBudget', width: '14%', align: 'right', format: (v) => formatCurrency(v as number) },
  { header: 'Remaining', key: 'remainingBudget', width: '14%', align: 'right', format: (v) => formatCurrency(v as number) },
  { header: 'Util %', key: 'utilizationPercent', width: '8%', align: 'right', format: (v) => `${v}%` },
  { header: 'Status', key: 'alert', width: '7%' },
]

// ─── Page Component ─────────────────────────────────────────────────────────

export default function BudgetReportPage() {
  // Default to "This Month"
  const [dateRange, setDateRange] = useState<DateRangeFilter>(
    DATE_RANGE_PRESETS[0].getValue()
  )
  const [participantId, setParticipantId] = useState<string>('')

  // Fetch participants for filter dropdown
  const { data: participants = [] } = useParticipants({ status: 'all' })

  // Fetch budget report data
  const { data: reportData = [], isLoading } = useBudgetReport({
    dateRange,
    participantId: participantId || undefined,
  })

  // Calculate summaries
  const summaries = useMemo(() => {
    const stats = calculateBudgetSummaries(reportData)
    return [
      {
        label: 'Total Allocated',
        value: formatCurrency(stats.totalAllocated),
      },
      {
        label: 'Total Used',
        value: formatCurrency(stats.totalUsed),
      },
      {
        label: 'Total Remaining',
        value: formatCurrency(stats.totalRemaining),
      },
      {
        label: 'Participants',
        value: stats.participantCount,
      },
    ]
  }, [reportData])

  // Handle export
  function handleExport(exportFormat: ExportFormat) {
    const filename = `budget-report-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}`

    if (exportFormat === 'csv') {
      const csv = generateCsv(reportData, CSV_COLUMNS)
      downloadCsv(csv, filename)
    } else if (exportFormat === 'excel') {
      exportToExcel(reportData, CSV_COLUMNS, filename, 'Budget Report')
    } else if (exportFormat === 'pdf') {
      downloadPdf(
        <ReportPdfDocument
          title="Budget Utilization Report"
          dateRange={dateRange}
          summaries={summaries}
          columns={PDF_COLUMNS}
          data={reportData}
        />,
        filename
      )
    }
  }

  // Participant filter slot
  const filterSlot = (
    <Select
      value={participantId || '__all__'}
      onValueChange={(value) => setParticipantId(value === '__all__' ? '' : value)}
    >
      <SelectTrigger className="w-[200px]">
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
  )

  // Alert counts for subheading
  const warningCount = reportData.filter((r) => r.alert === 'warning').length
  const criticalCount = reportData.filter((r) => r.alert === 'critical').length

  return (
    <ReportLayout
      title="Budget Utilization Report"
      description={`Track NDIS plan spending across participants. ${criticalCount > 0 ? `${criticalCount} critical, ` : ''}${warningCount > 0 ? `${warningCount} warning` : ''}`}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      onExport={handleExport}
      canExport={reportData.length > 0}
      summaries={summaries}
      isLoading={isLoading}
      filterSlot={filterSlot}
    >
      <div className="space-y-6">
        {/* Bar Chart */}
        <ChartCard
          title="Budget Overview"
          description="Allocated vs used budget per participant (top 10 by utilization)"
        >
          <BudgetBarChart data={reportData} height={350} />
        </ChartCard>

        {/* Data Table */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Detailed Breakdown</h3>
          {reportData.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No budget data found for the selected period.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead>NDIS Number</TableHead>
                    <TableHead className="text-right">Allocated</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Utilization</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((row) => (
                    <TableRow key={row.participantId}>
                      <TableCell className="font-medium">{row.participantName}</TableCell>
                      <TableCell className="font-mono text-sm">{row.ndisNumber}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.allocatedBudget)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.usedBudget)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.remainingBudget)}</TableCell>
                      <TableCell className="text-right">
                        <span className={
                          row.alert === 'critical'
                            ? 'text-red-600 font-medium'
                            : row.alert === 'warning'
                              ? 'text-amber-600 font-medium'
                              : ''
                        }>
                          {row.utilizationPercent}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <AlertBadge alert={row.alert} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-6 text-sm text-muted-foreground pt-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span>OK (&lt;75%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Warning (75-90%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span>Critical (&gt;90%)</span>
          </div>
        </div>
      </div>
    </ReportLayout>
  )
}
