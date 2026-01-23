import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, role')
    .eq('id', user!.id)
    .single() as { data: { first_name: string; last_name: string; role: string } | null }

  // Fetch counts
  const [participants, workers, shifts, invoices] = await Promise.all([
    supabase.from('participants').select('id', { count: 'exact', head: true }),
    supabase.from('workers').select('id', { count: 'exact', head: true }),
    supabase.from('shifts').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  // Today's shifts
  const today = new Date().toISOString().split('T')[0]
  const { count: todayShifts } = await supabase
    .from('shifts')
    .select('id', { count: 'exact', head: true })
    .gte('scheduled_start', `${today}T00:00:00`)
    .lt('scheduled_start', `${today}T23:59:59`)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">
          Welcome back, {profile?.first_name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Role: <span className="font-medium capitalize text-secondary">{profile?.role}</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Participants" value={String(participants.count ?? 0)} href="/participants" />
        <DashboardCard title="Workers" value={String(workers.count ?? 0)} href="/workers" />
        <DashboardCard title="Today's Shifts" value={String(todayShifts ?? 0)} href="/shifts" />
        <DashboardCard title="Pending Invoices" value={String(invoices.count ?? 0)} href="/invoices" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border p-6">
          <h2 className="font-heading text-lg font-semibold mb-3">Quick Actions</h2>
          <div className="space-y-2">
            <a href="/shifts" className="block rounded-md border border-border px-4 py-3 text-sm hover:bg-muted">
              Schedule a new shift
            </a>
            <a href="/participants" className="block rounded-md border border-border px-4 py-3 text-sm hover:bg-muted">
              Add a participant
            </a>
            <a href="/invoices" className="block rounded-md border border-border px-4 py-3 text-sm hover:bg-muted">
              Create an invoice
            </a>
          </div>
        </div>

        <div className="rounded-lg border border-border p-6">
          <h2 className="font-heading text-lg font-semibold mb-3">Upcoming Shifts</h2>
          <p className="text-sm text-muted-foreground">
            {(shifts.count ?? 0)} scheduled shifts remaining
          </p>
        </div>
      </div>

      <footer className="mt-12 pt-4 border-t border-border text-center text-xs text-muted-foreground">
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

function DashboardCard({ title, value, href }: { title: string; value: string; href: string }) {
  return (
    <a href={href} className="block rounded-lg border border-border bg-card p-6 hover:bg-muted/30 transition-colors">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </a>
  )
}
