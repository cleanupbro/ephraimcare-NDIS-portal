import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { WorkerWithProfile } from '@ephraimcare/types'
import { WorkerEditForm } from '@/components/workers/worker-edit-form'

export const metadata = {
  title: 'Edit Worker | Ephraim Care',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function WorkerEditPage({ params }: PageProps) {
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
        <Link
          href={`/workers/${id}`}
          className="hover:text-foreground transition-colors"
        >
          {worker.profiles.first_name} {worker.profiles.last_name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Edit</span>
      </nav>

      <h1 className="font-heading text-2xl font-bold">
        Edit Worker: {worker.profiles.first_name} {worker.profiles.last_name}
      </h1>

      <WorkerEditForm worker={worker} />
    </div>
  )
}
