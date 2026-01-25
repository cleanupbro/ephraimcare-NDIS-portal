'use client'

interface BudgetHeroProps {
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
  if (percentage >= 75) return 'bg-amber-500'
  return 'bg-green-500'
}

export function BudgetHero({ allocated, used }: BudgetHeroProps) {
  if (allocated <= 0) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-medium text-muted-foreground">Budget Status</h2>
        <p className="mt-4 text-muted-foreground">No budget information available</p>
      </div>
    )
  }

  const percentage = Math.min(Math.round((used / allocated) * 100), 100)
  const remaining = Math.max(allocated - used, 0)
  const barColor = getBarColor(percentage)

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="text-sm font-medium text-muted-foreground">Budget Status</h2>
      <div className="mt-4 space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-bold">{formatAUD(used)}</span>
          <span className="text-muted-foreground">of {formatAUD(allocated)} used</span>
        </div>
        <div className="h-4 w-full rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className={`font-semibold ${percentage >= 90 ? 'text-red-600' : percentage >= 75 ? 'text-amber-600' : 'text-green-600'}`}>
            {percentage}% used
          </span>
          <span className="text-muted-foreground">{formatAUD(remaining)} remaining</span>
        </div>
        {percentage >= 90 && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            Your budget is nearly exhausted. Please contact your coordinator for assistance.
          </div>
        )}
      </div>
    </div>
  )
}
