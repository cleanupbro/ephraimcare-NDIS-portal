'use client'

import { useState, useMemo } from 'react'
import { startOfMonth, endOfMonth, format as formatDate } from 'date-fns'
import {
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
import { useWorkerHoursReport } from '@/hooks/use-worker-hours-report'
import { useWorkers } from '@/hooks/use-workers'
import { generateCsv, downloadCsv } from '@/lib/reports/csv-export'
import { exportToExcel } from '@/lib/reports/excel-export'
import { downloadPdf } from '@/lib/reports/pdf-export'
import { ReportPdfDocument, type ReportColumn } from '@/components/reports/pdf/ReportPdfDocument'
import type { DateRangeFilter, ExportFormat, WorkerHoursRow, CsvColumn } from '@/lib/reports/types'

// ─── CSV Columns ────────────────────────────────────────────────────────────

const CSV_COLUMNS: CsvColumn<WorkerHoursRow>[] = [
  { header: 'Worker Name', key: 'workerName' },
  { header: 'Shift Count', key: 'shiftCount' },
  { header: 'Total Hours', key: 'totalHours', format: (v) => (v as number).toFixed(2) },
  { header: 'Avg Hours/Shift', key: 'averageHoursPerShift', format: (v) => (v as number).toFixed(2) },
]

// PDF column definitions
const PDF_COLUMNS: ReportColumn<WorkerHoursRow>[] = [
  { header: 'Worker Name', key: 'workerName', width: '40%' },
  { header: 'Shift Count', key: 'shiftCount', width: '20%', align: 'right' },
  { header: 'Total Hours', key: 'totalHours', width: '20%', align: 'right', format: (v) => (v as number).toFixed(2) },
  { header: 'Avg Hours/Shift', key: 'averageHoursPerShift', width: '20%', align: 'right', format: (v) => (v as number).toFixed(2) },
]

// ─── Page ───────────────────────────────────────────────────────────────────

export default function WorkerHoursReportPage() {
  // Default to current month
  const [dateRange, setDateRange] = useState<DateRangeFilter>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('')

  // Fetch report data
  const { data: report, isLoading } = useWorkerHoursReport({
    dateRange,
    workerId: selectedWorkerId || undefined,
  })

  // Fetch workers for filter dropdown
  const { data: workers = [] } = useWorkers({ status: 'all' })

  // Summary statistics
  const summaries = useMemo(() => {
    if (!report) return []
    return [
      { label: 'Total Workers', value: report.totals.totalWorkers },
      { label: 'Total Shifts', value: report.totals.totalShifts },
      { label: 'Total Hours', value: report.totals.totalHours.toFixed(1) },
      { label: 'Avg Hours/Worker', value: report.totals.averageHoursPerWorker.toFixed(1) },
    ]
  }, [report])

  // Export handler
  function handleExport(exportFormat: ExportFormat) {
    if (!report?.data.length) return

    const filename = `worker-hours-${formatDate(dateRange.from, 'yyyy-MM-dd')}-to-${formatDate(dateRange.to, 'yyyy-MM-dd')}`

    if (exportFormat === 'csv') {
      const csv = generateCsv(report.data, CSV_COLUMNS)
      downloadCsv(csv, filename)
    } else if (exportFormat === 'excel') {
      exportToExcel(report.data, CSV_COLUMNS, filename, 'Worker Hours')
    } else if (exportFormat === 'pdf') {
      downloadPdf(
        <ReportPdfDocument
          title="Worker Hours Report"
          dateRange={dateRange}
          summaries={summaries}
          columns={PDF_COLUMNS}
          data={report.data}
        />,
        filename
      )
    }
  }

  // Worker filter slot
  const filterSlot = (
    <Select
      value={selectedWorkerId || 'all'}
      onValueChange={(v) => setSelectedWorkerId(v === 'all' ? '' : v)}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="All Workers" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Workers</SelectItem>
        {workers.map((worker) => (
          <SelectItem key={worker.id} value={worker.id}>
            {worker.profiles.first_name} {worker.profiles.last_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <ReportLayout
      title="Worker Hours Report"
      description="Summary of hours worked per support worker"
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      onExport={handleExport}
      canExport={!isLoading && (report?.data.length ?? 0) > 0}
      summaries={summaries}
      isLoading={isLoading}
      filterSlot={filterSlot}
    >
      {/* Results Table */}
      {report?.data.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No completed shifts found in the selected date range.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker Name</TableHead>
              <TableHead className="text-right">Shift Count</TableHead>
              <TableHead className="text-right">Total Hours</TableHead>
              <TableHead className="text-right">Avg Hours/Shift</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report?.data.map((row) => (
              <TableRow key={row.workerId}>
                <TableCell className="font-medium">{row.workerName}</TableCell>
                <TableCell className="text-right">{row.shiftCount}</TableCell>
                <TableCell className="text-right">{row.totalHours.toFixed(2)}</TableCell>
                <TableCell className="text-right">{row.averageHoursPerShift.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ReportLayout>
  )
}
