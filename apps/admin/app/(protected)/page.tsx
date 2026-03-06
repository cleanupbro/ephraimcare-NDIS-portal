import Link from 'next/link'
import { addDays } from 'date-fns'
import { Users, HardHat, Calendar, Receipt, Plus, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatSydneyDate, getCurrentSydneyTime } from '@ephraimcare/utils'
import { ComplianceWidget } from '@/components/dashboard/compliance-widget'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, role')
    .eq('id', user!.id)
    .single() as { data: { first_name: string; last_name: string; role: string } | null }

  // Use Sydney date for "today" queries
  const sydneyNow = getCurrentSydneyTime()
  const today = formatSydneyDate(sydneyNow, 'yyyy-MM-dd')

  // Fetch counts
  const [participants, workers, shifts, invoices] = await Promise.all([
    supabase.from('participants').select('id', { count: 'exact', head: true }),
    supabase.from('workers').select('id', { count: 'exact', head: true }),
    supabase.from('shifts').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  // Today's shifts
  const { count: todayShifts } = await supabase
    .from('shifts')
    .select('id', { count: 'exact', head: true })
    .gte('scheduled_start', `${today}T00:00:00`)
    .lt('scheduled_start', `${today}T23:59:59`)

  // Upcoming shifts (next 5)
  const { data: upcomingShifts } = await (supabase
    .from('shifts')
    .select('id, scheduled_start, scheduled_end, support_type, participants(first_name, last_name), workers(profiles(first_name, last_name))')
    .gte('scheduled_start', new Date().toISOString())
    .in('status', ['pending', 'scheduled', 'confirmed'])
    .order('scheduled_start', { ascending: true })
    .limit(5) as any)

  // Compliance check - workers with expired or expiring NDIS checks
  const ninetyDaysFromNow = addDays(new Date(), 90).toISOString().split('T')[0]
  const { data: complianceWorkers } = await supabase
    .from('workers')
    .select('id, ndis_check_expiry, wwcc_expiry, profiles!inner(first_name, last_name)')
    .eq('is_active', true)
    .or(`ndis_check_expiry.lt.${today},ndis_check_expiry.lte.${ninetyDaysFromNow}`)
    .order('ndis_check_expiry', { ascending: true, nullsFirst: false })
    .limit(10)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold">
          Welcome back, {profile?.first_name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatSydneyDate(sydneyNow, 'EEEE, d MMMM yyyy')} &middot;{' '}
          <span className="font-medium capitalize text-secondary">{profile?.role}</span>
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Participants" value={String(participants.count ?? 0)} href="/participants" icon={<Users className="h-5 w-5" />} />
        <DashboardCard title="Active Workers" value={String(workers.count ?? 0)} href="/workers" icon={<HardHat className="h-5 w-5" />} />
        <DashboardCard title="Today's Shifts" value={String(todayShifts ?? 0)} href="/shifts" icon={<Calendar className="h-5 w-5" />} />
        <DashboardCard title="Pending Invoices" value={String(invoices.count ?? 0)} href="/invoices" icon={<Receipt className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <QuickAction href="/shifts/new" label="Schedule a new shift" />
            <QuickAction href="/participants/new" label="Add a participant" />
            <QuickAction href="/workers/new" label="Invite a worker" />
            <QuickAction href="/invoices" label="Manage invoices" />
          </div>
        </div>

        {/* Compliance */}
        <ComplianceWidget workers={(complianceWorkers ?? []) as any} />
      </div>

      {/* Upcoming Shifts */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-semibold">Upcoming Shifts</h2>
          <Link href="/shifts" className="text-sm text-secondary hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {upcomingShifts && upcomingShifts.length > 0 ? (
          <div className="space-y-2">
            {(upcomingShifts as any[]).map((shift: any) => {
              const participant = shift.participants
                ? `${shift.participants.first_name} ${shift.participants.last_name}`
                : 'Unassigned'
              const worker = shift.workers?.profiles
                ? `${shift.workers.profiles.first_name} ${shift.workers.profiles.last_name}`
                : 'Unassigned'
              return (
                <div key={shift.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{participant}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSydneyDate(shift.scheduled_start, 'EEE d MMM, h:mm a')} &middot; {worker}
                    </p>
                  </div>
                  {shift.support_type && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {shift.support_type}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No upcoming shifts scheduled.
          </p>
        )}
      </div>

      <footer className="pt-4 border-t border-border text-center text-xs text-muted-foreground">
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

function DashboardCard({ title, value, href, icon }: { title: string; value: string; href: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="group block rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <span className="text-muted-foreground/50 group-hover:text-primary transition-colors">{icon}</span>
      </div>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
    </Link>
  )
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm hover:bg-muted/50 hover:border-primary/30 transition-all group"
    >
      <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      <span>{label}</span>
    </Link>
  )
}
