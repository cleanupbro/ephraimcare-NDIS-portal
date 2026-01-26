'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import type { BudgetReportRow } from '@/lib/reports/types'

// ─── Types ──────────────────────────────────────────────────────────────────

interface BudgetBarChartProps {
  /** Budget data to display */
  data: BudgetReportRow[]
  /** Chart height in pixels */
  height?: number
}

// ─── Ephraim Care Brand Colors ──────────────────────────────────────────────

const COLORS = {
  allocated: '#8b5cf6', // violet-500 (purple tone)
  used: '#0d9488',      // teal-600 (primary brand)
  remaining: '#d1d5db', // gray-300
  grid: '#e5e7eb',      // gray-200
  text: '#374151',      // gray-700
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

// ─── Custom Tooltip ─────────────────────────────────────────────────────────

interface TooltipPayload {
  name: string
  value: number
  fill: string
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
      <p className="font-medium text-gray-900 mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: entry.fill }}
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
 * Horizontal bar chart showing allocated vs used budget per participant.
 * Uses Recharts with responsive container for flexible sizing.
 */
export function BudgetBarChart({ data, height = 400 }: BudgetBarChartProps) {
  // Transform data for chart (limit to top 10 for readability)
  const chartData = data.slice(0, 10).map((row) => ({
    name: row.participantName.length > 20
      ? row.participantName.substring(0, 17) + '...'
      : row.participantName,
    fullName: row.participantName,
    allocated: row.allocatedBudget,
    used: row.usedBudget,
  }))

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground"
        style={{ height }}
      >
        No budget data available for the selected period
      </div>
    )
  }

  // Dynamic height based on number of bars
  const dynamicHeight = Math.max(height, chartData.length * 50 + 80)

  return (
    <ResponsiveContainer width="100%" height={dynamicHeight}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={COLORS.grid}
          horizontal={true}
          vertical={false}
        />
        <XAxis
          type="number"
          tickFormatter={formatCurrency}
          tick={{ fill: COLORS.text, fontSize: 12 }}
          axisLine={{ stroke: COLORS.grid }}
          tickLine={{ stroke: COLORS.grid }}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: COLORS.text, fontSize: 12 }}
          axisLine={{ stroke: COLORS.grid }}
          tickLine={false}
          width={100}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: 16 }}
          formatter={(value) => (
            <span className="text-sm text-gray-600">{value}</span>
          )}
        />
        <Bar
          dataKey="allocated"
          name="Allocated"
          fill={COLORS.allocated}
          radius={[0, 4, 4, 0]}
        />
        <Bar
          dataKey="used"
          name="Used"
          fill={COLORS.used}
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
