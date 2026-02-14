'use client'

import { useParticipantDashboard } from '@/hooks/use-participant-dashboard'
import { BudgetHero } from '@/components/dashboard/budget-hero'
import { PlanInfoCard } from '@/components/dashboard/plan-info-card'
import { AppointmentsCard } from '@/components/dashboard/appointments-card'
import { ExpiredPlanBanner } from '@/components/dashboard/expired-plan-banner'
import { isPast, parseISO } from 'date-fns'

export default function DashboardPage() {
  const { data, isLoading, error } = useParticipantDashboard()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
        <div className="animate-pulse space-y-6">
          <div className="h-48 rounded-xl bg-muted" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-32 rounded-xl bg-muted" />
            <div className="h-32 rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          Unable to load dashboard data. Please try refreshing the page.
        </div>
      </div>
    )
  }

  const { plan, upcomingShifts } = data
  const isPlanExpired = plan && isPast(parseISO(plan.end_date))
  const hasNoPlan = !plan

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        Welcome, {data.participant.first_name}
      </h1>

      {/* Expired plan banner - show at top if plan is past end date */}
      {isPlanExpired && <ExpiredPlanBanner />}

      {/* Budget Hero - large progress bar */}
      <BudgetHero
        allocated={plan?.total_budget ?? 0}
        used={0}
      />

      {/* Two column grid: Plan info | Upcoming appointments */}
      <div className="grid gap-6 md:grid-cols-2">
        {plan && !hasNoPlan ? (
          <PlanInfoCard startDate={plan.start_date} endDate={plan.end_date} />
        ) : (
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground">Plan Period</h3>
            <p className="mt-4 text-sm text-muted-foreground">No active plan on file</p>
          </div>
        )}
        <AppointmentsCard appointments={upcomingShifts} />
      </div>

      {/* OpBros footer */}
      <footer className="pt-8 border-t border-border text-center text-xs text-muted-foreground">
        Powered by{' '}
        <a
          href="https://opbros.online"
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary hover:underline"
        >
          OpBros
        </a>
      </footer>
    </div>
  )
}
