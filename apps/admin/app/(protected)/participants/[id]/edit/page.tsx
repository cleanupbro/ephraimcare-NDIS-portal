import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Participant } from '@ephraimcare/types'
import { Card, CardContent } from '@ephraimcare/ui'
import { ParticipantEditForm } from '@/components/participants/participant-edit-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ParticipantEditPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch participant by id
  const { data: participantData } = await supabase
    .from('participants')
    .select('*')
    .eq('id', id)
    .single()

  if (!participantData) {
    notFound()
  }

  const participant = participantData as unknown as Participant

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link
          href="/participants"
          className="hover:text-foreground transition-colors"
        >
          Participants
        </Link>
        <span>/</span>
        <Link
          href={`/participants/${participant.id}`}
          className="hover:text-foreground transition-colors"
        >
          {participant.first_name} {participant.last_name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Edit</span>
      </nav>

      {/* Page Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold">
          Edit Participant
        </h1>
        <p className="text-sm text-muted-foreground">
          Update details for {participant.first_name} {participant.last_name}
        </p>
      </div>

      {/* Edit Form */}
      <ParticipantEditForm participant={participant} />
    </div>
  )
}
