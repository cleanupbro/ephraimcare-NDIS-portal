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
import { useParticipantActivityReport } from '@/hooks/use-participant-activity-report'
import { useParticipants } from '@/hooks/use-participants'
import { generateCsv, downloadCsv } from '@/lib/reports/csv-export'
import type { DateRangeFilter, ExportFormat, ParticipantActivityRow, CsvColumn } from '@/lib/reports/types'

// ─── CSV Columns ────────────────────────────────────────────────────────────

const CSV_COLUMNS: CsvColumn<ParticipantActivityRow>[] = [
  { header: 'Participant Name', key: 'participantName' },
  { header: 'Shift Count', key: 'shiftCount' },
  { header: 'Total Hours', key: 'totalHours', format: (v) => (v as number).toFixed(2) },
  { header: 'Last Shift Date', key: 'lastShiftDate', format: (v) => (v as string | null) || 'N/A' },
]

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ParticipantActivityReportPage() {
  // Default to current month
  const [dateRange, setDateRange] = useState<DateRangeFilter>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('')

  // Fetch report data
  const { data: report, isLoading } = useParticipantActivityReport({
    dateRange,
    participantId: selectedParticipantId || undefined,
  })

  // Fetch participants for filter dropdown
  const { data: participants = [] } = useParticipants({ status: 'all' })

  // Summary statistics
  const summaries = useMemo(() => {
    if (!report) return []
    return [
      { label: 'Total Participants', value: report.totals.totalParticipants },
      { label: 'Total Shifts', value: report.totals.totalShifts },
      { label: 'Total Hours', value: report.totals.totalHours.toFixed(1) },
      { label: 'Avg Shifts/Participant', value: report.totals.averageShiftsPerParticipant.toFixed(1) },
    ]
  }, [report])

  // Export handler
  function handleExport(exportFormat: ExportFormat) {
    if (!report?.data.length) return

    if (exportFormat === 'csv') {
      const csv = generateCsv(report.data, CSV_COLUMNS)
      const filename = `participant-activity-${formatDate(dateRange.from, 'yyyy-MM-dd')}-to-${formatDate(dateRange.to, 'yyyy-MM-dd')}`
      downloadCsv(csv, filename)
    }
    // Excel and PDF can be added later
  }

  // Participant filter slot
  const filterSlot = (
    <Select
      value={selectedParticipantId || 'all'}
      onValueChange={(v) => setSelectedParticipantId(v === 'all' ? '' : v)}
    >
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="All Participants" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Participants</SelectItem>
        {participants.map((participant) => (
          <SelectItem key={participant.id} value={participant.id}>
            {participant.first_name} {participant.last_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  // Format last shift date for display
  function formatLastShiftDate(dateStr: string | null): string {
    if (!dateStr) return 'N/A'
    try {
      return formatDate(new Date(dateStr), 'dd MMM yyyy')
    } catch {
      return dateStr
    }
  }

  return (
    <ReportLayout
      title="Participant Activity Report"
      description="Shifts and support hours per participant"
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
              <TableHead>Participant Name</TableHead>
              <TableHead className="text-right">Shift Count</TableHead>
              <TableHead className="text-right">Total Hours</TableHead>
              <TableHead className="text-right">Last Shift Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report?.data.map((row) => (
              <TableRow key={row.participantId}>
                <TableCell className="font-medium">{row.participantName}</TableCell>
                <TableCell className="text-right">{row.shiftCount}</TableCell>
                <TableCell className="text-right">{row.totalHours.toFixed(2)}</TableCell>
                <TableCell className="text-right">{formatLastShiftDate(row.lastShiftDate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ReportLayout>
  )
}
