"use client"

interface BudgetProgressProps {
  allocated: number
  used: number
}

function formatAUD(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getBarColor(percentage: number): string {
  if (percentage >= 90) return 'bg-red-500'
  if (percentage >= 70) return 'bg-amber-500'
  return 'bg-green-500'
}

function getTextColor(percentage: number): string {
  if (percentage >= 90) return 'text-red-600'
  if (percentage >= 70) return 'text-amber-600'
  return 'text-green-600'
}

export function BudgetProgress({ allocated, used }: BudgetProgressProps) {
  if (allocated <= 0) {
    return (
      <div className="text-sm text-muted-foreground">No budget data</div>
    )
  }

  const percentage = Math.min(Math.round((used / allocated) * 100), 100)
  const barColor = getBarColor(percentage)
  const textColor = getTextColor(percentage)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {formatAUD(used)} of {formatAUD(allocated)}
        </span>
        <span className={`font-semibold ${textColor}`}>
          {percentage}%
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
