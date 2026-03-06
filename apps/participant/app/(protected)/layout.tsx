import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProtectedShell } from '@/components/layout/protected-shell'

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
  const { data: participant } = await (supabase
    .from('participants')
    .select('id, first_name, last_name, ndis_number')
    .eq('profile_id', user.id)
    .single() as any)

  if (!participant) {
    redirect('/unauthorized')
  }

  return (
    <ProtectedShell participant={participant}>
      {children}
    </ProtectedShell>
  )
}
