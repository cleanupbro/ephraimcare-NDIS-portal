import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { WorkerWithProfile } from '@ephraimcare/types'
import { WorkerDetail } from '@/components/workers/worker-detail'

export const metadata = {
  title: 'Worker Detail | Ephraim Care',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function WorkerDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch worker with profile join
  const { data: workerData } = await (supabase
    .from('workers') as any)
    .select(`
      *,
      profiles!inner(first_name, last_name, email, phone)
    `)
    .eq('id', id)
    .single()

  if (!workerData) {
    notFound()
  }

  const worker = workerData as unknown as WorkerWithProfile

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link
          href="/workers"
          className="hover:text-foreground transition-colors"
        >
          Workers
        </Link>
        <span>/</span>
        <span className="text-foreground">
          {worker.profiles.first_name} {worker.profiles.last_name}
        </span>
      </nav>

      <WorkerDetail worker={worker} />
    </div>
  )
}
