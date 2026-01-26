// ─── Date Range Types ───────────────────────────────────────────────────────

/** Common date range filter used by all reports */
export interface DateRangeFilter {
  from: Date
  to: Date
}

/** Full filter set for reports with optional entity constraints */
export interface ReportFilters {
  dateRange: DateRangeFilter
  participantId?: string
  workerId?: string
  supportType?: string
}

// ─── Export Types ───────────────────────────────────────────────────────────

/** Supported export formats */
export type ExportFormat = 'csv' | 'excel' | 'pdf'

// ─── Report Data Shapes ─────────────────────────────────────────────────────

/** Budget utilization report row */
export interface BudgetReportRow {
  participantId: string
  participantName: string
  ndisNumber: string
  allocatedBudget: number
  usedBudget: number
  remainingBudget: number
  utilizationPercent: number
  alert: 'ok' | 'warning' | 'critical'
}

/** Revenue trends report row */
export interface RevenueReportRow {
  month: string
  invoiceCount: number
  totalRevenue: number
  subtotal: number
  gst: number
}

/** Worker hours report row */
export interface WorkerHoursRow {
  workerId: string
  workerName: string
  shiftCount: number
  totalHours: number
  averageHoursPerShift: number
}

/** Participant activity report row */
export interface ParticipantActivityRow {
  participantId: string
  participantName: string
  shiftCount: number
  totalHours: number
  lastShiftDate: string | null
}

// ─── CSV Export Types ───────────────────────────────────────────────────────

/** Column definition for generic CSV export */
export interface CsvColumn<T> {
  header: string
  key: keyof T
  format?: (value: T[keyof T]) => string
}

// ─── Report Summary Types ───────────────────────────────────────────────────

/** Summary statistics displayed in report header */
export interface ReportSummary {
  label: string
  value: string | number
  change?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
}
