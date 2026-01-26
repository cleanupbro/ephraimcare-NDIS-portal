import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { IncidentDetail } from '@/components/incidents/incident-detail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function IncidentDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch user for NDIA reporting
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch incident with relations
  const { data: incident } = await (supabase
    .from('incidents') as any)
    .select(`
      *,
      participants(id, first_name, last_name, ndis_number),
      workers(id, profiles(first_name, last_name)),
      reporter:profiles!reported_by(first_name, last_name),
      closer:profiles!closed_by(first_name, last_name),
      ndia_reporter:profiles!ndia_reported_by(first_name, last_name),
      shifts(id, scheduled_start, scheduled_end)
    `)
    .eq('id', id)
    .single()

  if (!incident) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link
          href="/incidents"
          className="hover:text-foreground transition-colors"
        >
          Incidents
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-xs">
          {incident.title}
        </span>
      </nav>

      <IncidentDetail incident={incident} userId={user?.id || ''} />
    </div>
  )
}
