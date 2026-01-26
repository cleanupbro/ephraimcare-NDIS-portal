'use client'

import { type ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@ephraimcare/ui'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChartCardProps {
  /** Chart title */
  title: string
  /** Optional description below title */
  description?: string
  /** Chart content */
  children: ReactNode
  /** Custom class for card content */
  className?: string
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Reusable card wrapper for chart components.
 * Provides consistent styling with optional title and description.
 */
export function ChartCard({ title, description, children, className }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  )
}
