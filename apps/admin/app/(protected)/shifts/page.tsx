import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function ShiftsPage() {
  const supabase = await createClient()

  const { data: shifts } = await supabase
    .from('shifts')
    .select('*, participants(first_name, last_name), workers(profiles(first_name, last_name))')
    .order('scheduled_start', { ascending: false }) as { data: Array<{
      id: string
      scheduled_start: string
      scheduled_end: string
      actual_start: string | null
      actual_end: string | null
      status: string
      notes: string | null
      participants: { first_name: string; last_name: string } | null
      workers: { profiles: { first_name: string; last_name: string } | null } | null
    }> | null }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Australia/Sydney',
    })
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'scheduled': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Shifts</h1>
          <p className="text-sm text-muted-foreground">
            {shifts?.length ?? 0} shifts total
          </p>
        </div>
        <Link
          href="/shifts/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Schedule Shift
        </Link>
      </div>

      <div className="rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Participant</th>
              <th className="px-4 py-3 text-left font-medium">Worker</th>
              <th className="px-4 py-3 text-left font-medium">Scheduled</th>
              <th className="px-4 py-3 text-left font-medium">Duration</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {shifts?.map((s) => {
              const start = new Date(s.scheduled_start)
              const end = new Date(s.scheduled_end)
              const hours = ((end.getTime() - start.getTime()) / 3600000).toFixed(1)

              return (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    {s.participants?.first_name} {s.participants?.last_name}
                  </td>
                  <td className="px-4 py-3">
                    {s.workers?.profiles?.first_name} {s.workers?.profiles?.last_name}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {formatTime(s.scheduled_start)}
                  </td>
                  <td className="px-4 py-3">{hours}h</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getStatusColor(s.status)}`}>
                      {s.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              )
            })}
            {(!shifts || shifts.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No shifts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
