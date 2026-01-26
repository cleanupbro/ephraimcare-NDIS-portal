'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { startOfMonth, endOfMonth, addDays, isAfter, isBefore } from 'date-fns'

export interface ComplianceMetrics {
  overallScore: number
  workers: {
    total: number
    valid: number
    expiring: number
    expired: number
    rate: number
  }
  incidents: {
    total: number
    open: number
    inReview: number
    closed: number
    pendingNdia: number
    rate: number
  }
  documentation: {
    totalParticipants: number
    withActivePlan: number
    rate: number
  }
}

export function useComplianceMetrics() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['compliance-metrics'],
    queryFn: async (): Promise<ComplianceMetrics> => {
      const now = new Date()
      const monthStart = startOfMonth(now)
      const monthEnd = endOfMonth(now)
      const thirtyDaysFromNow = addDays(now, 30)

      // Fetch all data in parallel
      const [workersRes, incidentsRes, participantsRes, plansRes] = await Promise.all([
        // Active workers with their check expiry dates
        supabase
          .from('workers')
          .select('id, ndis_check_expiry, wwcc_expiry, first_aid_expiry')
          .eq('is_active', true),

        // Incidents this month
        (supabase.from('incidents') as any)
          .select('id, status, requires_ndia_report, ndia_reported_at')
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString()),

        // Active participants
        supabase
          .from('participants')
          .select('id')
          .eq('is_active', true),

        // Active NDIS plans
        supabase
          .from('ndis_plans')
          .select('participant_id')
          .eq('is_current', true),
      ])

      const workers = workersRes.data || []
      const incidents = incidentsRes.data || []
      const participants = participantsRes.data || []
      const plans = plansRes.data || []

      // Calculate worker compliance
      let validWorkers = 0
      let expiringWorkers = 0
      let expiredWorkers = 0

      workers.forEach((worker: any) => {
        const checkDates = [
          worker.ndis_check_expiry,
          worker.wwcc_expiry,
          worker.first_aid_expiry,
        ].filter(Boolean)

        if (checkDates.length === 0) {
          expiredWorkers++
          return
        }

        const hasExpired = checkDates.some((d: string) => isBefore(new Date(d), now))
        const hasExpiring = checkDates.some(
          (d: string) => isAfter(new Date(d), now) && isBefore(new Date(d), thirtyDaysFromNow)
        )

        if (hasExpired) {
          expiredWorkers++
        } else if (hasExpiring) {
          expiringWorkers++
        } else {
          validWorkers++
        }
      })

      const workerRate = workers.length > 0 ? (validWorkers / workers.length) * 100 : 100

      // Calculate incident metrics
      const openIncidents = incidents.filter((i: any) => i.status === 'open').length
      const inReviewIncidents = incidents.filter((i: any) => i.status === 'in_review').length
      const closedIncidents = incidents.filter((i: any) => i.status === 'closed').length
      const pendingNdia = incidents.filter(
        (i: any) => i.requires_ndia_report && !i.ndia_reported_at
      ).length

      const incidentRate = incidents.length > 0
        ? (closedIncidents / incidents.length) * 100
        : 100

      // Calculate documentation metrics
      const participantIds = participants.map((p: any) => p.id)
      const plansParticipantIds = new Set(plans.map((p: any) => p.participant_id))
      const withActivePlan = participantIds.filter((id: string) => plansParticipantIds.has(id)).length
      const docRate = participants.length > 0
        ? (withActivePlan / participants.length) * 100
        : 100

      // Calculate overall score (weighted average)
      // Workers: 40%, Incidents: 30%, Documentation: 30%
      const overallScore = Math.round(
        workerRate * 0.4 + incidentRate * 0.3 + docRate * 0.3
      )

      return {
        overallScore,
        workers: {
          total: workers.length,
          valid: validWorkers,
          expiring: expiringWorkers,
          expired: expiredWorkers,
          rate: Math.round(workerRate),
        },
        incidents: {
          total: incidents.length,
          open: openIncidents,
          inReview: inReviewIncidents,
          closed: closedIncidents,
          pendingNdia,
          rate: Math.round(incidentRate),
        },
        documentation: {
          totalParticipants: participants.length,
          withActivePlan,
          rate: Math.round(docRate),
        },
      }
    },
  })
}
