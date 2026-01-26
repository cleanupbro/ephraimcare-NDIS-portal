'use client'

import { Card, CardContent } from '@ephraimcare/ui'

interface HealthScoreCardProps {
  score: number
  isLoading?: boolean
}

export function HealthScoreCard({ score, isLoading }: HealthScoreCardProps) {
  // Color based on score
  let colorClass = 'text-green-600'
  let bgClass = 'stroke-green-600'
  let label = 'Excellent'

  if (score < 60) {
    colorClass = 'text-red-600'
    bgClass = 'stroke-red-600'
    label = 'Needs Attention'
  } else if (score < 80) {
    colorClass = 'text-amber-600'
    bgClass = 'stroke-amber-600'
    label = 'Good'
  }

  // SVG circle parameters
  const size = 160
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = isLoading ? 0 : (score / 100) * circumference
  const offset = circumference - progress

  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            <svg width={size} height={size} className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={strokeWidth}
                className="stroke-muted"
              />
              {/* Progress circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className={`${bgClass} transition-all duration-500`}
              />
            </svg>
            {/* Score text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isLoading ? (
                <span className="text-2xl text-muted-foreground">...</span>
              ) : (
                <>
                  <span className={`text-4xl font-bold ${colorClass}`}>{score}%</span>
                  <span className="text-xs text-muted-foreground mt-1">{label}</span>
                </>
              )}
            </div>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-center">Compliance Health</h3>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Overall organizational compliance score
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
