'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button, Card, CardContent, Skeleton } from '@ephraimcare/ui'
import { DateRangePicker } from './DateRangePicker'
import { ExportButtons } from './ExportButtons'
import type { DateRangeFilter, ExportFormat, ReportSummary } from '@/lib/reports/types'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ReportLayoutProps {
  /** Report title displayed in header */
  title: string
  /** Optional description below title */
  description?: string
  /** Current date range filter */
  dateRange: DateRangeFilter
  /** Date range change handler */
  onDateRangeChange: (range: DateRangeFilter) => void
  /** Export handler */
  onExport: (format: ExportFormat) => void
  /** Whether export is available (requires data) */
  canExport: boolean
  /** Summary statistics to display */
  summaries?: ReportSummary[]
  /** Loading state */
  isLoading?: boolean
  /** Additional filter controls */
  filterSlot?: ReactNode
  /** Main report content (chart, table, etc.) */
  children: ReactNode
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ReportLayout({
  title,
  description,
  dateRange,
  onDateRangeChange,
  onExport,
  canExport,
  summaries,
  isLoading,
  filterSlot,
  children,
}: ReportLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Reports
            </Link>
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        {/* Export Buttons */}
        <ExportButtons onExport={onExport} disabled={!canExport} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
        {filterSlot}
      </div>

      {/* Summary Cards */}
      {summaries && summaries.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {summaries.map((summary, i) => (
            <SummaryCard key={i} summary={summary} isLoading={isLoading} />
          ))}
        </div>
      )}

      {/* Main Content */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            children
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Summary Card ───────────────────────────────────────────────────────────

interface SummaryCardProps {
  summary: ReportSummary
  isLoading?: boolean
}

function SummaryCard({ summary, isLoading }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm font-medium text-muted-foreground">{summary.label}</p>
        {isLoading ? (
          <Skeleton className="h-8 w-24 mt-1" />
        ) : (
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold">{summary.value}</span>
            {summary.change && (
              <span
                className={`text-xs font-medium ${
                  summary.change.direction === 'up'
                    ? 'text-green-600'
                    : summary.change.direction === 'down'
                      ? 'text-red-600'
                      : 'text-muted-foreground'
                }`}
              >
                {summary.change.direction === 'up' && '+'}
                {summary.change.direction === 'down' && '-'}
                {summary.change.value}%
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
