import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/layout/admin-sidebar'

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
      <AdminSidebar
        firstName={profile.first_name}
        lastName={profile.last_name}
        role={profile.role}
      />
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
