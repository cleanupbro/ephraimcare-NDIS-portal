'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { BudgetReportRow, DateRangeFilter } from '@/lib/reports/types'
import {
  BUDGET_WARNING_THRESHOLD,
  BUDGET_CRITICAL_THRESHOLD,
} from '@/lib/reports/constants'

// ─── Types ──────────────────────────────────────────────────────────────────

interface UseBudgetReportOptions {
  dateRange: DateRangeFilter
  participantId?: string
}

interface PlanBudgetWithPlan {
  id: string
  plan_id: string
  category: string
  subcategory: string | null
  allocated_amount: number
  used_amount: number
  ndis_plans: {
    id: string
    participant_id: string
    start_date: string
    end_date: string
    participants: {
      id: string
      first_name: string
      last_name: string
      ndis_number: string
    } | null
  } | null
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Fetches budget data from plan_budgets and aggregates by participant.
 * Calculates utilization percentage and assigns alert status.
 */
export function useBudgetReport({ dateRange, participantId }: UseBudgetReportOptions) {
  return useQuery<BudgetReportRow[]>({
    queryKey: ['budget-report', { dateRange, participantId }],
    queryFn: async () => {
      const supabase = createClient()

      // Query plan_budgets with join to ndis_plans and participants
      // Using (as any) assertion for PostgREST type compatibility
      let query = (supabase
        .from('plan_budgets')
        .select(`
          id,
          plan_id,
          category,
          subcategory,
          allocated_amount,
          used_amount,
          ndis_plans!inner (
            id,
            participant_id,
            start_date,
            end_date,
            participants!inner (
              id,
              first_name,
              last_name,
              ndis_number
            )
          )
        `) as any)

      // Filter by date range (plans active within the range)
      query = query
        .lte('ndis_plans.start_date', dateRange.to.toISOString().split('T')[0])
        .gte('ndis_plans.end_date', dateRange.from.toISOString().split('T')[0])

      // Optional participant filter
      if (participantId) {
        query = query.eq('ndis_plans.participant_id', participantId)
      }

      const { data, error } = await query

      if (error) throw error

      // Aggregate by participant
      const budgetData = data as PlanBudgetWithPlan[]
      const participantMap = new Map<string, {
        participantId: string
        participantName: string
        ndisNumber: string
        allocatedBudget: number
        usedBudget: number
      }>()

      for (const budget of budgetData) {
        const participant = budget.ndis_plans?.participants
        if (!participant) continue

        const existing = participantMap.get(participant.id)

        if (existing) {
          existing.allocatedBudget += Number(budget.allocated_amount) || 0
          existing.usedBudget += Number(budget.used_amount) || 0
        } else {
          participantMap.set(participant.id, {
            participantId: participant.id,
            participantName: `${participant.first_name} ${participant.last_name}`,
            ndisNumber: participant.ndis_number,
            allocatedBudget: Number(budget.allocated_amount) || 0,
            usedBudget: Number(budget.used_amount) || 0,
          })
        }
      }

      // Convert to report rows with utilization and alert status
      const rows: BudgetReportRow[] = Array.from(participantMap.values()).map((p) => {
        const remainingBudget = p.allocatedBudget - p.usedBudget
        const utilizationPercent = p.allocatedBudget > 0
          ? Math.min((p.usedBudget / p.allocatedBudget) * 100, 100)
          : 0

        let alert: 'ok' | 'warning' | 'critical' = 'ok'
        if (utilizationPercent >= BUDGET_CRITICAL_THRESHOLD) {
          alert = 'critical'
        } else if (utilizationPercent >= BUDGET_WARNING_THRESHOLD) {
          alert = 'warning'
        }

        return {
          participantId: p.participantId,
          participantName: p.participantName,
          ndisNumber: p.ndisNumber,
          allocatedBudget: p.allocatedBudget,
          usedBudget: p.usedBudget,
          remainingBudget,
          utilizationPercent: Math.round(utilizationPercent * 10) / 10, // 1 decimal
          alert,
        }
      })

      // Sort by utilization (highest first)
      rows.sort((a, b) => b.utilizationPercent - a.utilizationPercent)

      return rows
    },
    staleTime: 60 * 1000, // 1 minute
  })
}

// ─── Summary Helpers ────────────────────────────────────────────────────────

/**
 * Calculate summary statistics from budget report data.
 */
export function calculateBudgetSummaries(data: BudgetReportRow[]) {
  if (data.length === 0) {
    return {
      totalAllocated: 0,
      totalUsed: 0,
      totalRemaining: 0,
      participantCount: 0,
      warningCount: 0,
      criticalCount: 0,
    }
  }

  const totalAllocated = data.reduce((sum, row) => sum + row.allocatedBudget, 0)
  const totalUsed = data.reduce((sum, row) => sum + row.usedBudget, 0)
  const totalRemaining = data.reduce((sum, row) => sum + row.remainingBudget, 0)
  const warningCount = data.filter((row) => row.alert === 'warning').length
  const criticalCount = data.filter((row) => row.alert === 'critical').length

  return {
    totalAllocated,
    totalUsed,
    totalRemaining,
    participantCount: data.length,
    warningCount,
    criticalCount,
  }
}
