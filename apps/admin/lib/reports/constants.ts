// ─── Date Range Presets ─────────────────────────────────────────────────────

import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
} from 'date-fns'

/** Preset date ranges for report filters */
export const DATE_RANGE_PRESETS = [
  {
    label: 'This Month',
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: 'Last Month',
    getValue: () => ({
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
  {
    label: 'This Quarter',
    getValue: () => ({
      from: startOfQuarter(new Date()),
      to: endOfQuarter(new Date()),
    }),
  },
  {
    label: 'Last 3 Months',
    getValue: () => ({
      from: startOfMonth(subMonths(new Date(), 2)),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: 'This Year',
    getValue: () => ({
      from: startOfYear(new Date()),
      to: endOfYear(new Date()),
    }),
  },
] as const

// ─── Alert Thresholds ───────────────────────────────────────────────────────

/** Budget utilization warning threshold (percentage) */
export const BUDGET_WARNING_THRESHOLD = 75

/** Budget utilization critical threshold (percentage) */
export const BUDGET_CRITICAL_THRESHOLD = 90

// ─── Export Limits ──────────────────────────────────────────────────────────

/** Maximum rows for client-side export (prevent browser memory issues) */
export const MAX_EXPORT_ROWS = 5000

// ─── Report Type Definitions ────────────────────────────────────────────────

/** Available report types */
export const REPORT_TYPES = [
  {
    id: 'budget',
    name: 'Budget Utilization',
    description: 'Track NDIS plan spending and remaining budgets',
    href: '/reports/budget',
    icon: 'DollarSign',
  },
  {
    id: 'revenue',
    name: 'Revenue Trends',
    description: 'Analyze invoicing patterns and revenue over time',
    href: '/reports/revenue',
    icon: 'TrendingUp',
  },
  {
    id: 'worker-hours',
    name: 'Worker Hours',
    description: 'Summary of hours worked per support worker',
    href: '/reports/worker-hours',
    icon: 'Clock',
  },
  {
    id: 'participant-activity',
    name: 'Participant Activity',
    description: 'Shifts and support hours per participant',
    href: '/reports/participant-activity',
    icon: 'Users',
  },
] as const

/** Report type ID union */
export type ReportTypeId = (typeof REPORT_TYPES)[number]['id']
