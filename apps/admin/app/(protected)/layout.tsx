import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name, last_name')
    .eq('id', user.id)
    .single() as { data: { role: string; first_name: string; last_name: string } | null }

  if (!profile || !['admin', 'coordinator'].includes(profile.role)) {
    redirect('/unauthorized')
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card p-6">
        <div className="mb-8">
          <h2 className="font-heading text-lg font-bold text-primary">Ephraim Care</h2>
          <p className="text-xs text-muted-foreground">Admin Portal</p>
        </div>

        <nav className="space-y-1">
          <a href="/" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
            Dashboard
          </a>
          <a href="/participants" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
            Participants
          </a>
          <a href="/workers" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
            Workers
          </a>
          <a href="/shifts" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
            Shifts
          </a>
          <a href="/plans" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
            NDIS Plans
          </a>
          <a href="/invoices" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
            Invoices
          </a>
          <a href="/case-notes" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
            Case Notes
          </a>
          <a href="/incidents" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
            Incidents
          </a>
          <a href="/compliance" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
            Compliance
          </a>
          <a href="/cancellation-requests" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
            Cancellations
          </a>
          <a href="/settings" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
            Settings
          </a>
        </nav>

        <div className="mt-auto pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {profile.first_name} {profile.last_name}
          </p>
          <p className="text-xs font-medium capitalize text-secondary">
            {profile.role}
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
