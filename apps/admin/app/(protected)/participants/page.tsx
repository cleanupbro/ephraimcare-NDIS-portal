import { createClient } from '@/lib/supabase/server'

export default async function ParticipantsPage() {
  const supabase = await createClient()

  const { data: participants } = await supabase
    .from('participants')
    .select('*')
    .order('first_name') as { data: Array<{
      id: string
      ndis_number: string
      first_name: string
      last_name: string
      date_of_birth: string | null
      phone: string | null
      email: string | null
      suburb: string | null
      state: string
      postcode: string | null
      is_active: boolean
    }> | null }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Participants</h1>
          <p className="text-sm text-muted-foreground">
            {participants?.length ?? 0} participants registered
          </p>
        </div>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          + Add Participant
        </button>
      </div>

      <div className="rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">NDIS Number</th>
              <th className="px-4 py-3 text-left font-medium">Phone</th>
              <th className="px-4 py-3 text-left font-medium">Location</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {participants?.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">
                  {p.first_name} {p.last_name}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{p.ndis_number}</td>
                <td className="px-4 py-3">{p.phone ?? '—'}</td>
                <td className="px-4 py-3">
                  {p.suburb ? `${p.suburb}, ${p.state} ${p.postcode}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
            {(!participants || participants.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No participants found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
