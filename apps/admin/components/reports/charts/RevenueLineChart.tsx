'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import type { RevenueReportRow } from '@/lib/reports/types'

// ─── Types ──────────────────────────────────────────────────────────────────

interface RevenueLineChartProps {
  /** Revenue data to display */
  data: RevenueReportRow[]
  /** Chart height in pixels */
  height?: number
}

// ─── Ephraim Care Brand Colors ──────────────────────────────────────────────

const COLORS = {
  totalRevenue: '#0d9488', // teal-600 (primary brand)
  subtotal: '#8b5cf6',     // violet-500 (secondary)
  grid: '#e5e7eb',         // gray-200
  text: '#374151',         // gray-700
}

// ─── Formatter Helpers ──────────────────────────────────────────────────────

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
    // month is in yyyy-MM format
    const date = parseISO(`${month}-01`)
    return format(date, 'MMM yyyy')
  } catch {
    return month
  }
}

// ─── Custom Tooltip ─────────────────────────────────────────────────────────

interface TooltipPayload {
  name: string
  value: number
  color: string
  dataKey: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="font-medium text-gray-900 mb-2">{label ? formatMonth(label) : ''}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600">{entry.name}</span>
            </span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Line chart showing revenue trends over time.
 * Displays total revenue as primary line and subtotal as secondary.
 * Uses Recharts with responsive container for flexible sizing.
 */
export function RevenueLineChart({ data, height = 350 }: RevenueLineChartProps) {
  // Transform data for chart
  const chartData = data.map((row) => ({
    month: row.month,
    formattedMonth: formatMonth(row.month),
    'Total Revenue': row.totalRevenue,
    'Subtotal (ex GST)': row.subtotal,
    invoices: row.invoiceCount,
  }))

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground"
        style={{ height }}
      >
        No revenue data available for the selected period
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={COLORS.grid}
          vertical={false}
        />
        <XAxis
          dataKey="formattedMonth"
          tick={{ fill: COLORS.text, fontSize: 12 }}
          axisLine={{ stroke: COLORS.grid }}
          tickLine={{ stroke: COLORS.grid }}
        />
        <YAxis
          tickFormatter={formatCurrency}
          tick={{ fill: COLORS.text, fontSize: 12 }}
          axisLine={{ stroke: COLORS.grid }}
          tickLine={{ stroke: COLORS.grid }}
          width={80}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: 16 }}
          formatter={(value) => (
            <span className="text-sm text-gray-600">{value}</span>
          )}
        />
        <Line
          type="monotone"
          dataKey="Total Revenue"
          stroke={COLORS.totalRevenue}
          strokeWidth={3}
          dot={{ r: 4, fill: COLORS.totalRevenue }}
          activeDot={{ r: 6, fill: COLORS.totalRevenue }}
        />
        <Line
          type="monotone"
          dataKey="Subtotal (ex GST)"
          stroke={COLORS.subtotal}
          strokeWidth={2}
          dot={{ r: 3, fill: COLORS.subtotal }}
          activeDot={{ r: 5, fill: COLORS.subtotal }}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
