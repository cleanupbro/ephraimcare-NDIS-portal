import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Participant } from '@ephraimcare/types'
import { Button } from '@ephraimcare/ui'
import { Plus } from 'lucide-react'
import { ParticipantList } from '@/components/participants/participant-list'

export default async function ParticipantsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('participants')
    .select('*')
    .eq('is_active', true)
    .order('first_name')

  const participants = (data as unknown as Participant[]) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Participants</h1>
          <p className="text-sm text-muted-foreground">
            {participants.length} active participant{participants.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <Button asChild>
          <Link href="/participants/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Participant
          </Link>
        </Button>
      </div>

      <ParticipantList initialData={participants} />
    </div>
  )
}
