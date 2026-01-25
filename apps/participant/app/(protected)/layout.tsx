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

  // Fetch user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name, last_name')
    .eq('id', user.id)
    .single() as { data: { role: string; first_name: string; last_name: string } | null }

  if (!profile || profile.role !== 'participant') {
    redirect('/unauthorized')
  }

  // Fetch linked participant record
  const { data: participant } = await supabase
    .from('participants')
    .select('id, first_name, last_name, ndis_number')
    .eq('profile_id', user.id)
    .single() as { data: { id: string; first_name: string; last_name: string; ndis_number: string } | null }

  if (!participant) {
    redirect('/unauthorized')
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card p-6 flex flex-col">
        <div className="mb-8">
          <h2 className="font-heading text-lg font-bold text-primary">Ephraim Care</h2>
          <p className="text-xs text-muted-foreground">Participant Portal</p>
        </div>

        <nav className="space-y-1">
          <a href="/dashboard" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
            Dashboard
          </a>
          <a href="/invoices" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
            Invoices
          </a>
          <a href="/profile" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
            Profile
          </a>
        </nav>

        <div className="mt-auto pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {participant.first_name} {participant.last_name}
          </p>
          <p className="text-xs font-medium text-secondary">
            NDIS: {participant.ndis_number}
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
