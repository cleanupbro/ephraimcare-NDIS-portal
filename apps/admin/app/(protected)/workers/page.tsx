import { createClient } from '@/lib/supabase/server'
import type { WorkerWithProfile } from '@ephraimcare/types'
import { WorkerList } from '@/components/workers/worker-list'

export const metadata = {
  title: 'Workers | Ephraim Care',
}

export default async function WorkersPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('workers')
    .select('*, profiles!inner(first_name, last_name, email, phone)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const workers = (data as unknown as WorkerWithProfile[]) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Workers</h1>
        <p className="text-sm text-muted-foreground">
          {workers.length} active worker{workers.length !== 1 ? 's' : ''} registered
        </p>
      </div>

      <WorkerList initialData={workers} />
    </div>
  )
}
