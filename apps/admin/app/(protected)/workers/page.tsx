import { createClient } from '@/lib/supabase/server'

export default async function WorkersPage() {
  const supabase = await createClient()

  const { data: workers } = await supabase
    .from('workers')
    .select('*, profiles(first_name, last_name, email)')
    .order('created_at') as { data: Array<{
      id: string
      profile_id: string
      employee_id: string | null
      qualification: string[]
      services_provided: string[]
      hourly_rate: number | null
      is_active: boolean
      profiles: { first_name: string; last_name: string; email: string } | null
    }> | null }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Workers</h1>
          <p className="text-sm text-muted-foreground">
            {workers?.length ?? 0} support workers
          </p>
        </div>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          + Add Worker
        </button>
      </div>

      <div className="rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Employee ID</th>
              <th className="px-4 py-3 text-left font-medium">Qualifications</th>
              <th className="px-4 py-3 text-left font-medium">Services</th>
              <th className="px-4 py-3 text-left font-medium">Rate</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {workers?.map((w) => (
              <tr key={w.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-medium">
                    {w.profiles?.first_name} {w.profiles?.last_name}
                  </div>
                  <div className="text-xs text-muted-foreground">{w.profiles?.email}</div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{w.employee_id ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {w.qualification?.slice(0, 2).map((q) => (
                      <span key={q} className="inline-flex rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">
                        {q}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {w.services_provided?.map((s) => (
                      <span key={s} className="inline-flex rounded bg-purple-50 px-1.5 py-0.5 text-xs text-purple-700">
                        {s}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {w.hourly_rate ? `$${w.hourly_rate.toFixed(2)}/hr` : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    w.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {w.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
            {(!workers || workers.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No workers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
